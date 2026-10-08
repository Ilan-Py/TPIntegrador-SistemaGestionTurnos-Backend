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
│   └── backend-semana-3.json
├── src/
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── sede.controller.js
│   │   ├── cobertura.controller.js
│   │   ├── especialidad.controller.js
│   │   ├── agendas.controller.js
│   │   ├── turnos.controller.js
│   │   ├── historial.controller.js
│   │   └── notificaciones.controller.js
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
│   │   └── notificaciones.routes.js
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
| POST | /auth/registro | Registro de paciente | No |
| POST | /auth/login | Login, devuelve JWT | No |
| GET | /auth/perfil | Perfil del usuario logueado | Token |

### Semana 2 — CRUD de entidades base y agenda

| Método | Ruta | Descripción | Rol |
|--------|------|-------------|-----|
| GET | /sedes | Listar sedes | administrador |
| POST | /sedes | Crear sede | administrador |
| PUT | /sedes/:id | Modificar sede | administrador |
| DELETE | /sedes/:id | Eliminar sede | administrador |
| GET | /especialidades | Listar especialidades | administrador |
| POST | /especialidades | Crear especialidad | administrador |
| PUT | /especialidades/:id | Modificar especialidad | administrador |
| DELETE | /especialidades/:id | Eliminar especialidad | administrador |
| GET | /coberturas/public | Listar coberturas sin auth | No |
| GET | /coberturas | Listar coberturas | administrador |
| POST | /coberturas | Crear cobertura | administrador |
| PUT | /coberturas/:id | Modificar cobertura | administrador |
| DELETE | /coberturas/:id | Eliminar cobertura | administrador |
| GET | /agendas | Listar agenda (filtrable por medico, sede, fecha) | medico, operador, administrador |
| POST | /agendas | Crear turno de agenda | medico, operador, administrador |
| PUT | /agendas/:id | Modificar turno de agenda | medico, operador, administrador |
| DELETE | /agendas/:id | Eliminar turno de agenda | medico, operador, administrador |

### Semana 3 — Turnos, historial clínico y notificaciones

| Método | Ruta | Descripción | Rol |
|--------|------|-------------|-----|
| POST | /turnos/altaTurno | Solicitar turno (paciente, o operador en su representación) | paciente, operador |
| POST | /turnos/bajaTurno | Cancelar turno propio (paciente) o de la sede (operador/médico) | paciente, operador, medico |
| PATCH | /turnos/:id/atender | Marcar turno como atendido y registrar el historial clínico asociado | medico |
| GET | /turnos/mis-turnos | Turnos propios del paciente, ordenados del más próximo al menos próximo | paciente |
| GET | /turnos/medico | Turnos del médico para una fecha determinada | medico |
| GET | /turnos/sede | Turnos de una sede para una fecha determinada | operador, administrador |
| GET | /historial/:id_paciente | Historial clínico de un paciente (propio para el paciente, solo lo atendido para el médico) | paciente, medico |
| GET | /notificaciones | Notificaciones propias del usuario, de más reciente a más antigua | Token |
| PATCH | /notificaciones/:id/leer | Marcar una notificación propia como leída | Token |

### Semana 4 — Reportes y cierre

| Método | Ruta | Descripción | Rol |
|--------|------|-------------|-----|
| POST | /reportesYEstadisticas | Turnos por especialidad en rango de fechas | administrador |
| POST | /historial/:id | Registrar historial clínico de un turno atendido | medico |

#### Cambios
- `PATCH /turnos/bajaTurno/:id` — método cambiado de `DELETE` a `PATCH`
- Colección Postman completa actualizada en `backend/postman/coleccion-completa.json`


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

La colección de Postman `backend/postman/backend-semana-3.json` incluye casos de prueba de: un turno rechazado por horario no disponible, un turno cancelado que genera notificación, y un turno atendido con su historial clínico asociado.
