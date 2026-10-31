const { Router } = require("express");
const { listarEspecialidades, darDeAlta, actualizarEspecialidad, darDeBaja } = require("../controllers/especialidad.controller");
const { verificarToken, verificarRol } = require("../middlewares/auth.middleware");

const router = Router();

// Listado para cualquier usuario con sesión; alta, modificación y baja solo administrador.
router.get("/",       verificarToken, listarEspecialidades);
router.post("/",      verificarToken, verificarRol("administrador"), darDeAlta);
router.put("/:id",    verificarToken, verificarRol("administrador"), actualizarEspecialidad);
router.delete("/:id", verificarToken, verificarRol("administrador"), darDeBaja);

module.exports = router;
