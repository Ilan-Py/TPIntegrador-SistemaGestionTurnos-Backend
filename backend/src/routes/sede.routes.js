const { Router } = require("express");
const { listarSedes, darDeAlta, actualizarSede, darDeBaja } = require("../controllers/sede.controller");
const { verificarToken, verificarRol } = require("../middlewares/auth.middleware");

const router = Router();

// Listado para cualquier usuario con sesión; alta, modificación y baja solo administrador.
router.get("/",       verificarToken, listarSedes);
router.post("/",      verificarToken, verificarRol("administrador"), darDeAlta);
router.put("/:id",    verificarToken, verificarRol("administrador"), actualizarSede);
router.delete("/:id", verificarToken, verificarRol("administrador"), darDeBaja);

module.exports = router;
