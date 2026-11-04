const pool = require("../database/database");
const { logDarAlta, logModificar, logDarBaja }   = require("./logsAuditoria.controller");

const darAltaAgenda = async (req, res) => {
    try {
        const { hora_entrada, hora_salida, fecha, id_especialidad, id_sede } = req.body;
        let { id_medico } = req.body;

        if (req.usuario.rol === "medico") {
            id_medico = req.usuario.id; 
        }

        if (!hora_entrada || !hora_salida || !fecha || !id_medico || !id_especialidad || !id_sede) {
            return res.status(400).json({
                codigo: 400, 
                estado: "Todos los campos son requeridos", 
                datos: null
            });
        } 

        const [medicoExiste] = await pool.query(
            "SELECT id FROM usuario WHERE id = ? AND rol = 'medico'",
            [id_medico]
        );

        if (medicoExiste.length === 0) {
            return res.status(400).json({
                codigo: 400,
                estado: "El id_medico indicado no corresponde a un médico existente",
                datos: null
            });
        }

        if (hora_entrada >= hora_salida) {
            return res.status(400).json({
                codigo: 400,
                estado: "La hora de entrada debe ser menor a la hora de salida",
                datos: null
            });
        }

        const [solapes] = await pool.query(
            "SELECT id FROM agenda WHERE id_medico = ? AND fecha = ? AND (? < hora_salida AND ? > hora_entrada)",
            [id_medico, fecha, hora_entrada, hora_salida]
        );

        if (solapes.length > 0) {
            return res.status(400).json({
                codigo: 400,
                estado: "El médico ya posee un rango horario que se solapa en esta fecha",
                datos: null
            });
        }

        const [result] = await pool.query(
            "INSERT INTO agenda(hora_entrada, hora_salida, fecha, id_medico, id_especialidad, id_sede) VALUES (?, ?, ?, ?, ?, ?)",
            [hora_entrada, hora_salida, fecha, id_medico, id_especialidad, id_sede]
        );

        try {

          await logDarAlta(req.usuario.id, "ALTA", "agenda", result.insertId, `Se dio de alta la agenda con id ${result.insertId}`);

        } catch (error) {
          console.error("Error al registrar el log de alta de auditoría: ", error);
        }

        return res.status(201).json({
            codigo: 201, 
            estado: "ok", 
            datos: {
                id: result.insertId, 
                hora_entrada, 
                hora_salida, 
                fecha, 
                id_medico, 
                id_especialidad, 
                id_sede 
            }
        });
    } catch (error) {
        return res.status(500).json({
            codigo: 500, 
            estado: error.message, 
            datos: null
        });
    }
};

const listarAgenda = async (req, res) => {
    try {
        const { id_sede, fecha } = req.query;
        let { id_medico } = req.query;

        if (req.usuario.rol === "medico") {
            id_medico = req.usuario.id; 
        }

        let query = "SELECT * FROM agenda WHERE 1=1";
        let queryParams = [];

        if (id_medico) {
            query += " AND id_medico = ?";
            queryParams.push(id_medico);
        }

        if (id_sede) {
            query += " AND id_sede = ?";
            queryParams.push(id_sede);
        }

        if (fecha) {
            query += " AND fecha = ?";
            queryParams.push(fecha);
        } else {
            const hoy = new Date().toISOString().split('T')[0];
            query += " AND fecha >= ?";
            queryParams.push(hoy);
        }

        query += " ORDER BY fecha ASC, hora_entrada ASC";

        const [rows] = await pool.query(query, queryParams);

        return res.status(200).json({
            codigo: 200, 
            estado: "ok", 
            datos: rows
        });
    } catch (error) {
        return res.status(500).json({
            codigo: 500, 
            estado: error.message, 
            datos: null
        });
    }
};

const actualizarAgenda = async (req, res) => {
  try {
    const { id } = req.params;
    const { hora_entrada, hora_salida, fecha, id_especialidad, id_sede } = req.body;
    let { id_medico } = req.body;

    // El médico no necesita enviar id_medico: se toma del token (igual que en el alta).
    if (!hora_entrada || !hora_salida || !fecha || (!id_medico && req.usuario.rol !== "medico") || !id_especialidad || !id_sede) {
      return res.status(400).json({ codigo: 400, estado: "Todos los campos son requeridos", datos: null });
    }

    const [agendaExiste] = await pool.query(
      "SELECT *, DATE_FORMAT(fecha, '%Y-%m-%d') AS fecha_iso FROM agenda WHERE id = ?",
      [id]
    );
    if (agendaExiste.length === 0) {
      return res.status(404).json({ codigo: 404, estado: "Agenda no encontrada", datos: null });
    }

    if (req.usuario.rol === "medico") {
      if (agendaExiste[0].id_medico !== req.usuario.id) {
        return res.status(403).json({ codigo: 403, estado: "No tenés permisos para modificar esta agenda", datos: null });
      }
      id_medico = req.usuario.id;
    }

    // Si el rango tiene turnos confirmados, no se puede mover a otro día/médico/especialidad/sede
    // ni achicar el horario dejando algún turno confirmado afuera.
    const [turnosConfirmados] = await pool.query(
      "SELECT hora FROM turno WHERE id_agenda = ? AND estado = 'confirmado'",
      [id]
    );

    if (turnosConfirmados.length > 0) {
      const actual = agendaExiste[0];
      const cambiaDatos =
        fecha !== actual.fecha_iso ||
        Number(id_medico) !== actual.id_medico ||
        Number(id_especialidad) !== actual.id_especialidad ||
        Number(id_sede) !== actual.id_sede;

      if (cambiaDatos) {
        return res.status(400).json({
          codigo: 400,
          estado: "No se puede cambiar la fecha, el médico, la especialidad ni la sede de un rango horario con turnos confirmados",
          datos: null
        });
      }

      const turnosAfuera = turnosConfirmados.filter(t => t.hora < hora_entrada || t.hora >= hora_salida);
      if (turnosAfuera.length > 0) {
        return res.status(400).json({
          codigo: 400,
          estado: `No se puede modificar: ${turnosAfuera.length} turno(s) confirmado(s) quedarían fuera del nuevo horario (${turnosAfuera.map(t => t.hora).join(", ")})`,
          datos: null
        });
      }
    }

    const [medicoExiste] = await pool.query(
      "SELECT id FROM usuario WHERE id = ? AND rol = 'medico'",
      [id_medico]
    );

    if (medicoExiste.length === 0) {
      return res.status(400).json({
        codigo: 400,
        estado: "El id_medico indicado no corresponde a un médico existente",
        datos: null
      });
    }

    if (hora_entrada >= hora_salida) {
      return res.status(400).json({ codigo: 400, estado: "La hora de entrada debe ser menor a la hora de salida", datos: null });
    }

    const [solapes] = await pool.query(
      "SELECT id FROM agenda WHERE id_medico = ? AND fecha = ? AND id != ? AND (? < hora_salida AND ? > hora_entrada)",
      [id_medico, fecha, id, hora_entrada, hora_salida]
    );

    if (solapes.length > 0) {
      return res.status(400).json({ codigo: 400, estado: "El médico ya posee un rango horario que se solapa en esta fecha", datos: null });
    }

    await pool.query(
      "UPDATE agenda SET hora_entrada = ?, hora_salida = ?, fecha = ?, id_medico = ?, id_especialidad = ?, id_sede = ? WHERE id = ?",
      [hora_entrada, hora_salida, fecha, id_medico, id_especialidad, id_sede, id]
    );

    try {

      await logModificar(req.usuario.id, "MODIFICACION", "agenda", id, `Se modificó la agenda con id ${id}`);

    } catch (error) {
      console.error("Error al registrar el log de modificación de auditoría: ", error);
    }

    return res.json({ 
      codigo: 200, 
      estado: "ok", 
      datos: { id, hora_entrada, hora_salida, fecha, id_medico, id_especialidad, id_sede } 
    });

  } catch (error) {
    return res.status(500).json({ codigo: 500, estado: error.message, datos: null });
  }
};

const darDeBajaAgenda = async (req, res) => {
  try {
    const { id } = req.params;

    const [agendaExiste] = await pool.query("SELECT * FROM agenda WHERE id = ?", [id]);
    if (agendaExiste.length === 0) {
      return res.status(404).json({ codigo: 404, estado: "Agenda no encontrada", datos: null });
    }

    if (req.usuario.rol === "medico") {
      if (agendaExiste[0].id_medico !== req.usuario.id) {
        return res.status(403).json({ codigo: 403, estado: "No tenés permisos para eliminar esta agenda", datos: null });
      }
    }

    // Un rango con turnos (de cualquier estado) no se puede borrar: los turnos lo referencian.
    const [turnos] = await pool.query(
      "SELECT SUM(estado = 'confirmado') AS confirmados, COUNT(*) AS total FROM turno WHERE id_agenda = ?",
      [id]
    );

    if (Number(turnos[0].confirmados) > 0) {
      return res.status(400).json({
        codigo: 400,
        estado: "No se puede eliminar: el rango horario tiene turnos confirmados",
        datos: null
      });
    }

    if (Number(turnos[0].total) > 0) {
      return res.status(400).json({
        codigo: 400,
        estado: "No se puede eliminar: el rango horario tiene turnos atendidos o cancelados registrados",
        datos: null
      });
    }

    await pool.query("DELETE FROM agenda WHERE id = ?", [id]);

    try {

      await logDarBaja(req.usuario.id, "BAJA", "agenda", id, `Se dio de baja la agenda con id ${id}`);

    } catch (error) {
      console.error("Error al registrar el log de baja de auditoría: ", error);
    }

    return res.json({ 
      codigo: 200, 
      estado: "ok", 
      datos: { id } 
    });

  } catch (error) {
    return res.status(500).json({ codigo: 500, estado: error.message, datos: null });
  }
};

module.exports = { darAltaAgenda, listarAgenda, actualizarAgenda, darDeBajaAgenda};