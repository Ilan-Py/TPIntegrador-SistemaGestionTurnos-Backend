const pool = require("../database/database");

// Listado de médicos con sus especialidades, para cualquier usuario con sesión.
// Solo devuelve nombre, apellido, sede y especialidades (sin datos personales).
//
// Filtros opcionales (query params):
// - id_especialidad: médicos que tienen esa especialidad.
// - id_sede: médicos cuya sede es esa o que tienen agenda cargada en esa sede.
// - con_agenda=true: solo médicos con agenda desde hoy en adelante
//   (respetando id_especialidad e id_sede si vienen). Lo usa "Nuevo turno".
const listarMedicos = async (req, res) => {
    try {
        const { id_especialidad, id_sede, con_agenda } = req.query;

        for (const [nombre, valor] of [["id_especialidad", id_especialidad], ["id_sede", id_sede]]) {
            if (valor !== undefined && (!Number.isInteger(Number(valor)) || Number(valor) < 1)) {
                return res.status(400).json({ codigo: 400, estado: `El parámetro ${nombre} no es válido`, datos: null });
            }
        }

        const condiciones = ["u.rol = 'medico'"];
        const parametros = [];

        if (id_especialidad) {
            condiciones.push("EXISTS (SELECT 1 FROM medico_especialidad me2 WHERE me2.id_medico = u.id AND me2.id_especialidad = ?)");
            parametros.push(Number(id_especialidad));
        }

        if (id_sede) {
            condiciones.push("(u.id_sede = ? OR EXISTS (SELECT 1 FROM agenda a2 WHERE a2.id_medico = u.id AND a2.id_sede = ?))");
            parametros.push(Number(id_sede), Number(id_sede));
        }

        if (con_agenda === "true" || con_agenda === "1") {
            let subconsulta = "SELECT 1 FROM agenda a3 WHERE a3.id_medico = u.id AND a3.fecha >= CURDATE()";
            if (id_especialidad) {
                subconsulta += " AND a3.id_especialidad = ?";
                parametros.push(Number(id_especialidad));
            }
            if (id_sede) {
                subconsulta += " AND a3.id_sede = ?";
                parametros.push(Number(id_sede));
            }
            condiciones.push(`EXISTS (${subconsulta})`);
        }

        const [filas] = await pool.query(
            `SELECT u.id, u.nombre, u.apellido, u.id_sede, s.nombre AS sede,
                    GROUP_CONCAT(DISTINCT CONCAT(e.id, '::', e.descripcion) ORDER BY e.descripcion SEPARATOR '||') AS especialidades
             FROM usuario u
             LEFT JOIN sede s ON s.id = u.id_sede
             LEFT JOIN medico_especialidad me ON me.id_medico = u.id
             LEFT JOIN especialidad e ON e.id = me.id_especialidad
             WHERE ${condiciones.join(" AND ")}
             GROUP BY u.id
             ORDER BY u.apellido, u.nombre`,
            parametros
        );

        const medicos = filas.map(medico => ({
            ...medico,
            especialidades: medico.especialidades
                ? medico.especialidades.split("||").map(item => {
                    const [id, descripcion] = item.split("::");
                    return { id: Number(id), descripcion };
                })
                : []
        }));

        return res.json({ codigo: 200, estado: "ok", datos: medicos });
    } catch (error) {
        return res.status(500).json({ codigo: 500, estado: error.message, datos: null });
    }
};

module.exports = { listarMedicos };
