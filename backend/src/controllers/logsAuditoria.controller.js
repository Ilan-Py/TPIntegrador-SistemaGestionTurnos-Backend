const database = require("../database/database");

const formatearFecha = (fechas) => {
    const fecha = new Date(fechas);

    if (isNaN(fecha.getTime())) {
        return null;
    };

    return fecha;
};

const listarLogAuditoria = async (req, res) => {
    try {

        const { usuario, entidad, fechaDesde, fechaHasta } = req.body;

        if (req.usuario.rol !== "administrador") {
            return res.status(403).json ({
                codigo: 403,
                estado: "Solo el usuario administrador tiene permisos",
                datos: null
            });
        };

        if (!usuario || !entidad || !fechaDesde || !fechaHasta) {
            return res.status(400).json({
                codigo: 400,
                estado: "Faltan datos obligatorios",
                datos: null
            });
        };

        if (!usuario.trim() || !entidad.trim() || !fechaDesde.trim() || !fechaHasta.trim()) {
            return res.status(400).json({
                codigo: 400,
                estado: "Los campos no pueden estar vacíos",
                datos: null
            });
        };

        const desde = formatearFecha(fechaDesde);
        const hasta = formatearFecha(fechaHasta);

        if (desde === null || hasta === null) {
            return res.status(400).json({
                codigo: 400,
                estado: "El formato de fecha es inválido. Debe ser YYYY-MM-DD",
                datos: null
            });
        }

        if (desde > hasta) {
            return res.status(400).json({
                codigo: 400,
                estado: "La fecha de inicio no puede ser posterior a la fecha de fin",
                datos: null
            });
        }

        const [logs] = await database.query(
            `SELECT * FROM log_auditoria la
            WHERE (id_usuario = ? AND entidad = ? AND fecha BETWEEN ? AND ?)`,
            [usuario, entidad, desde, hasta]
        );

        if (logs.length === 0) {
            return res.status(404).json({
                codigo: 404,
                estado: "No se encontraron logs de auditoría para los criterios especificados",
                datos: null
            });
        }

        return res.status(200).json({
            codigo: 200,
            estado: "Logs de auditoría listados correctamente",
            datos: logs
        });

    } catch (error) {
        console.error("Error al listar el log de auditoría:", error);
        return res.status(500).json({
            codigo: 500,
            estado: "Error interno del servidor",
            datos: null
        });
    }
};

const log = async (id_usuario, accion, entidad, id_entidad, detalle) => {

    try {
        const [logs] = await database.query(
        "INSERT INTO log_auditoria (id_usuario, accion, entidad, id_entidad, detalle) VALUES (?, ?, ?, ?, ?)",
        [id_usuario, accion, entidad, id_entidad, detalle]
    );

    return logs.insertId;

    } catch (error) {
        console.error("Error al dar el log de alta de auditoría: ", error);
    }

};

const logDarAlta = log;

const logDarBaja = log;

const logModificar = log;

module.exports = {
    logDarAlta,
    logDarBaja,
    logModificar,
    listarLogAuditoria
};