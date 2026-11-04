const { Router } = require("express");
const { listarCoberturas, darDeAlta, actualizarCobertura, darDeBaja } = require("../controllers/cobertura.controller");
const { verificarToken, verificarRol } = require("../middlewares/auth.middleware");

const router = Router();

// Ruta publica reutilizable desde el registro de pacientes (semana 1)
router.get("/public", listarCoberturas);

router.get("/",       verificarToken, verificarRol("administrador"), listarCoberturas);
router.post("/",      verificarToken, verificarRol("administrador"), darDeAlta);
router.put("/:id",    verificarToken, verificarRol("administrador"), actualizarCobertura);
router.delete("/:id", verificarToken, verificarRol("administrador"), darDeBaja);

module.exports = router;
