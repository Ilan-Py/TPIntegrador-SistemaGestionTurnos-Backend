# Backend — Sistema de Gestión de Turnos Médicos

Backend del TP Integrador de Programación 2. Node.js + Express + MySQL.

---

## Estructura

```
backend/
├── scripts/
│   ├── clinica_ampliada.sql
│   └── usuarios_prueba.sql
├── postman/
│   ├── backend-semana-1.json
│   ├── backend-semana-2.json
│   ├── backend-semana-3.json
│   └── backend-semana-4.json      <- colección completa (incluye los cambios para el frontend)
├── src/
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── sede.controller.js
│   │   ├── cobertura.controller.js
│   │   ├── especialidad.controller.js
│   │   ├── agendas.controller.js
│   │   ├── turnos.controller.js
│   │   ├── historial.controller.js
│   │   ├── notificaciones.controller.js
│   │   ├── usuario.controller.js
│   │   ├── logsAuditoria.controller.js
│   │   ├── reportesYEstadisticas.controller.js
│   │   ├── medicos.controller.js
│   │   ├── disponibilidad.controller.js
│   │   └── pacientes.controller.js
│   ├── database/
│   │   └── database.js
│   ├── middlewares/
│   │   └── auth.middleware.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── sede.routes.js
│   │   ├── cobertura.routes.js
│   │   ├── especialidad.routes.js
│   │   ├── agendas.routes.js
│   │   ├── turnos.routes.js
│   │   ├── historial.routes.js
│   │   ├── notificaciones.routes.js
│   │   ├── usuario.routes.js
│   │   ├── log.routes.js
│   │   ├── reportesYEstadisticas.routes.js
│   │   ├── medicos.routes.js
│   │   ├── disponibilidad.routes.js
│   │   └── pacientes.routes.js
│   ├── utils/
│   │   └── horarios.js            <- duración del turno y cálculo de horarios
│   ├── app.js
│   └── index.js
├── .env.example
├── .gitignore
└── package.json
```

---

## Instrucciones para ejecutar

### 1 — Base de datos

- Encender XAMPP
- Importar `scripts/clinica_ampliada.sql` en phpMyAdmin
- Importar `scripts/usuarios_prueba.sql` en phpMyAdmin

### 2 — Variables de entorno

Crear `.env` en la raíz de `backend/` copiando `.env.example`:

```
HOST=localhost
DATABASE=clinica
USER=root
PASSWORD=
JWT_SECRET=ClaveSecretaTP2026
JWT_EXPIRES_IN=8h
PORT=4000
```

### 3 — Instalar y correr

```bash
npm install
npm run dev
```

Servidor en `http://localhost:4000`

---

## Endpoints

### Semana 1 — Autenticación

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET | /health | Health check | No |
| GET | /auth/coberturas | Coberturas disponibles para registro | No |
| POST | /auth/registro | Registro de paciente (teléfono opcional) | No |
| POST | /auth/login | Login, devuelve JWT | No |
| GET | /auth/perfil | Perfil del usuario logueado (el médico recibe también sus especialidades) | Token |
| PUT | /auth/perfil | El paciente modifica email, contraseña, teléfono y cobertura | paciente |

### Semana 2 — CRUD de entidades base y agenda

| Método | Ruta | Descripción | Rol |
|--------|------|-------------|-----|
| GET | /sedes | Listar sedes | cualquier usuario con sesión |
| POST | /sedes | Crear sede | administrador |
| PUT | /sedes/:id | Modificar sede | administrador |
| DELETE | /sedes/:id | Eliminar sede | administrador |
| GET | /especialidades | Listar especialidades | cualquier usuario con sesión |
| POST | /especialidades | Crear especialidad | administrador |
| PUT | /especialidades/:id | Modificar especialidad | administrador |
| DELETE | /especialidades/:id | Eliminar especialidad (no si tiene médicos o agenda) | administrador |
| GET | /coberturas/public | Listar coberturas sin auth | No |
| GET | /coberturas | Listar coberturas | administrador |
| POST | /coberturas | Crear cobertura | administrador |
| PUT | /coberturas/:id | Modificar cobertura | administrador |
| DELETE | /coberturas/:id | Eliminar cobertura (no si tiene usuarios o turnos) | administrador |
| GET | /agendas | Listar agenda (filtrable por medico, sede, fecha) | medico, operador, administrador |
| POST | /agendas | Crear rango horario de agenda | medico, operador, administrador |
| PUT | /agendas/:id | Modificar rango horario (no puede dejar turnos confirmados afuera) | medico, operador, administrador |
| DELETE | /agendas/:id | Eliminar rango horario (no si tiene turnos) | medico, operador, administrador |

### Semana 3 — Turnos, historial clínico y notificaciones

| Método | Ruta | Descripción | Rol |
|--------|------|-------------|-----|
| POST | /turnos/altaTurno | Solicitar turno (paciente, o operador en su sede en representación del paciente) | paciente, operador |
| PATCH | /turnos/bajaTurno/:id | Cancelar turno: el paciente los propios, el médico los propios en cualquier sede, el operador los de su sede | paciente, operador, medico |
| PATCH | /turnos/:id/atender | Marcar turno como atendido | medico |
| GET | /turnos/mis-turnos | Turnos propios del paciente, ordenados del más próximo al menos próximo | paciente |
| GET | /turnos/medico | Turnos del médico para una fecha (`fecha`, `id_sede` opcional), con edad del paciente | medico |
| GET | /turnos/sede | Turnos de la sede del operador para una fecha (incluye `id_medico`, `id_paciente` y DNI del paciente) | operador, administrador |
| POST | /historial/:id | Registrar historial clínico de un turno atendido | medico |
| GET | /historial/:id_paciente | Historial clínico de un paciente (propio para el paciente, solo lo atendido para el médico) | paciente, medico |
| GET | /notificaciones | Notificaciones propias del usuario, de más reciente a más antigua | Token |
| PATCH | /notificaciones/:id/leer | Marcar una notificación propia como leída | Token |

### Semana 4 — Usuarios, auditoría y reportes

| Método | Ruta | Descripción | Rol |
|--------|------|-------------|-----|
| GET | /usuarios | Listado paginado con filtros por nombre, apellido, rol y sede | administrador |
| POST | /usuarios | Alta de operador, médico (con especialidades) o administrador | administrador |
| PUT | /usuarios/:id | Edición de cualquier usuario | administrador |
| GET | /logs/auditoria | Auditoría paginada, filtros opcionales: usuario, entidad, fechaDesde, fechaHasta | administrador |
| POST | /logs/listar | Auditoría filtrada (requiere usuario, entidad y rango de fechas en el body) | administrador |
| POST | /reportesYEstadisticas/especialidad | Turnos de una especialidad en un rango de fechas | administrador |
| POST | /reportesYEstadisticas/sede | Turnos de una sede en un rango de fechas | administrador |
| POST | /reportesYEstadisticas/ranking-medicos | Ranking de médicos por turnos atendidos | administrador |
| POST | /reportesYEstadisticas/tasa-cancelacion | Tasa de cancelación del período (porcentaje) | administrador |

### Cambios para el frontend

Agregados según la sección "Sugerencias de cambios en el backend" del enunciado del frontend. Documentados en la carpeta **CAMBIOS PARA EL FRONTEND** de `postman/backend-semana-4.json`.

| Método | Ruta | Descripción | Rol |
|--------|------|-------------|-----|
| GET | /sedes, /especialidades | Los listados pasan a estar disponibles para cualquier usuario con sesión (alta, modificación y baja siguen siendo del administrador) | Token |
| GET | /medicos | Médicos con sus especialidades, sin datos personales. Filtros opcionales: `id_especialidad`, `id_sede`, `con_agenda=true` | Token |
| GET | /disponibilidad/fechas | Fechas con agenda y horarios libres para `id_medico`, `id_especialidad`, `id_sede` | paciente, operador |
| GET | /disponibilidad/horarios | Horarios libres de una `fecha` para `id_medico`, `id_especialidad`, `id_sede` | paciente, operador |
| GET | /pacientes | Búsqueda de pacientes por `dni` (empieza con) o `apellido` (contiene), hasta 20 resultados | operador, medico, administrador |
| PUT | /auth/perfil | El paciente actualiza email, contraseña (hasheada), teléfono y cobertura; cualquier otro campo devuelve 400 | paciente |
| GET | /auth/perfil | Para el médico incluye `especialidades: [{ id, descripcion }]` | Token |
| GET | /turnos/medico | Agrega `id_paciente`, `paciente_dni`, `paciente_fecha_nacimiento`, `paciente_edad`, `id_sede`, `id_especialidad` y el filtro opcional `id_sede` | medico |
| GET | /turnos/sede | Agrega `id_medico`, `id_paciente`, `paciente_dni` e `id_especialidad`, para que el operador vea los turnos de un médico | operador, administrador |

**Duración del turno:** cada turno dura 30 minutos (`DURACION_TURNO_MINUTOS` en `src/utils/horarios.js`). Los horarios empiezan en la hora de entrada de cada rango de agenda, cada 30 minutos, y el turno tiene que terminar antes de la hora de salida (por ejemplo, 09:00 a 10:30 ofrece 09:00, 09:30 y 10:00). `GET /disponibilidad/horarios` y `POST /turnos/altaTurno` usan la misma regla.

**Otras reglas agregadas:**
- El operador solo puede asignar turnos en su propia sede (403).
- El médico solo puede cancelar sus propios turnos, en cualquiera de las sedes donde atiende.
- No se puede eliminar un rango de agenda con turnos, ni modificarlo dejando turnos confirmados fuera del horario o cambiándole fecha, médico, especialidad o sede.

### Formato de respuesta uniforme

```json
{
  "codigo": 200,
  "estado": "ok",
  "datos": { }
}
```

---

## Credenciales de prueba

Importar `scripts/usuarios_prueba.sql` en phpMyAdmin luego de importar la base principal.

| Rol | DNI | Contraseña |
|-----|-----|------------|
| administrador | 00000001 | password123 |
| medico | 00000002 | password123 |
| operador | 00000003 | password123 |
| paciente | 00000004 | password123 |

La colección completa está en `backend/postman/backend-semana-4.json`. La colección `backend/postman/backend-semana-3.json` incluye casos de prueba de: un turno rechazado por horario no disponible, un turno cancelado que genera notificación, y un turno atendido con su historial clínico asociado.
