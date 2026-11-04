const { Router } = require("express");
const { registrarHistorial, obtenerHistorial } = require("../controllers/historial.controller");
const { verificarToken, verificarRol } = require("../middlewares/auth.middleware");

const router = Router();

router.post("/:id",             verificarToken, verificarRol("medico"), registrarHistorial);
router.get("/:id_paciente",     verificarToken, verificarRol("paciente", "medico"), obtenerHistorial);

module.exports = router;
