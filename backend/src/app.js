require("dotenv").config();

const express = require("express");
const morgan = require("morgan");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");
const sedeRoutes = require("./routes/sede.routes");
const coberturaRoutes = require("./routes/cobertura.routes");
const agendaRoutes = require("./routes/agendas.routes");
const especialidadRoutes = require("./routes/especialidad.routes");
const turnoRoutes = require("./routes/turnos.routes");
const historialRoutes = require("./routes/historial.routes");
const notificacionesRoutes = require("./routes/notificaciones.routes");
const reportesYEstadisticasRoutes = require("./routes/reportesYEstadisticas.routes");
const logRoutes = require("./routes/log.routes");

const app = express();

app.set("port", process.env.PORT || 4000);

app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/sedes", sedeRoutes);
app.use("/coberturas", coberturaRoutes);
app.use("/agendas", agendaRoutes);
app.use("/especialidades", especialidadRoutes);
app.use("/turnos", turnoRoutes);
app.use("/historial", historialRoutes);
app.use("/notificaciones", notificacionesRoutes);
app.use("/reportesYEstadisticas", reportesYEstadisticasRoutes);
app.use("/logs", logRoutes);
app.get("/health", (req, res) => {
  res.json({ codigo: 200, estado: "ok", datos: { mensaje: "Servidor activo" } }); //puse para verificar el estado del servidor mas facil
});

app.use((req, res) => {
  res.status(404).json({ codigo: 404, estado: "Ruta no encontrada", datos: null });
});

module.exports = app;