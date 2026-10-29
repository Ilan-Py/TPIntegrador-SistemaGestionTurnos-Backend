const { Router } = require("express");
const { listarAuditoria, listarLogAuditoria } = require("../controllers/logsAuditoria.controller");
const { verificarToken, verificarRol } = require("../middlewares/auth.middleware");

const router = Router();

router.get("/auditoria", verificarToken, verificarRol("administrador"), listarAuditoria);
router.post("/listar", verificarToken, verificarRol("administrador"), listarLogAuditoria);

module.exports = router;