const pool = require("../database/database");
const { logDarAlta, logModificar, logDarBaja }   = require("./logsAuditoria.controller");

const listarEspecialidades = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM especialidad");
    return res.json({ codigo: 200, estado: "ok", datos: rows });
  } catch (error) {
    return res.status(500).json({ codigo: 500, estado: error.message, datos: null });
  }
};

const darDeAlta = async (req, res) => {
  try {
    const { descripcion } = req.body;

    if (!descripcion) {
      return res.status(400).json({ codigo: 400, estado: "La descripción es requerida", datos: null });
    }

    const [result] = await pool.query(
      "INSERT INTO especialidad (descripcion) VALUES (?)",
      [descripcion]
    );
    
    try {
      await logDarAlta(req.usuario.id, "ALTA", "especialidad", result.insertId, `Especialidad con ID ${result.insertId} creada con descripción: ${descripcion}`);
    } catch (logError) {
      console.error("Error al registrar el log de alta:", logError);
    }

    return res.status(201).json({ codigo: 201, estado: "ok", datos: { id: result.insertId, descripcion } });

  } catch (error) {
    return res.status(500).json({ codigo: 500, estado: error.message, datos: null });
  }
};

const actualizarEspecialidad = async (req, res) => {
  try {
    const { id } = req.params;
    const { descripcion } = req.body;

    if (!descripcion) {
      return res.status(400).json({ codigo: 400, estado: "La descripción es requerida", datos: null });
    }

    const [especialidadExiste] = await pool.query("SELECT id FROM especialidad WHERE id = ?", [id]);
    if (especialidadExiste.length === 0) {
      return res.status(404).json({ codigo: 404, estado: "Especialidad no encontrada", datos: null });
    }

    await pool.query(
      "UPDATE especialidad SET descripcion = ? WHERE id = ?",
      [descripcion, id]
    );

    try {
      await logModificar(req.usuario.id, "MODIFICACION", "especialidad", id, `Especialidad con ID ${id} actualizada a descripción: ${descripcion}`);
    } catch (logError) {
      console.error("Error al registrar el log de modificación:", logError);
    }

    return res.json({ codigo: 200, estado: "ok", datos: { id, descripcion } });

  } catch (error) {
    return res.status(500).json({ codigo: 500, estado: error.message, datos: null });
  }
};

const darDeBaja = async (req, res) => {
  try {
    const { id } = req.params;

    const [especialidadExiste] = await pool.query("SELECT id FROM especialidad WHERE id = ?", [id]);
    if (especialidadExiste.length === 0) {
      return res.status(404).json({ codigo: 404, estado: "Especialidad no encontrada", datos: null });
    }

    const [medicosAsociados] = await pool.query(
      "SELECT id FROM medico_especialidad WHERE id_especialidad = ?",
      [id]
    );
    if (medicosAsociados.length > 0) {
      return res.status(400).json({
        codigo: 400,
        estado: "No se puede eliminar: la especialidad tiene médicos asociados",
        datos: null
      });
    }

    await pool.query("DELETE FROM especialidad WHERE id = ?", [id]);

    try {
      await logDarBaja(req.usuario.id, "BAJA", "especialidad", id, `Especialidad con ID ${id} eliminada`);
    } catch (logError) {
      console.error("Error al registrar el log de baja:", logError);
    }

    return res.json({ codigo: 200, estado: "ok", datos: { mensaje: "Especialidad eliminada correctamente" } });

  } catch (error) {
    return res.status(500).json({ codigo: 500, estado: error.message, datos: null });
  }
};

module.exports = { listarEspecialidades, darDeAlta, actualizarEspecialidad, darDeBaja };
