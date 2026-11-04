const pool = require("../database/database");

//1 - Registrar historial clinico de un turno atendido
const registrarHistorial = async (req, res) => {
    try {
        const { id } = req.params;
        const { diagnostico, tratamiento, observaciones } = req.body;

        if (!diagnostico) {
            return res.status(400).json({ codigo: 400, estado: "El diagnóstico es requerido", datos: null });
        }

        // Las tres columnas son varchar(255) en la base.
        for (const [campo, valor] of [["diagnóstico", diagnostico], ["tratamiento", tratamiento], ["observaciones", observaciones]]) {
            if (valor && String(valor).length > 255) {
                return res.status(400).json({ codigo: 400, estado: `El campo ${campo} no puede superar los 255 caracteres`, datos: null });
            }
        }

        const [turnoExiste] = await pool.query(
            "SELECT t.*, a.id_medico FROM turno t INNER JOIN agenda a ON a.id = t.id_agenda WHERE t.id = ? AND t.estado = 'atendido'",
            [id]
        );

        if (turnoExiste.length === 0) {
            return res.status(404).json({ codigo: 404, estado: "Turno no encontrado o no está en estado atendido", datos: null });
        }

        if (turnoExiste[0].id_medico !== req.usuario.id) {
            return res.status(403).json({ codigo: 403, estado: "Solo podés registrar historial de tus propios turnos", datos: null });
        }

        const [yaExiste] = await pool.query(
            "SELECT id FROM historial_clinico WHERE id_turno = ?",
            [id]
        );

        if (yaExiste.length > 0) {
            return res.status(400).json({ codigo: 400, estado: "Ya existe un historial clínico para este turno", datos: null });
        }

        const [result] = await pool.query(
            "INSERT INTO historial_clinico (id_turno, id_medico, id_paciente, diagnostico, tratamiento, observaciones) VALUES (?, ?, ?, ?, ?, ?)",
            [id, req.usuario.id, turnoExiste[0].id_paciente, diagnostico, tratamiento || null, observaciones || null]
        );

        return res.status(201).json({
            codigo: 201,
            estado: "ok",
            datos: {
                id: result.insertId,
                id_turno: id,
                id_medico: req.usuario.id,
                id_paciente: turnoExiste[0].id_paciente,
                diagnostico,
                tratamiento: tratamiento || null,
                observaciones: observaciones || null
            }
        });

    } catch(error) {
        return res.status(500).json({ codigo: 500, estado: error.message, datos: null });
    };
};

//2 - Consultar historial clinico de un paciente
const obtenerHistorial = async (req, res) => {
    try {
        const { id_paciente } = req.params;
        const usuario = req.usuario;

        if (usuario.rol === "paciente" && Number(id_paciente) !== usuario.id) {
            return res.status(403).json({ codigo: 403, estado: "Solo podés ver tu propio historial clínico", datos: null });
        }

        let query;
        let params;

        if (usuario.rol === "medico") {
            query = `
                SELECT h.id, h.diagnostico, h.tratamiento, h.observaciones, h.fecha_registro,
                       t.fecha AS fecha_turno, t.hora AS hora_turno,
                       u.nombre AS paciente_nombre, u.apellido AS paciente_apellido
                FROM historial_clinico h
                JOIN turno t ON t.id = h.id_turno
                JOIN usuario u ON u.id = h.id_paciente
                WHERE h.id_paciente = ? AND h.id_medico = ?
                ORDER BY h.fecha_registro DESC
            `;
            params = [id_paciente, usuario.id];
        } else {
            query = `
                SELECT h.id, h.diagnostico, h.tratamiento, h.observaciones, h.fecha_registro,
                       t.fecha AS fecha_turno, t.hora AS hora_turno,
                       m.nombre AS medico_nombre, m.apellido AS medico_apellido,
                       e.descripcion AS especialidad
                FROM historial_clinico h
                JOIN turno t ON t.id = h.id_turno
                JOIN agenda a ON a.id = t.id_agenda
                JOIN usuario m ON m.id = h.id_medico
                JOIN especialidad e ON e.id = a.id_especialidad
                WHERE h.id_paciente = ?
                ORDER BY h.fecha_registro DESC
            `;
            params = [id_paciente];
        }

        const [rows] = await pool.query(query, params);

        return res.json({ codigo: 200, estado: "ok", datos: rows });

    } catch(error) {
        return res.status(500).json({ codigo: 500, estado: error.message, datos: null });
    };
};

module.exports = { registrarHistorial, obtenerHistorial };
