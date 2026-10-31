// Funciones compartidas para trabajar con los horarios de la agenda y los turnos.
// Las horas se guardan en la base como texto "HH:MM" (varchar(5)).

// Duración de cada turno. La usan el alta de turno y la consulta de horarios libres,
// así ambos validan lo mismo.
const DURACION_TURNO_MINUTOS = 30;

const esHoraValida = (hora) => typeof hora === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(hora);

const esFechaValida = (fecha) => {
    if (typeof fecha !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return false;
    const date = new Date(`${fecha}T00:00:00`);
    return !Number.isNaN(date.getTime()) && fechaLocal(date) === fecha;
};

const aMinutos = (hora) => {
    const [h, m] = String(hora).split(":").map(Number);
    return h * 60 + m;
};

const aHora = (minutos) =>
    `${String(Math.floor(minutos / 60)).padStart(2, "0")}:${String(minutos % 60).padStart(2, "0")}`;

// Fecha en formato YYYY-MM-DD según la hora local del servidor.
const fechaLocal = (date = new Date()) => {
    const anio = date.getFullYear();
    const mes = String(date.getMonth() + 1).padStart(2, "0");
    const dia = String(date.getDate()).padStart(2, "0");
    return `${anio}-${mes}-${dia}`;
};

const horaLocal = (date = new Date()) =>
    `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;

// Horarios de inicio de turno dentro de un rango de agenda: cada DURACION_TURNO_MINUTOS
// desde la hora de entrada, siempre que el turno completo termine antes de la hora de salida.
// Ejemplo: 09:00 a 10:30 -> ["09:00", "09:30", "10:00"]
const generarHorarios = (hora_entrada, hora_salida) => {
    const horarios = [];
    const fin = aMinutos(hora_salida);
    for (let inicio = aMinutos(hora_entrada); inicio + DURACION_TURNO_MINUTOS <= fin; inicio += DURACION_TURNO_MINUTOS) {
        horarios.push(aHora(inicio));
    }
    return horarios;
};

module.exports = {
    DURACION_TURNO_MINUTOS,
    esHoraValida,
    esFechaValida,
    fechaLocal,
    horaLocal,
    generarHorarios
};
