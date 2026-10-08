const pool = require("../database/database");
const { logDarAlta, logDarBaja }   = require("./logsAuditoria.controller");

const formatearFecha = (fechaISO) => {
    const [anio, mes, dia] = fechaISO.split("-");
    return `${dia}/${mes}/${anio}`;
};

const darAltaTurno = async (req, res) => {
    try {
        const { id_medico, id_especialidad, id_sede, fecha, hora, nota } = req.body;

        let { id_paciente } = req.body;

        if (!id_medico || !id_especialidad || !id_sede || !fecha || !hora) {
            return res.status(400).json({ codigo: 400, estado: "Todos los campos son requeridos", datos: null });
        }

        if (!nota || !nota.trim()) {
            return res.status(400).json({ codigo: 400, estado: "La nota es obligatoria", datos: null });
        }

        if (req.usuario.rol === "paciente") {
            id_paciente = req.usuario.id;
        } else if (req.usuario.rol === "operador") {
            if (!id_paciente) {
                return res.status(400).json({ codigo: 400, estado: "El operador debe indicar el id_paciente", datos: null });
            }
        }

        const [pacientes] = await pool.query(
            "SELECT id, id_cobertura FROM usuario WHERE id = ? AND rol = 'paciente'",
            [id_paciente]
        );

        if (pacientes.length === 0) {
            return res.status(400).json({ codigo: 400, estado: "El id_paciente indicado no corresponde a un paciente existente", datos: null });
        }

        const id_cobertura = pacientes[0].id_cobertura;

        if (!id_cobertura) {
            return res.status(400).json({ codigo: 400, estado: "El paciente no tiene una cobertura asignada", datos: null });
        }

        const [agendas] = await pool.query(
            "SELECT id, hora_entrada, hora_salida FROM agenda WHERE id_medico = ? AND id_especialidad = ? AND id_sede = ? AND fecha = ?",
            [id_medico, id_especialidad, id_sede, fecha]
        );

        if (agendas.length === 0) {
            return res.status(404).json({ codigo: 404, estado: "No existe agenda para ese medico, especialidad, sede y fecha", datos: null });
        }

        const agenda = agendas.find(a => hora >= a.hora_entrada && hora < a.hora_salida);

        if (!agenda) {
            return res.status(400).json({ codigo: 400, estado: "La hora ingresada no esta dentro del horario de atencion del medico", datos: null });
        }

        const [ocupado] = await pool.query(
            "SELECT id FROM turno WHERE id_agenda = ? AND fecha = ? AND hora = ? AND estado = 'confirmado'",
            [agenda.id, fecha, hora]
        );

        if (ocupado.length > 0) {
            return res.status(400).json({ codigo: 400, estado: "Ese horario ya se encuentra reservado", datos: null });
        }

        const [result] = await pool.query(
            "INSERT INTO turno (nota, id_agenda, fecha, hora, id_paciente, id_cobertura, estado) VALUES (?, ?, ?, ?, ?, ?, 'confirmado')",
            [nota.trim(), agenda.id, fecha, hora, id_paciente, id_cobertura]
        );

        const mensaje = `Tu turno del ${formatearFecha(fecha)} a las ${hora} fue confirmado.`;
        await pool.query(
            "INSERT INTO notificacion (id_usuario, tipo, mensaje, leida) VALUES (?, 'turno_confirmado', ?, 0)",
            [id_paciente, mensaje]
        );

        try {
            await logDarAlta(req.usuario.id, "ALTA", "turno", result.insertId, `Turno con ID ${result.insertId} creado para paciente ID ${id_paciente} con nota: ${nota.trim()}, fecha: ${fecha}, hora: ${hora}, cobertura ID: ${id_cobertura}, agenda ID: ${agenda.id}`);
        } catch (logError) {
            console.error("Error al registrar el log de alta:", logError);
        }

        return res.status(201).json({
            codigo: 201,
            estado: "ok",
            datos: {
                id: result.insertId,
                nota: nota.trim(),
                id_agenda: agenda.id,
                fecha,
                hora,
                id_paciente,
                id_cobertura,
                estado: "confirmado"
            }
        });
    } catch (error) {
        return res.status(500).json({ codigo: 500, estado: error.message, datos: null });
    }
};

const darDeBajaTurno = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ codigo: 400, estado: "Campo requerido vacio", datos: null });
        }

        if (req.usuario.rol === "administrador") {
            return res.status(403).json({ codigo: 403, estado: "Rol de usuario no permitido para esta accion", datos: null });
        };

        const [turnoExiste] = await pool.query(
            "SELECT t.*, a.id_sede FROM turno t INNER JOIN agenda a ON a.id = t.id_agenda WHERE t.id = ? AND t.estado = 'confirmado'",
            [id]
        );

        if (turnoExiste.length === 0) {
            return res.status(404).json({ codigo: 404, estado: "Turno no encontrado", datos: null });
        }

        if (req.usuario.rol === "paciente") {
            if (turnoExiste[0].id_paciente !== req.usuario.id) {
                return res.status(403).json({ codigo: 403, estado: "No tenés permisos para cancelar este turno", datos: null });
            }
            await pool.query("UPDATE turno SET estado = 'cancelado' WHERE id = ?", [id]);
        };

        if (req.usuario.rol === "operador" || req.usuario.rol === "medico") {
            if (turnoExiste[0].id_sede !== req.usuario.id_sede) {
                return res.status(403).json({ codigo: 403, estado: "No tiene permisos para cancelar un turno de otra sede", datos: null });
            };
            await pool.query("UPDATE turno SET estado = 'cancelado' WHERE id = ?", [id]);
        };

        const mensaje = `Tu turno del ${formatearFecha(turnoExiste[0].fecha)} a las ${turnoExiste[0].hora} fue cancelado.`;
        await pool.query(
            "INSERT INTO notificacion (id_usuario, tipo, mensaje, leida) VALUES (?, 'turno_cancelado', ?, 0)",
            [turnoExiste[0].id_paciente, mensaje]
        );

        try {
            await logDarBaja(
  req.usuario.id,
  "BAJA",
  "turno",
  id,
  `Turno con ID ${id} cancelado para paciente ID ${turnoExiste[0].id_paciente}, fecha: ${turnoExiste[0].fecha}, hora: ${turnoExiste[0].hora}`
);
        } catch (logError) {
            console.error("Error al registrar el log de baja:", logError);
        }

        return res.status(200).json({
            codigo: 200,
            estado: "Turno cancelado correctamente",
            datos: {
                id: turnoExiste[0].id,
                id_sede: turnoExiste[0].id_sede,
                nota: turnoExiste[0].nota,
                fecha: turnoExiste[0].fecha,
                hora: turnoExiste[0].hora,
                estado: "cancelado",
                id_paciente: turnoExiste[0].id_paciente,
                id_cobertura: turnoExiste[0].id_cobertura,
                id_agenda: turnoExiste[0].id_agenda
            }
        });

    } catch(error) {
        return res.status(500).json({ codigo: 500, estado: error.message, datos: null });
    };
};

//--Solo cambia el estado a atendido y genera notificacion--
//--El historial se carga por separado con POST /:id/historial--
const atenderTurno = async (req, res) => {
    try {
        const { id } = req.params;

        const [turnoExiste] = await pool.query(
            "SELECT t.*, a.id_medico FROM turno t INNER JOIN agenda a ON a.id = t.id_agenda WHERE t.id = ? AND t.estado = 'confirmado'",
            [id]
        );

        if (turnoExiste.length === 0) {
            return res.status(404).json({ codigo: 404, estado: "Turno no encontrado o no está confirmado", datos: null });
        }

        if (turnoExiste[0].id_medico !== req.usuario.id) {
            return res.status(403).json({ codigo: 403, estado: "Solo podés atender tus propios turnos", datos: null });
        }

        await pool.query("UPDATE turno SET estado = 'atendido' WHERE id = ?", [id]);

        const mensaje = `Tu turno del ${formatearFecha(turnoExiste[0].fecha)} a las ${turnoExiste[0].hora} fue atendido. Ya podés consultar tu historial clínico.`;
        await pool.query(
            "INSERT INTO notificacion (id_usuario, tipo, mensaje, leida) VALUES (?, 'turno_atendido', ?, 0)",
            [turnoExiste[0].id_paciente, mensaje]
        );

        return res.status(200).json({
            codigo: 200,
            estado: "ok",
            datos: {
                turno_id: id,
                estado: "atendido"
            }
        });

    } catch(error) {
        return res.status(500).json({ codigo: 500, estado: error.message, datos: null });
    };
};

const misTurnos = async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT t.id, t.fecha, t.hora, t.estado, t.nota,
                    u.nombre AS medico_nombre, u.apellido AS medico_apellido,
                    e.descripcion AS especialidad, s.nombre AS sede
             FROM turno t
             JOIN agenda a ON a.id = t.id_agenda
             JOIN usuario u ON u.id = a.id_medico
             JOIN especialidad e ON e.id = a.id_especialidad
             JOIN sede s ON s.id = a.id_sede
             WHERE t.id_paciente = ?
             ORDER BY t.fecha ASC, t.hora ASC`,
            [req.usuario.id]
        );

        return res.json({ codigo: 200, estado: "ok", datos: rows });

    } catch(error) {
        return res.status(500).json({ codigo: 500, estado: error.message, datos: null });
    };
};

const turnosMedico = async (req, res) => {
    try {
        const { fecha } = req.query;

        if (!fecha) {
            return res.status(400).json({ codigo: 400, estado: "La fecha es requerida", datos: null });
        }

        const [rows] = await pool.query(
            `SELECT t.id, t.fecha, t.hora, t.estado, t.nota,
                    u.nombre AS paciente_nombre, u.apellido AS paciente_apellido,
                    e.descripcion AS especialidad, s.nombre AS sede
             FROM turno t
             JOIN agenda a ON a.id = t.id_agenda
             JOIN usuario u ON u.id = t.id_paciente
             JOIN especialidad e ON e.id = a.id_especialidad
             JOIN sede s ON s.id = a.id_sede
             WHERE a.id_medico = ? AND t.fecha = ?
             ORDER BY t.hora ASC`,
            [req.usuario.id, fecha]
        );

        return res.json({ codigo: 200, estado: "ok", datos: rows });

    } catch(error) {
        return res.status(500).json({ codigo: 500, estado: error.message, datos: null });
    };
};

const turnosSede = async (req, res) => {
    try {
        const { fecha } = req.query;

        if (!fecha) {
            return res.status(400).json({ codigo: 400, estado: "La fecha es requerida", datos: null });
        }

        const [rows] = await pool.query(
            `SELECT t.id, t.fecha, t.hora, t.estado, t.nota,
                    p.nombre AS paciente_nombre, p.apellido AS paciente_apellido,
                    m.nombre AS medico_nombre, m.apellido AS medico_apellido,
                    e.descripcion AS especialidad
             FROM turno t
             JOIN agenda a ON a.id = t.id_agenda
             JOIN usuario p ON p.id = t.id_paciente
             JOIN usuario m ON m.id = a.id_medico
             JOIN especialidad e ON e.id = a.id_especialidad
             WHERE a.id_sede = ? AND t.fecha = ?
             ORDER BY t.hora ASC`,
            [req.usuario.id_sede, fecha]
        );

        return res.json({ codigo: 200, estado: "ok", datos: rows });

    } catch(error) {
        return res.status(500).json({ codigo: 500, estado: error.message, datos: null });
    };
};

module.exports = { darAltaTurno, darDeBajaTurno, atenderTurno, misTurnos, turnosMedico, turnosSede };
