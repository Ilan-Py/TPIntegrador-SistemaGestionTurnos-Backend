const { Router } = require("express");
const { 
    turnosPorEspecialidad, 
    turnosPorSede, 
    rankingMedicos, 
    tasaDeCancelacion 
} = require("../controllers/reportesYEstadisticas.controller");
const { verificarToken } = require("../middlewares/auth.middleware");

const router = Router();

router.post("/especialidad",    verificarToken, turnosPorEspecialidad);
router.post("/sede",            verificarToken, turnosPorSede);
router.post("/ranking-medicos", verificarToken, rankingMedicos);
router.post("/tasa-cancelacion", verificarToken, tasaDeCancelacion);

module.exports = router;