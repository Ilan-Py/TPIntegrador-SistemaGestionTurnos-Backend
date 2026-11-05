const { Router } = require("express");
const { 
    dashboardReportes,
    turnosPorEspecialidad, 
    turnosPorSede, 
    rankingMedicos, 
    tasaDeCancelacion 
} = require("../controllers/reportesYEstadisticas.controller");
const { verificarToken, verificarRol } = require("../middlewares/auth.middleware");

const router = Router();

router.post("/dashboard", verificarToken, verificarRol("administrador"), dashboardReportes);
router.post("/especialidad",    verificarToken, verificarRol("administrador"), turnosPorEspecialidad);
router.post("/sede",            verificarToken, verificarRol("administrador"), turnosPorSede);
router.post("/ranking-medicos", verificarToken, verificarRol("administrador"), rankingMedicos);
router.post("/tasa-cancelacion", verificarToken, verificarRol("administrador"), tasaDeCancelacion);

module.exports = router;