const pool   = require("../database/database");
const { logDarAlta, logModificar, logDarBaja }   = require("./logsAuditoria.controller");

const listarSedes = async (req, res) => {
 try {
  const [rows] = await pool.query ("SELECT * FROM sede");
  return res.json({ codigo: 200, estado: "ok", datos: rows });
 } catch (error) {
  return res.status(500).json({ codigo: 500, estado: error.message, datos: null });
 }
};

const actualizarSede = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, direccion, telefono } = req.body;

    if (!nombre || !direccion || !telefono) {
      return res.status(400).json({ codigo: 400, estado: "Todos los campos son requeridos", datos: null });
    }

    const [sedeExiste] = await pool.query("SELECT id FROM sede WHERE id = ?", [id]);
    if (sedeExiste.length === 0) {
      return res.status(404).json({ codigo: 404, estado: "Sede no encontrada", datos: null });
    }

    await pool.query(
      "UPDATE sede SET nombre = ?, direccion = ?, telefono = ? WHERE id = ?",
      [nombre, direccion, telefono, id]
    );

    try {
      await logModificar(req.usuario.id, "MODIFICACION", "sede", id, `Sede con ID ${id} actualizada a nombre: ${nombre}, dirección: ${direccion}, teléfono: ${telefono}`);
    } catch (logError) {
      console.error("Error al registrar el log de modificación:", logError);
    }

    return res.json({ codigo: 200, estado: "ok", datos: { id, nombre, direccion, telefono } });

  } catch (error) {
    return res.status(500).json({ codigo: 500, estado: error.message, datos: null });
  }
};

const darDeAlta = async (req, res) => {
  try {
    const { nombre, direccion, telefono } = req.body;

    if (!nombre || !direccion || !telefono) {
      return res.status(400).json({ codigo: 400, estado: "Todos los campos son requeridos", datos: null });
    }

    const [result] = await pool.query(
      "INSERT INTO sede (nombre, direccion, telefono) VALUES (?, ?, ?)",
      [nombre, direccion, telefono]
    );

    try {
      await logDarAlta(req.usuario.id, "ALTA", "sede", result.insertId, `Sede con ID ${result.insertId} creada con nombre: ${nombre}, dirección: ${direccion}, teléfono: ${telefono}`);
    } catch (logError) {
      console.error("Error al registrar el log de alta:", logError);
    }

    return res.status(201).json({ codigo: 201, estado: "ok", datos: { id: result.insertId, nombre, direccion, telefono } });

  } catch (error) {
    return res.status(500).json({ codigo: 500, estado: error.message, datos: null });
  }
};

const darDeBaja = async (req, res) => {
  try {
    const { id } = req.params;

    const [sedeExiste] = await pool.query("SELECT id FROM sede WHERE id = ?", [id]);
    if (sedeExiste.length === 0) {
      return res.status(404).json({ codigo: 404, estado: "Sede no encontrada", datos: null });
    }

    const [usuariosAsociados] = await pool.query(
      "SELECT id FROM usuario WHERE id_sede = ?",
      [id]
    );
    if (usuariosAsociados.length > 0) {
      return res.status(400).json({
        codigo: 400,
        estado: "No se puede eliminar: la sede tiene médicos u operadores asociados",
        datos: null
      });
    }

    const [agendaAsociada] = await pool.query(
      "SELECT id FROM agenda WHERE id_sede = ?",
      [id]
    );
    if (agendaAsociada.length > 0) {
      return res.status(400).json({
        codigo: 400,
        estado: "No se puede eliminar: la sede tiene agenda asociada",
        datos: null
      });
    }

    await pool.query("DELETE FROM sede WHERE id = ?", [id]);

    try {
      await logDarBaja(req.usuario.id, "BAJA", "sede", id, `Sede con ID ${id} eliminada`);
    } catch (logError) {
      console.error("Error al registrar el log de baja:", logError);
    }

    return res.json({ codigo: 200, estado: "ok", datos: { mensaje: "Sede eliminada correctamente" } });

  } catch (error) {
    return res.status(500).json({ codigo: 500, estado: error.message, datos: null });
  }
};

module.exports = { listarSedes, actualizarSede, darDeAlta, darDeBaja };