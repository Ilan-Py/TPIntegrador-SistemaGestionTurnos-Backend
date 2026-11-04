const pool = require("../database/database");
const {
    DURACION_TURNO_MINUTOS,
    esFechaValida,
    fechaLocal,
    horaLocal,
    generarHorarios
} = require("../utils/horarios");

// Valida los ids obligatorios de las consultas de disponibilidad.
const validarParametros = (query) => {
    for (const campo of ["id_medico", "id_especialidad", "id_sede"]) {
        const valor = Number(query[campo]);
        if (!query[campo] || !Number.isInteger(valor) || valor < 1) {
            return `El parámetro ${campo} es requerido y debe ser un número válido`;
        }
    }
    return null;
};

// Calcula los horarios libres de un médico para una fecha, especialidad y sede:
// los horarios de sus rangos de agenda menos los turnos confirmados.
// Si la fecha es hoy, no se ofrecen horarios que ya pasaron.
const calcularHorariosLibres = async (id_medico, id_especialidad, id_sede, fecha) => {
    const [agendas] = await pool.query(
        `SELECT id, hora_entrada, hora_salida FROM agenda
         WHERE id_medico = ? AND id_especialidad = ? AND id_sede = ? AND fecha = ?
         ORDER BY hora_entrada`,
        [id_medico, id_especialidad, id_sede, fecha]
    );

    if (agendas.length === 0) return [];

    const [ocupados] = await pool.query(
        `SELECT t.hora FROM turno t
         WHERE t.id_agenda IN (?) AND t.fecha = ? AND t.estado = 'confirmado'`,
        [agendas.map(a => a.id), fecha]
    );
    const horasOcupadas = new Set(ocupados.map(t => t.hora));

    const esHoy = fecha === fechaLocal();
    const ahora = horaLocal();

    return agendas.flatMap(agenda =>
        generarHorarios(agenda.hora_entrada, agenda.hora_salida)
            .filter(hora => !horasOcupadas.has(hora))
            .filter(hora => !esHoy || hora > ahora)
    );
};

// GET /disponibilidad/fechas?id_medico=&id_especialidad=&id_sede=
// Fechas (desde hoy) en las que el médico tiene agenda con al menos un horario libre.
const fechasDisponibles = async (req, res) => {
    try {
        const error = validarParametros(req.query);
        if (error) return res.status(400).json({ codigo: 400, estado: error, datos: null });

        const { id_medico, id_especialidad, id_sede } = req.query;

        const [fechas] = await pool.query(
            `SELECT DISTINCT DATE_FORMAT(fecha, '%Y-%m-%d') AS fecha FROM agenda
             WHERE id_medico = ? AND id_especialidad = ? AND id_sede = ? AND fecha >= CURDATE()
             ORDER BY fecha`,
            [id_medico, id_especialidad, id_sede]
        );

        const disponibles = [];
        for (const { fecha } of fechas) {
            const libres = await calcularHorariosLibres(id_medico, id_especialidad, id_sede, fecha);
            if (libres.length > 0) disponibles.push(fecha);
        }

        return res.json({ codigo: 200, estado: "ok", datos: disponibles });
    } catch (error) {
        return res.status(500).json({ codigo: 500, estado: error.message, datos: null });
    }
};

// GET /disponibilidad/horarios?id_medico=&id_especialidad=&id_sede=&fecha=YYYY-MM-DD
// Horarios libres de ese día. Cada turno dura DURACION_TURNO_MINUTOS.
const horariosDisponibles = async (req, res) => {
    try {
        const error = validarParametros(req.query);
        if (error) return res.status(400).json({ codigo: 400, estado: error, datos: null });

        const { id_medico, id_especialidad, id_sede, fecha } = req.query;

        if (!esFechaValida(fecha)) {
            return res.status(400).json({ codigo: 400, estado: "La fecha es requerida y debe tener formato YYYY-MM-DD", datos: null });
        }

        if (fecha < fechaLocal()) {
            return res.status(400).json({ codigo: 400, estado: "No se pueden consultar horarios de fechas pasadas", datos: null });
        }

        const horarios = await calcularHorariosLibres(id_medico, id_especialidad, id_sede, fecha);

        return res.json({
            codigo: 200,
            estado: "ok",
            datos: { fecha, duracion_minutos: DURACION_TURNO_MINUTOS, horarios }
        });
    } catch (error) {
        return res.status(500).json({ codigo: 500, estado: error.message, datos: null });
    }
};

module.exports = { fechasDisponibles, horariosDisponibles };
