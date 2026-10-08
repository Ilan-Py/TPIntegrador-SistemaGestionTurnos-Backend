const bcrypt = require("bcrypt");
const jwt    = require("jsonwebtoken");
const pool   = require("../database/database");
const { logDarAlta }  = require("./logsAuditoria.controller");

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

    if (!nombre || !apellido || !dni || !email || !password || !fecha_nacimiento || !id_cobertura || !telefono) {
      return res.status(400).json({ codigo: 400, estado: "Todos los campos son requeridos", datos: null });
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
      [nombre, apellido, dni, email, hash, fecha_nacimiento, id_cobertura, telefono]
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

    return res.json({ codigo: 200, estado: "ok", datos: rows[0] });

  } catch (error) {
    return res.status(500).json({ codigo: 500, estado: error.message, datos: null });
  }
};

module.exports = { obtenerCoberturas, registro, login, perfil };