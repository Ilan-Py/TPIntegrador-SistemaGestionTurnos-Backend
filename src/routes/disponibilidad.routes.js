const { Router } = require("express");
const { fechasDisponibles, horariosDisponibles } = require("../controllers/disponibilidad.controller");
const { verificarToken, verificarRol } = require("../middlewares/auth.middleware");

const router = Router();

router.get("/fechas",   verificarToken, verificarRol("paciente", "operador"), fechasDisponibles);
router.get("/horarios", verificarToken, verificarRol("paciente", "operador"), horariosDisponibles);

module.exports = router;
