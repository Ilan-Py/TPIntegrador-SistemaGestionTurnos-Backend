const pool = require("../database/database");

const formatearFecha = (fechas) => {
    const fecha = new Date(fechas);

    if (isNaN(fecha.getTime())) {
        return null;
    };

    return fecha;
};

//Muestra de turnos por especialidad - Administrador
const turnosPorEspecialidad = async (req, res) =>  {

    try {

        //Si el rol distinto de Admin. error 403
        if (req.usuario.rol !== "administrador") {
                return res.status(403).json ({
                    codigo: 403,
                    estado: "Solo el administrador puede acceder a los reportes y estadisticas",
                    datos: null
                });
            }

            const { desde, hasta, id_especialidad } = req.body;

            //Si los input no son string, estan vacios o son solo espacios error 400
            if (typeof desde !== "string" || typeof hasta !== "string" || !desde.trim() || !hasta.trim()) {
                return res.status(400).json({
                    codigo: 400,
                    estado: "Fecha ingresada invalida"
                });
            };

            //Si los input no pertenecen al tipo Date error 400
            if (!(formatearFecha(desde) instanceof Date) || !(formatearFecha(hasta) instanceof Date)) {
                return res.status(400).json({
                    codigo: 400,
                    estado: "Dato ingresado invalido, formato de fecha año-mes-día"
                });
            };

            //Si la primer fecha es mayor error 400
            if (formatearFecha(desde) > formatearFecha(hasta)) {
                return res.status(400).json({
                    codigo: 400,
                    estado: "La primer fecha debe ser menor o igual a la segunda fecha"
                });
            };

            const fechaDesde = formatearFecha(desde).toLocaleDateString('en-CA');
            const fechaHasta = formatearFecha(hasta).toLocaleDateString('en-CA');

            //Si el input id no es un dato numero o esta vacio error 400
            if (!id_especialidad || isNaN(id_especialidad) || id_especialidad <= 0) {
                return res.status(400).json({
                    codigo: 400,
                    estado: "Dato ingresado invalido",
                    datos: null
                });
            }

        const [turnos] = await pool.query(
            `SELECT t.id AS id_turno, t.fecha, t.id_paciente, e.descripcion
            FROM turno t
            INNER JOIN agenda a ON a.id = t.id_agenda
            INNER JOIN especialidad e ON e.id = a.id_especialidad
            WHERE e.id = ?
            AND t.fecha BETWEEN ? AND ?
            ORDER BY t.fecha`,
            [id_especialidad, fechaDesde, fechaHasta ]
        );

        //Si especialidad con ese id no existe o no posee turnos error 404
        if (turnos.length === 0) {
            return res.status(404).json({
                codigo: 404,
                estado: "Especialidad inexistente o sin turnos",
                datos: null
            });
        };

        return res.status(200).json({
            codigo: 200,
            estado: `Cantidad de turnos existentes en la especialidad ${turnos[0].descripcion}: ${turnos.length}`,
            datos: turnos
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            codigo: 500,
            estado: "Error al obtener el reporte",
            datos: null
        });
    }
};

//Funcion para mostrar turnos por sede - Administrador
const turnosPorSede = async (req, res) => {
    try {
        if (req.usuario.rol !== "administrador") {
            return res.status(403).json({
                codigo: 403,
                estado: "Solo el administrador puede acceder a los reportes y estadisticas",
                datos: null
            });
        }

        const { desde, hasta, id_sede } = req.body;

        if (typeof desde !== "string" || typeof hasta !== "string" || !desde.trim() || !hasta.trim()) {
            return res.status(400).json({
                codigo: 400,
                estado: "Fecha ingresada invalida"
            });
        }

        if (!(formatearFecha(desde) instanceof Date) || !(formatearFecha(hasta) instanceof Date)) {
            return res.status(400).json({
                codigo: 400,
                estado: "Dato ingresado invalido, formato de fecha año-mes-día"
            });
        }

        if (formatearFecha(desde) > formatearFecha(hasta)) {
            return res.status(400).json({
                codigo: 400,
                estado: "La primer fecha debe ser menor o igual a la segunda fecha"
            });
        }

        const fechaDesde = formatearFecha(desde).toLocaleDateString('en-CA');
        const fechaHasta = formatearFecha(hasta).toLocaleDateString('en-CA');

        if (!id_sede || isNaN(id_sede) || id_sede <= 0) {
            return res.status(400).json({
                codigo: 400,
                estado: "Dato ingresado invalido",
                datos: null
            });
        }

        const [turnos] = await pool.query(
            `SELECT t.id AS id_turno, t.fecha, t.id_paciente, s.nombre AS sede
             FROM turno t
             INNER JOIN agenda a ON a.id = t.id_agenda
             INNER JOIN sede s ON s.id = a.id_sede
             WHERE s.id = ?
             AND t.fecha BETWEEN ? AND ?
             ORDER BY t.fecha`,
            [id_sede, fechaDesde, fechaHasta]
        );

        if (turnos.length === 0) {
            return res.status(404).json({
                codigo: 404,
                estado: "Sede inexistente o sin turnos",
                datos: null
            });
        }

        return res.status(200).json({
            codigo: 200,
            estado: `Cantidad de turnos existentes en la sede ${turnos[0].sede}: ${turnos.length}`,
            datos: turnos
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            codigo: 500,
            estado: "Error al obtener el reporte",
            datos: null
        });
    }
};

const rankingMedicos = async (req, res) => {
    try {
        if (req.usuario.rol !== "administrador") {
            return res.status(403).json({
                codigo: 403,
                estado: "Solo el administrador puede acceder a los reportes y estadisticas",
                datos: null
            });
        }

        const { desde, hasta } = req.body || {};

        if (!desde || !hasta) {
            return res.status(400).json({
                codigo: 400,
                estado: "Debe enviar las fechas desde y hasta en el body",
                datos: null
            });
        }

        if (typeof desde !== "string" || typeof hasta !== "string") {
            return res.status(400).json({
                codigo: 400,
                estado: "Las fechas deben ser cadenas de texto",
                datos: null
            });
        }

        if (!desde.trim() || !hasta.trim()) {
            return res.status(400).json({
                codigo: 400,
                estado: "Fecha ingresada invalida",
                datos: null
            });
        }

        const fechaDesdeValida = formatearFecha(desde);
        const fechaHastaValida = formatearFecha(hasta);

        if (!(fechaDesdeValida instanceof Date) || !(fechaHastaValida instanceof Date)) {
            return res.status(400).json({
                codigo: 400,
                estado: "Dato ingresado invalido, formato de fecha año-mes-día",
                datos: null
            });
        }

        if (fechaDesdeValida > fechaHastaValida) {
            return res.status(400).json({
                codigo: 400,
                estado: "La primer fecha debe ser menor o igual a la segunda fecha",
                datos: null
            });
        }

        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        if (fechaDesdeValida > hoy || fechaHastaValida > hoy) {
            return res.status(400).json({
                codigo: 400,
                estado: "Las fechas no pueden corresponder a días futuros",
                datos: null
            });
        }

        const fechaDesde = fechaDesdeValida.toLocaleDateString("en-CA");
        const fechaHasta = fechaHastaValida.toLocaleDateString("en-CA");

        const [ranking] = await pool.query(
            `SELECT u.id AS id_medico, u.nombre, u.apellido, COUNT(t.id) AS cantidad_turnos
                FROM usuario u
                LEFT JOIN agenda a ON a.id_medico = u.id
                LEFT JOIN turno t ON t.id_agenda = a.id
                AND t.fecha BETWEEN ? AND ?
                AND t.estado = 'atendido'
                WHERE u.rol = 'medico'
                GROUP BY u.id, u.nombre, u.apellido
                ORDER BY cantidad_turnos DESC, u.apellido ASC, u.nombre ASC`,
                [fechaDesde, fechaHasta]
            );

        if (ranking.length === 0) {
            return res.status(404).json({
                codigo: 404,
                estado: "No se encontraron médicos con turnos en el rango indicado",
                datos: null
            });
        }

        return res.status(200).json({
            codigo: 200,
            estado: "Ranking de médicos por cantidad de turnos",
            datos: ranking
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            codigo: 500,
            estado: "Error al obtener el reporte",
            datos: null
        });
    }
};



const tasaDeCancelacion = async (req, res) => {
    try {
        if (req.usuario.rol !== "administrador") {
            return res.status(403).json({
                codigo: 403,
                estado: "Solo el administrador puede acceder a los reportes y estadisticas",
                datos: null
            });
        }

        const { desde, hasta } = req.body || {};

        if (!desde || !hasta) {
            return res.status(400).json({
                codigo: 400,
                estado: "Debe enviar las fechas desde y hasta en el body",
                datos: null
            });
        }

        if (typeof desde !== "string" || typeof hasta !== "string") {
            return res.status(400).json({
                codigo: 400,
                estado: "Las fechas deben ser cadenas de texto",
                datos: null
            });
        }

        if (!desde.trim() || !hasta.trim()) {
            return res.status(400).json({
                codigo: 400,
                estado: "Fecha ingresada invalida",
                datos: null
            });
        }

        const fechaDesdeValida = formatearFecha(desde);
        const fechaHastaValida = formatearFecha(hasta);

        if (!(fechaDesdeValida instanceof Date) || !(fechaHastaValida instanceof Date)) {
            return res.status(400).json({
                codigo: 400,
                estado: "Dato ingresado invalido, formato de fecha año-mes-día",
                datos: null
            });
        }

        if (fechaDesdeValida > fechaHastaValida) {
            return res.status(400).json({
                codigo: 400,
                estado: "La primer fecha debe ser menor o igual a la segunda fecha",
                datos: null
            });
        }

        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        if (fechaDesdeValida > hoy || fechaHastaValida > hoy) {
            return res.status(400).json({
                codigo: 400,
                estado: "Las fechas no pueden corresponder a días futuros",
                datos: null
            });
        }

        const fechaDesde = fechaDesdeValida.toLocaleDateString("en-CA");
        const fechaHasta = fechaHastaValida.toLocaleDateString("en-CA");

        const [cancelacion] = await pool.query(
        `SELECT
    SUM(CASE WHEN t.estado = 'cancelado' THEN 1 ELSE 0 END) AS total_cancelados,
    SUM(CASE WHEN t.estado IN ('confirmado', 'atendido') THEN 1 ELSE 0 END) AS total_efectivos,
    SUM(CASE WHEN t.estado IN ('confirmado', 'atendido', 'cancelado') THEN 1 ELSE 0 END) AS total_turnos,
    CASE
        WHEN SUM(CASE WHEN t.estado = 'cancelado' THEN 1 ELSE 0 END) > 0
        THEN ROUND(
            SUM(CASE WHEN t.estado IN ('confirmado', 'atendido', 'cancelado') THEN 1 ELSE 0 END)
            /
            SUM(CASE WHEN t.estado = 'cancelado' THEN 1 ELSE 0 END)
        , 2)
        ELSE 0
    END AS porcentaje_cancelacion
FROM turno t
INNER JOIN agenda a ON a.id = t.id_agenda
WHERE t.fecha BETWEEN ? AND ?`,
    [fechaDesde, fechaHasta]
);

        if (!cancelacion || cancelacion.length === 0 || !cancelacion[0].total_turnos) {
    return res.status(404).json({
        codigo: 404,
        estado: "No se encontraron turnos en ese periodo de tiempo",
        datos: null
    });
}

return res.status(200).json({
    codigo: 200,
    estado: `Tasa de cancelación de turnos del ${fechaDesde} al ${fechaHasta}`,
    datos: {
        total_cancelados: Number(cancelacion[0].total_cancelados || 0),
        total_efectivos: Number(cancelacion[0].total_efectivos || 0),
        total_turnos: Number(cancelacion[0].total_turnos || 0),
        porcentaje_cancelacion: Number(cancelacion[0].porcentaje_cancelacion || 0)
    }
});

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            codigo: 500,
            estado: "Error al obtener el reporte",
            datos: null
        });
    }
};

module.exports = { turnosPorEspecialidad, turnosPorSede, rankingMedicos, tasaDeCancelacion };