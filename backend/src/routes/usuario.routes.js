const { Router } = require("express");
const { listarUsuarios, darDeAlta, actualizarUsuario } = require("../controllers/usuario.controller");
const { verificarToken, verificarRol } = require("../middlewares/auth.middleware");

const router = Router();

router.use(verificarToken, verificarRol("administrador"));
router.get("/", listarUsuarios);
router.post("/", darDeAlta);
router.put("/:id", actualizarUsuario);

module.exports = router;
