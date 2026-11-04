const { Router } = require("express");
const { listarNotificaciones, marcarLeida } = require("../controllers/notificaciones.controller");
const { verificarToken } = require("../middlewares/auth.middleware");

const router = Router();

router.get("/",           verificarToken, listarNotificaciones);
router.patch("/:id/leer", verificarToken, marcarLeida);

module.exports = router;
