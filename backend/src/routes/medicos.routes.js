const { Router } = require("express");
const { listarMedicos } = require("../controllers/medicos.controller");
const { verificarToken } = require("../middlewares/auth.middleware");

const router = Router();

// Cualquier usuario con sesión: lo usan el paciente (nuevo turno), el operador (agenda) y el médico.
router.get("/", verificarToken, listarMedicos);

module.exports = router;
