const bcrypt = require("bcrypt");
const pool = require("../database/database");
const { logDarAlta, logModificar } = require("./logsAuditoria.controller");

const rolesPermitidos = new Set(["administrador", "admin", "medico", "operador", "paciente"]);

const responderError = (res, status, estado) =>
  res.status(status).json({ codigo: status, estado, datos: null });

const normalizarRol = (rol) => rol === "admin" ? "administrador" : rol;

const validarDatos = (datos, esAlta) => {
  if (!datos || typeof datos !== "object") return "Los datos del usuario son obligatorios.";
  const { nombre, apellido, dni, email, telefono, fecha_nacimiento, rol } = datos;
  const rolNormalizado = normalizarRol(rol);

  const textosObligatorios = [nombre, apellido, dni, email, telefono];
  if (textosObligatorios.some(valor => typeof valor !== "string" || !valor.trim()) ||
      typeof fecha_nacimiento !== "string" || !fecha_nacimiento ||
      typeof rol !== "string" || !rolesPermitidos.has(rol)) {
    return "Completá todos los campos obligatorios.";
  }
  if (esAlta && rolNormalizado === "paciente") {
    return "El alta administrativa solo permite crear operadores, médicos y administradores.";
  }
  if (nombre.trim().length > 30 || apellido.trim().length > 30) {
    return "El nombre y el apellido no pueden superar los 30 caracteres.";
  }
  if (!/^\d{7,8}$/.test(dni.trim())) {
    return "El DNI debe tener entre 7 y 8 números.";
  }
  if (email.trim().length > 30 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return "Ingresá un correo válido de hasta 30 caracteres.";
  }
  if (telefono.trim().length > 10 || !/^(?=.*\d)[0-9+()\s-]+$/.test(telefono.trim())) {
    return "Ingresá un teléfono válido de hasta 10 caracteres.";
  }
  const fechaValidada = /^\d{4}-\d{2}-\d{2}$/.test(fecha_nacimiento)
    ? new Date(`${fecha_nacimiento}T00:00:00`)
    : null;
  if (!fechaValidada || Number.isNaN(fechaValidada.getTime()) ||
      fechaValidada.toISOString().slice(0, 10) !== fecha_nacimiento) {
    return "La fecha de nacimiento debe tener formato YYYY-MM-DD.";
  }
  if (rolNormalizado === "operador" || rolNormalizado === "medico") {
    if (!Number.isInteger(Number(datos.id_sede)) || Number(datos.id_sede) < 1) {
      return "Operadores y médicos deben tener una sede asignada.";
    }
  }
  if (rolNormalizado === "medico") {
    if (!Array.isArray(datos.id_especialidades) ||
        datos.id_especialidades.length === 0 ||
        datos.id_especialidades.some(id => !Number.isInteger(Number(id)) || Number(id) < 1)) {
      return "Seleccioná al menos una especialidad para el médico.";
    }
  }
  if (esAlta && (typeof datos.password !== "string" || datos.password.length < 6)) {
    return "La contraseña es obligatoria y debe tener al menos 6 caracteres.";
  }
  if (!esAlta && datos.password !== undefined &&
      (typeof datos.password !== "string" || (datos.password && datos.password.length < 6))) {
    return "La nueva contraseña debe tener al menos 6 caracteres.";
  }
  return null;
};

const validarReferencias = async (connection, datos, rol) => {
  if (rol === "operador" || rol === "medico") {
    const [sedes] = await connection.query("SELECT id FROM sede WHERE id = ?", [datos.id_sede]);
    if (!sedes.length) return "La sede seleccionada no existe.";
  }

  if (rol === "medico") {
    const ids = [...new Set(datos.id_especialidades.map(Number))];
    const [especialidades] = await connection.query(
      `SELECT id FROM especialidad WHERE id IN (${ids.map(() => "?").join(",")})`,
      ids
    );
    if (especialidades.length !== ids.length) return "Una o más especialidades seleccionadas no existen.";
  }

  if (rol === "paciente" && datos.id_cobertura != null) {
    const [coberturas] = await connection.query("SELECT id FROM cobertura WHERE id = ?", [datos.id_cobertura]);
    if (!coberturas.length) return "La cobertura seleccionada no existe.";
  }
  return null;
};

const listarUsuarios = async (req, res) => {
  try {
    const pagina = Number.parseInt(req.query.pagina, 10) || 1;
    const limiteSolicitado = Number.parseInt(req.query.limite, 10) || 10;
    if (pagina < 1 || limiteSolicitado < 1) {
      return responderError(res, 400, "La página y el límite deben ser mayores que cero.");
    }
    const limite = Math.min(limiteSolicitado, 100);
    const condiciones = [];
    const parametros = [];

    for (const campo of ["nombre", "apellido"]) {
      const termino = typeof req.query[campo] === "string" ? req.query[campo].trim() : "";
      if (termino) {
        condiciones.push(`u.${campo} LIKE ?`);
        parametros.push(`%${termino}%`);
      }
    }

    const rol = typeof req.query.rol === "string" ? req.query.rol.trim() : "";
    if (rol && !rolesPermitidos.has(rol)) {
      return responderError(res, 400, "El tipo de usuario indicado no es válido.");
    }
    if (rol === "admin" || rol === "administrador") {
      condiciones.push("u.rol IN ('admin', 'administrador')");
    } else if (rol) {
      condiciones.push("u.rol = ?");
      parametros.push(rol);
    }

    if (req.query.id_sede) {
      const idSede = Number(req.query.id_sede);
      if (!Number.isInteger(idSede) || idSede < 1) {
        return responderError(res, 400, "La sede indicada no es válida.");
      }
      condiciones.push("u.id_sede = ?");
      parametros.push(idSede);
    }

    const where = condiciones.length ? `WHERE ${condiciones.join(" AND ")}` : "";
    const [conteo] = await pool.query(
      `SELECT COUNT(*) AS total FROM usuario u ${where}`,
      parametros
    );
    const total = Number(conteo[0].total);
    const totalPaginas = Math.ceil(total / limite);
    const offset = (pagina - 1) * limite;
    const [filas] = await pool.query(
      `SELECT u.id, u.nombre, u.apellido, u.dni, u.email, u.telefono,
              DATE_FORMAT(u.fecha_nacimiento, '%Y-%m-%d') AS fecha_nacimiento,
              u.rol, u.id_sede, u.id_cobertura,
              s.nombre AS sede,
              c.nombre AS cobertura,
              GROUP_CONCAT(DISTINCT e.descripcion ORDER BY e.descripcion SEPARATOR '||') AS especialidades,
              GROUP_CONCAT(DISTINCT e.id ORDER BY e.id SEPARATOR ',') AS id_especialidades
       FROM usuario u
       LEFT JOIN sede s ON s.id = u.id_sede
       LEFT JOIN cobertura c ON c.id = u.id_cobertura
       LEFT JOIN medico_especialidad me ON me.id_medico = u.id
       LEFT JOIN especialidad e ON e.id = me.id_especialidad
       ${where}
       GROUP BY u.id
       ORDER BY u.apellido, u.nombre, u.id
       LIMIT ? OFFSET ?`,
      [...parametros, limite, offset]
    );

    const usuarios = filas.map(usuario => ({
      ...usuario,
      rol: normalizarRol(usuario.rol),
      especialidades: usuario.especialidades ? usuario.especialidades.split("||") : [],
      id_especialidades: usuario.id_especialidades
        ? usuario.id_especialidades.split(",").map(Number)
        : []
    }));

    return res.json({
      codigo: 200,
      estado: "ok",
      datos: { usuarios, pagina, limite, total, totalPaginas }
    });
  } catch (error) {
    console.error("Error al listar usuarios:", error);
    return responderError(res, 500, "No se pudo obtener el listado de usuarios.");
  }
};

const darDeAlta = async (req, res) => {
  const datos = req.body;
  const errorValidacion = validarDatos(datos, true);
  if (errorValidacion) return responderError(res, 400, errorValidacion);
  const rol = normalizarRol(datos.rol);

  let connection;
  let transactionStarted = false;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    transactionStarted = true;
    const errorReferencia = await validarReferencias(connection, datos, rol);
    if (errorReferencia) {
      await connection.rollback();
      transactionStarted = false;
      return responderError(res, 400, errorReferencia);
    }

    const [duplicados] = await connection.query(
      "SELECT id FROM usuario WHERE dni = ? OR email = ?",
      [datos.dni.trim(), datos.email.trim()]
    );
    if (duplicados.length) {
      await connection.rollback();
      transactionStarted = false;
      return responderError(res, 400, "Ya existe un usuario con ese DNI o correo electrónico.");
    }

    const password = await bcrypt.hash(datos.password, 10);
    const idSede = rol === "medico" || rol === "operador" ? Number(datos.id_sede) : null;
    const idCobertura = rol === "paciente" && datos.id_cobertura ? Number(datos.id_cobertura) : null;
    const [resultado] = await connection.query(
      `INSERT INTO usuario
         (nombre, apellido, dni, email, password, fecha_nacimiento, telefono, rol, id_sede, id_cobertura)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        datos.nombre.trim(), datos.apellido.trim(), datos.dni.trim(), datos.email.trim(),
        password, datos.fecha_nacimiento, datos.telefono.trim(), rol, idSede, idCobertura
      ]
    );

    if (rol === "medico") {
      for (const idEspecialidad of [...new Set(datos.id_especialidades.map(Number))]) {
        await connection.query(
          "INSERT INTO medico_especialidad (id_medico, id_especialidad) VALUES (?, ?)",
          [resultado.insertId, idEspecialidad]
        );
      }
    }

    await connection.commit();
    transactionStarted = false;
    await logDarAlta(req.usuario.id, "ALTA", "usuario", resultado.insertId,
      `Alta de usuario ${datos.nombre.trim()} ${datos.apellido.trim()} (${rol})`);
    return res.status(201).json({
      codigo: 201,
      estado: "ok",
      datos: { id: resultado.insertId }
    });
  } catch (error) {
    if (connection && transactionStarted) await connection.rollback();
    console.error("Error al dar de alta un usuario:", error);
    return responderError(res, 500, "No se pudo dar de alta el usuario.");
  } finally {
    if (connection) connection.release();
  }
};

const actualizarUsuario = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) return responderError(res, 400, "El identificador no es válido.");
  const datos = req.body;
  const errorValidacion = validarDatos(datos, false);
  if (errorValidacion) return responderError(res, 400, errorValidacion);
  const rol = normalizarRol(datos.rol);

  let connection;
  let transactionStarted = false;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    transactionStarted = true;
    const [existentes] = await connection.query("SELECT id FROM usuario WHERE id = ?", [id]);
    if (!existentes.length) {
      await connection.rollback();
      transactionStarted = false;
      return responderError(res, 404, "Usuario no encontrado.");
    }

    const errorReferencia = await validarReferencias(connection, datos, rol);
    if (errorReferencia) {
      await connection.rollback();
      transactionStarted = false;
      return responderError(res, 400, errorReferencia);
    }

    const [duplicados] = await connection.query(
      "SELECT id FROM usuario WHERE (dni = ? OR email = ?) AND id <> ?",
      [datos.dni.trim(), datos.email.trim(), id]
    );
    if (duplicados.length) {
      await connection.rollback();
      transactionStarted = false;
      return responderError(res, 400, "Otro usuario ya tiene ese DNI o correo electrónico.");
    }

    const idSede = rol === "medico" || rol === "operador" ? Number(datos.id_sede) : null;
    const idCobertura = rol === "paciente" && datos.id_cobertura ? Number(datos.id_cobertura) : null;
    if (datos.password) {
      const password = await bcrypt.hash(datos.password, 10);
      await connection.query(
        `UPDATE usuario SET nombre = ?, apellido = ?, dni = ?, email = ?, password = ?,
         fecha_nacimiento = ?, telefono = ?, rol = ?, id_sede = ?, id_cobertura = ? WHERE id = ?`,
        [
          datos.nombre.trim(), datos.apellido.trim(), datos.dni.trim(), datos.email.trim(),
          password, datos.fecha_nacimiento, datos.telefono.trim(), rol, idSede, idCobertura, id
        ]
      );
    } else {
      await connection.query(
        `UPDATE usuario SET nombre = ?, apellido = ?, dni = ?, email = ?,
         fecha_nacimiento = ?, telefono = ?, rol = ?, id_sede = ?, id_cobertura = ? WHERE id = ?`,
        [
          datos.nombre.trim(), datos.apellido.trim(), datos.dni.trim(), datos.email.trim(),
          datos.fecha_nacimiento, datos.telefono.trim(), rol, idSede, idCobertura, id
        ]
      );
    }

    await connection.query("DELETE FROM medico_especialidad WHERE id_medico = ?", [id]);
    if (rol === "medico") {
      for (const idEspecialidad of [...new Set(datos.id_especialidades.map(Number))]) {
        await connection.query(
          "INSERT INTO medico_especialidad (id_medico, id_especialidad) VALUES (?, ?)",
          [id, idEspecialidad]
        );
      }
    }

    await connection.commit();
    transactionStarted = false;
    await logModificar(req.usuario.id, "MODIFICACION", "usuario", id,
      `Modificación de usuario ${datos.nombre.trim()} ${datos.apellido.trim()} (${rol})`);
    return res.json({ codigo: 200, estado: "ok", datos: { id } });
  } catch (error) {
    if (connection && transactionStarted) await connection.rollback();
    console.error("Error al modificar un usuario:", error);
    return responderError(res, 500, "No se pudo modificar el usuario.");
  } finally {
    if (connection) connection.release();
  }
};

module.exports = { listarUsuarios, darDeAlta, actualizarUsuario };
