const { Router } = require("express");
const { buscarPacientes } = require("../controllers/pacientes.controller");
const { verificarToken, verificarRol } = require("../middlewares/auth.middleware");

const router = Router();

router.get("/", verificarToken, verificarRol("operador", "medico", "administrador"), buscarPacientes);

module.exports = router;
