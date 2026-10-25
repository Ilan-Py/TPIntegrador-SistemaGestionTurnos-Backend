const { Router } = require("express");
const { listarLogAuditoria } = require("../controllers/logsAuditoria.controller");
const { verificarToken, verificarRol } = require("../middlewares/auth.middleware");

const router = Router();

router.post("/listar", verificarToken, verificarRol("administrador"), listarLogAuditoria);

module.exports = router;