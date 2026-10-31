const pool = require("../database/database");

// GET /pacientes?dni=&apellido=
// Búsqueda de pacientes por DNI (comienza con) o apellido (contiene).
// Accesible para operador, médico y administrador. Devuelve hasta 20 resultados.
const buscarPacientes = async (req, res) => {
    try {
        const dni = typeof req.query.dni === "string" ? req.query.dni.trim() : "";
        const apellido = typeof req.query.apellido === "string" ? req.query.apellido.trim() : "";

        if (!dni && !apellido) {
            return res.status(400).json({ codigo: 400, estado: "Indicá un DNI o un apellido para buscar", datos: null });
        }

        if (dni && !/^\d+$/.test(dni)) {
            return res.status(400).json({ codigo: 400, estado: "El DNI debe contener solo números", datos: null });
        }

        if (apellido && apellido.length < 2) {
            return res.status(400).json({ codigo: 400, estado: "Ingresá al menos 2 letras del apellido", datos: null });
        }

        const condiciones = ["u.rol = 'paciente'"];
        const parametros = [];

        if (dni) {
            condiciones.push("u.dni LIKE ?");
            parametros.push(`${dni}%`);
        }

        if (apellido) {
            condiciones.push("u.apellido LIKE ?");
            parametros.push(`%${apellido}%`);
        }

        const [pacientes] = await pool.query(
            `SELECT u.id, u.nombre, u.apellido, u.dni, u.email, u.telefono,
                    DATE_FORMAT(u.fecha_nacimiento, '%Y-%m-%d') AS fecha_nacimiento,
                    TIMESTAMPDIFF(YEAR, u.fecha_nacimiento, CURDATE()) AS edad,
                    u.id_cobertura, c.nombre AS cobertura
             FROM usuario u
             LEFT JOIN cobertura c ON c.id = u.id_cobertura
             WHERE ${condiciones.join(" AND ")}
             ORDER BY u.apellido, u.nombre
             LIMIT 20`,
            parametros
        );

        return res.json({ codigo: 200, estado: "ok", datos: pacientes });
    } catch (error) {
        return res.status(500).json({ codigo: 500, estado: error.message, datos: null });
    }
};

module.exports = { buscarPacientes };
