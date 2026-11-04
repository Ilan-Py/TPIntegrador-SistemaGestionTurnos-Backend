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
router.post("/especialidad",    verificarToken, turnosPorEspecialidad);
router.post("/sede",            verificarToken, turnosPorSede);
router.post("/ranking-medicos", verificarToken, rankingMedicos);
router.post("/tasa-cancelacion", verificarToken, tasaDeCancelacion);

module.exports = router;