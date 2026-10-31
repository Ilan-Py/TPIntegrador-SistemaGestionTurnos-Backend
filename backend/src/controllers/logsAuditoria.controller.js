const database = require("../database/database");

const esFechaValida = (valor) => {
    if (typeof valor !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
        return false;
    }
    const fecha = new Date(`${valor}T00:00:00.000Z`);
    return !Number.isNaN(fecha.getTime()) && fecha.toISOString().slice(0, 10) === valor;
};

const listarAuditoria = async (req, res) => {
    try {
        const paginaSolicitada = Number.parseInt(req.query.pagina, 10) || 1;
        const limiteSolicitado = Number.parseInt(req.query.limite, 10) || 10;
        if (paginaSolicitada < 1 || limiteSolicitado < 1) {
            return res.status(400).json({
                codigo: 400,
                estado: "La página y el límite deben ser mayores que cero",
                datos: null
            });
        }

        const pagina = paginaSolicitada;
        const limite = Math.min(limiteSolicitado, 100);
        const usuario = typeof req.query.usuario === "string" ? req.query.usuario.trim() : "";
        const entidad = typeof req.query.entidad === "string" ? req.query.entidad.trim() : "";
        const fechaDesde = typeof req.query.fechaDesde === "string" ? req.query.fechaDesde.trim() : "";
        const fechaHasta = typeof req.query.fechaHasta === "string" ? req.query.fechaHasta.trim() : "";

        if ((fechaDesde && !esFechaValida(fechaDesde)) || (fechaHasta && !esFechaValida(fechaHasta))) {
            return res.status(400).json({
                codigo: 400,
                estado: "El formato de fecha es inválido. Debe ser YYYY-MM-DD",
                datos: null
            });
        }
        if (fechaDesde && fechaHasta && fechaDesde > fechaHasta) {
            return res.status(400).json({
                codigo: 400,
                estado: "La fecha de inicio no puede ser posterior a la fecha de fin",
                datos: null
            });
        }

        const condiciones = [];
        const parametros = [];
        if (usuario) {
            condiciones.push(
                "(CAST(la.id_usuario AS CHAR) = ? OR u.nombre LIKE ? OR u.apellido LIKE ? OR " +
                "CONCAT(u.nombre, ' ', u.apellido) LIKE ? OR u.dni LIKE ? OR u.email LIKE ? OR " +
                "CAST(la.id_entidad AS CHAR) = ? OR objetivo.nombre LIKE ? OR objetivo.apellido LIKE ? OR " +
                "CONCAT(objetivo.nombre, ' ', objetivo.apellido) LIKE ? OR objetivo.dni LIKE ? OR objetivo.email LIKE ?)"
            );
            const busqueda = `%${usuario}%`;
            parametros.push(
                usuario, busqueda, busqueda, busqueda, busqueda, busqueda,
                usuario, busqueda, busqueda, busqueda, busqueda, busqueda
            );
        }
        if (entidad) {
            condiciones.push("la.entidad LIKE ?");
            parametros.push(`%${entidad}%`);
        }
        if (fechaDesde) {
            condiciones.push("la.fecha >= ?");
            parametros.push(`${fechaDesde} 00:00:00`);
        }
        if (fechaHasta) {
            condiciones.push("la.fecha < DATE_ADD(?, INTERVAL 1 DAY)");
            parametros.push(`${fechaHasta} 00:00:00`);
        }

        const where = condiciones.length ? `WHERE ${condiciones.join(" AND ")}` : "";
        const [conteo] = await database.query(
            `SELECT COUNT(*) AS total
             FROM log_auditoria la
             LEFT JOIN usuario u ON u.id = la.id_usuario
             LEFT JOIN usuario objetivo
               ON la.entidad = 'usuario' AND objetivo.id = la.id_entidad
             ${where}`,
            parametros
        );
        const total = Number(conteo[0].total);
        const totalPaginas = Math.ceil(total / limite);
        const offset = (pagina - 1) * limite;
        const [registros] = await database.query(
            `SELECT la.id, la.id_usuario, la.id_entidad, la.accion, la.entidad, la.detalle, la.fecha,
                    CONCAT_WS(' ', u.nombre, u.apellido) AS usuario,
                    CASE WHEN la.entidad = 'usuario'
                         THEN CONCAT_WS(' ', objetivo.nombre, objetivo.apellido)
                         ELSE NULL
                    END AS usuario_afectado
             FROM log_auditoria la
             LEFT JOIN usuario u ON u.id = la.id_usuario
             LEFT JOIN usuario objetivo
               ON la.entidad = 'usuario' AND objetivo.id = la.id_entidad
             ${where}
             ORDER BY la.fecha DESC, la.id DESC
             LIMIT ? OFFSET ?`,
            [...parametros, limite, offset]
        );

        return res.status(200).json({
            codigo: 200,
            estado: "ok",
            datos: { registros, pagina, limite, total, totalPaginas }
        });
    } catch (error) {
        console.error("Error al listar la auditoría:", error);
        return res.status(500).json({
            codigo: 500,
            estado: "No se pudo obtener el registro de auditoría",
            datos: null
        });
    }
};

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
    listarAuditoria,
    logDarAlta,
    logDarBaja,
    logModificar,
    listarLogAuditoria
};