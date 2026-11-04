const bcrypt = require("bcrypt");
const jwt    = require("jsonwebtoken");
const pool   = require("../database/database");
const { logDarAlta, logModificar }  = require("./logsAuditoria.controller");

const obtenerCoberturas = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT id, nombre FROM cobertura");
    return res.json({ codigo: 200, estado: "ok", datos: rows });
  } catch (error) {
    return res.status(500).json({ codigo: 500, estado: error.message, datos: null });
  }
};

const registro = async (req, res) => {
  try {
    const { nombre, apellido, dni, email, password, fecha_nacimiento, id_cobertura, telefono } = req.body;

    // El teléfono no es obligatorio en el registro (el enunciado no lo pide);
    // la columna no admite NULL, así que si no viene se guarda vacío.
    if (!nombre || !apellido || !dni || !email || !password || !fecha_nacimiento || !id_cobertura) {
      return res.status(400).json({ codigo: 400, estado: "Todos los campos son requeridos", datos: null });
    }

    // Validaciones según el tamaño de las columnas de la base, para no responder 500.
    if (String(nombre).trim().length > 30 || String(apellido).trim().length > 30) {
      return res.status(400).json({ codigo: 400, estado: "El nombre y el apellido no pueden superar los 30 caracteres", datos: null });
    }
    if (!/^\d{7,8}$/.test(String(dni))) {
      return res.status(400).json({ codigo: 400, estado: "El DNI debe tener entre 7 y 8 números", datos: null });
    }
    if (String(email).length > 30 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) {
      return res.status(400).json({ codigo: 400, estado: "Ingresá un email válido de hasta 30 caracteres", datos: null });
    }
    if (telefono && String(telefono).trim().length > 10) {
      return res.status(400).json({ codigo: 400, estado: "El teléfono no puede superar los 10 caracteres", datos: null });
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(fecha_nacimiento))) {
      return res.status(400).json({ codigo: 400, estado: "La fecha de nacimiento debe tener formato YYYY-MM-DD", datos: null });
    }

    const [coberturaExiste] = await pool.query("SELECT id FROM cobertura WHERE id = ?", [id_cobertura]);
    if (coberturaExiste.length === 0) {
      return res.status(400).json({ codigo: 400, estado: "La cobertura seleccionada no existe", datos: null });
    }

    const [dniExiste] = await pool.query("SELECT id FROM usuario WHERE dni = ?", [dni]);
    if (dniExiste.length > 0) {
      return res.status(400).json({ codigo: 400, estado: "El DNI ya está registrado", datos: null });
    }

    const [emailExiste] = await pool.query("SELECT id FROM usuario WHERE email = ?", [email]);
    if (emailExiste.length > 0) {
      return res.status(400).json({ codigo: 400, estado: "El email ya está registrado", datos: null });
    }

    const hash = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      `INSERT INTO usuario (nombre, apellido, dni, email, password, fecha_nacimiento, id_cobertura, telefono, rol)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'paciente')`,
      [String(nombre).trim(), String(apellido).trim(), dni, email, hash, fecha_nacimiento, id_cobertura, telefono ? String(telefono).trim() : ""]
    );

    try {
      await logDarAlta(result.insertId, "ALTA", "usuario", result.insertId, `Registro de nuevo usuario: ${nombre} ${apellido}`);
    } catch (error) {
      console.error("Error al registrar el log de auditoría:", error);
    }

    return res.status(201).json({ codigo: 201, estado: "ok", datos: { id: result.insertId } });

  } catch (error) {
    return res.status(500).json({ codigo: 500, estado: error.message, datos: null });
  }
};

const login = async (req, res) => {
  try {
    const { dni, password } = req.body;

    if (!dni || !password) {
      return res.status(400).json({ codigo: 400, estado: "DNI y contraseña son requeridos", datos: null });
    }

    const [rows] = await pool.query(
      "SELECT id, nombre, apellido, rol, id_sede, password FROM usuario WHERE dni = ?",
      [dni]
    );

    if (!rows.length) {
      return res.status(401).json({ codigo: 401, estado: "DNI o contraseña incorrectos", datos: null });
    }

    const usuario = rows[0];

    const passwordValida = await bcrypt.compare(password, usuario.password);
    if (!passwordValida) {
      return res.status(401).json({ codigo: 401, estado: "DNI o contraseña incorrectos", datos: null });
    }

    const token = jwt.sign(
      { id: usuario.id, rol: usuario.rol, id_sede: usuario.id_sede },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "8h" }
    );

    return res.json({
      codigo: 200,
      estado: "ok",
      datos: {
        token,
        usuario: {
          id:       usuario.id,
          nombre:   usuario.nombre,
          apellido: usuario.apellido,
          rol:      usuario.rol,
          id_sede:  usuario.id_sede
        }
      }
    });

  } catch (error) {
    return res.status(500).json({ codigo: 500, estado: error.message, datos: null });
  }
};

const perfil = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT u.id, u.nombre, u.apellido, u.email, u.dni, u.telefono,
              u.fecha_nacimiento, u.rol, u.id_sede, u.id_cobertura,
              s.nombre AS sede, c.nombre AS cobertura
       FROM usuario u
       LEFT JOIN sede s ON s.id = u.id_sede
       LEFT JOIN cobertura c ON c.id = u.id_cobertura
       WHERE u.id = ?`,
      [req.usuario.id]
    );

    if (!rows.length) {
      return res.status(404).json({ codigo: 404, estado: "Usuario no encontrado", datos: null });
    }

    // El médico necesita sus especialidades para cargar su agenda.
    if (rows[0].rol === "medico") {
      const [especialidades] = await pool.query(
        `SELECT e.id, e.descripcion
         FROM medico_especialidad me
         JOIN especialidad e ON e.id = me.id_especialidad
         WHERE me.id_medico = ?
         ORDER BY e.descripcion`,
        [req.usuario.id]
      );
      rows[0].especialidades = especialidades;
    }

    return res.json({ codigo: 200, estado: "ok", datos: rows[0] });

  } catch (error) {
    return res.status(500).json({ codigo: 500, estado: error.message, datos: null });
  }
};

// PUT /auth/perfil — el paciente actualiza sus propios datos.
// Solo se pueden modificar email, contraseña, teléfono y cobertura; se envían solo los que cambian.
const CAMPOS_EDITABLES_PACIENTE = ["email", "password", "telefono", "id_cobertura"];

const actualizarPerfil = async (req, res) => {
  try {
    const datos = req.body || {};
    const camposEnviados = Object.keys(datos);

    const camposNoPermitidos = camposEnviados.filter(campo => !CAMPOS_EDITABLES_PACIENTE.includes(campo));
    if (camposNoPermitidos.length > 0) {
      return res.status(400).json({
        codigo: 400,
        estado: `Solo se pueden modificar email, contraseña, teléfono y cobertura (no permitido: ${camposNoPermitidos.join(", ")})`,
        datos: null
      });
    }

    if (camposEnviados.length === 0) {
      return res.status(400).json({ codigo: 400, estado: "No se envió ningún dato para modificar", datos: null });
    }

    const cambios = [];
    const valores = [];

    if (datos.email !== undefined) {
      const email = String(datos.email).trim();
      if (email.length > 30 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ codigo: 400, estado: "Ingresá un email válido de hasta 30 caracteres", datos: null });
      }
      const [emailExiste] = await pool.query("SELECT id FROM usuario WHERE email = ? AND id <> ?", [email, req.usuario.id]);
      if (emailExiste.length > 0) {
        return res.status(400).json({ codigo: 400, estado: "El email ya está registrado", datos: null });
      }
      cambios.push("email = ?");
      valores.push(email);
    }

    if (datos.password !== undefined) {
      if (typeof datos.password !== "string" || datos.password.length < 6) {
        return res.status(400).json({ codigo: 400, estado: "La contraseña debe tener al menos 6 caracteres", datos: null });
      }
      cambios.push("password = ?");
      valores.push(await bcrypt.hash(datos.password, 10));
    }

    if (datos.telefono !== undefined) {
      const telefono = datos.telefono === null ? "" : String(datos.telefono).trim();
      if (telefono.length > 10) {
        return res.status(400).json({ codigo: 400, estado: "El teléfono no puede superar los 10 caracteres", datos: null });
      }
      cambios.push("telefono = ?");
      valores.push(telefono);
    }

    if (datos.id_cobertura !== undefined) {
      const [coberturaExiste] = await pool.query("SELECT id FROM cobertura WHERE id = ?", [datos.id_cobertura]);
      if (coberturaExiste.length === 0) {
        return res.status(400).json({ codigo: 400, estado: "La cobertura seleccionada no existe", datos: null });
      }
      cambios.push("id_cobertura = ?");
      valores.push(Number(datos.id_cobertura));
    }

    await pool.query(`UPDATE usuario SET ${cambios.join(", ")} WHERE id = ?`, [...valores, req.usuario.id]);

    // En el detalle no se guarda la contraseña, solo qué campos cambiaron.
    const camposModificados = camposEnviados.map(campo => campo === "password" ? "contraseña" : campo);
    await logModificar(req.usuario.id, "MODIFICACION", "usuario", req.usuario.id,
      `El paciente actualizó sus datos: ${camposModificados.join(", ")}`);

    return res.json({ codigo: 200, estado: "ok", datos: { id: req.usuario.id, campos_modificados: camposModificados } });

  } catch (error) {
    return res.status(500).json({ codigo: 500, estado: error.message, datos: null });
  }
};

module.exports = { obtenerCoberturas, registro, login, perfil, actualizarPerfil };