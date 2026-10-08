const { Router } = require("express");
const { obtenerCoberturas, registro, login, perfil } = require("../controllers/auth.controller");
const { verificarToken, verificarRol } = require("../middlewares/auth.middleware");

const router = Router();

router.get("/coberturas", obtenerCoberturas);
router.post("/registro",  registro);
router.post("/login",     login);

router.get("/perfil",     verificarToken, perfil);
router.get("/admin-only", verificarToken, verificarRol("administrador"), (req, res) => {
  res.json({ codigo: 200, estado: "ok", datos: { mensaje: "Acceso admin correcto", usuario: req.usuario } }); //meti para verificar que el middleware de rol funciona correctamente
});

module.exports = router;
