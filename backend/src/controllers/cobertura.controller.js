const pool = require("../database/database");
const { logDarAlta, logModificar, logDarBaja }   = require("./logsAuditoria.controller");

const listarCoberturas = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM cobertura");
    return res.json({ codigo: 200, estado: "ok", datos: rows });
  } catch (error) {
    return res.status(500).json({ codigo: 500, estado: error.message, datos: null });
  }
};

const darDeAlta = async (req, res) => {
  try {
    const { nombre } = req.body;

    if (!nombre) {
      return res.status(400).json({ codigo: 400, estado: "El nombre es requerido", datos: null });
    }

    const [result] = await pool.query(
      "INSERT INTO cobertura (nombre) VALUES (?)",
      [nombre]
    );

    try {
      await logDarAlta(req.usuario.id, "ALTA", "cobertura", result.insertId, `Cobertura con ID ${result.insertId} creada con nombre: ${nombre}`);
    } catch (logError) {
      console.error("Error al registrar el log de alta:", logError);
    }

    return res.status(201).json({ codigo: 201, estado: "ok", datos: { id: result.insertId, nombre } });

  } catch (error) {
    return res.status(500).json({ codigo: 500, estado: error.message, datos: null });
  }
};

const actualizarCobertura = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre } = req.body;

    if (!nombre) {
      return res.status(400).json({ codigo: 400, estado: "El nombre es requerido", datos: null });
    }

    const [coberturaExiste] = await pool.query("SELECT id FROM cobertura WHERE id = ?", [id]);
    if (coberturaExiste.length === 0) {
      return res.status(404).json({ codigo: 404, estado: "Cobertura no encontrada", datos: null });
    }

    await pool.query(
      "UPDATE cobertura SET nombre = ? WHERE id = ?",
      [nombre, id]
    );

    try {
      await logModificar(req.usuario.id, "MODIFICACION", "cobertura", id, `Cobertura con ID ${id} actualizada a nombre: ${nombre}`);
    } catch (logError) {
      console.error("Error al registrar el log de modificación:", logError);
    }

    return res.json({ codigo: 200, estado: "ok", datos: { id, nombre } });

  } catch (error) {
    return res.status(500).json({ codigo: 500, estado: error.message, datos: null });
  }
};

const darDeBaja = async (req, res) => {
  try {
    const { id } = req.params;

    const [coberturaExiste] = await pool.query("SELECT id FROM cobertura WHERE id = ?", [id]);
    if (coberturaExiste.length === 0) {
      return res.status(404).json({ codigo: 404, estado: "Cobertura no encontrada", datos: null });
    }

    const [usuariosAsociados] = await pool.query(
      "SELECT id FROM usuario WHERE id_cobertura = ?",
      [id]
    );
    if (usuariosAsociados.length > 0) {
      return res.status(400).json({
        codigo: 400,
        estado: "No se puede eliminar: la cobertura tiene usuarios asociados",
        datos: null
      });
    }

    await pool.query("DELETE FROM cobertura WHERE id = ?", [id]);

    try {
      await logDarBaja(req.usuario.id, "BAJA", "cobertura", id, `Cobertura con ID ${id} eliminada`);
    } catch (logError) {
      console.error("Error al registrar el log de baja:", logError);
    }

    return res.json({ codigo: 200, estado: "ok", datos: { mensaje: "Cobertura eliminada correctamente" } });

  } catch (error) {
    return res.status(500).json({ codigo: 500, estado: error.message, datos: null });
  }
};

module.exports = { listarCoberturas, darDeAlta, actualizarCobertura, darDeBaja };
