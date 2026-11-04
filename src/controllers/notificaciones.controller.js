const pool = require("../database/database");

const listarNotificaciones = async (req, res) => {
    try {
        const [rows] = await pool.query(
            "SELECT id, tipo, mensaje, leida, fecha FROM notificacion WHERE id_usuario = ? ORDER BY fecha DESC",
            [req.usuario.id]
        );

        return res.json({ codigo: 200, estado: "ok", datos: rows });

    } catch(error) {
        return res.status(500).json({ codigo: 500, estado: error.message, datos: null });
    };
};

const marcarLeida = async (req, res) => {
    try {
        const { id } = req.params;

        const [notificaciones] = await pool.query(
            "SELECT id, id_usuario FROM notificacion WHERE id = ?",
            [id]
        );

        if (!notificaciones.length) {
            return res.status(404).json({ codigo: 404, estado: "Notificación no encontrada", datos: null });
        }

        if (notificaciones[0].id_usuario !== req.usuario.id) {
            return res.status(403).json({ codigo: 403, estado: "No podés modificar notificaciones de otros usuarios", datos: null });
        }

        await pool.query("UPDATE notificacion SET leida = 1 WHERE id = ?", [id]);

        return res.json({ codigo: 200, estado: "ok", datos: { mensaje: "Notificación marcada como leída" } });

    } catch(error) {
        return res.status(500).json({ codigo: 500, estado: error.message, datos: null });
    };
};

module.exports = { listarNotificaciones, marcarLeida };
