# TPIntegrador — Sistema de Gestión de Turnos Médicos

Trabajo Práctico Integrador de Programación 2 — IES Santa Fe — 2026.

Sistema web para la gestión de turnos médicos, usuarios y agendas de una clínica. Desarrollo dividido en dos etapas: backend con Node.js y frontend con Angular 21.

**Desarrollado por Ilan Pitashny y Aaron Juarez.**

---

## Organización del repositorio

```
├── backend/    <- API REST — Node.js + Express + MySQL
├── frontend/   <- Aplicación web — Angular 21 + Angular Material
└── README.md
```

Cada carpeta tiene su propio README con instrucciones específicas.

---

## Stack tecnológico

**Backend**
- Node.js + Express
- MySQL / MariaDB
- JWT — autenticación
- bcrypt — hash de contraseñas

**Frontend** *(próxima etapa)*
- Angular 21
- Angular Material

---

## Changelog

### [Semana 4] — Backend: Reportes, documentación y cierre

#### Agregado
- Endpoint de reportes y estadísticas `POST /reportesYEstadisticas` — solo rol `administrador`
  - Consulta de turnos por especialidad dentro de un rango de fechas
  - Validación de formato de fechas, rango válido e id_especialidad
  - Devuelve cantidad total y listado de turnos
- Historial clínico separado como paso posterior a la atención
  - `POST /historial/:id` — el médico registra diagnóstico, tratamiento y observaciones luego de atender el turno
  - Validación de turno atendido, pertenencia al médico y no duplicación
- Colección Postman completa con todos los endpoints y descripciones `backend/postman/coleccion-completa.json`

#### Modificado
- `PATCH /turnos/bajaTurno/:id` — método cambiado de `DELETE` a `PATCH` ya que la operación modifica el estado del turno a cancelado sin eliminar el registro


### [Semana 3] — Backend: Turnos, historial clínico y notificaciones
#### Agregado
- Endpoint de alta de turno para paciente (u operador en su representación)
  - Validación de disponibilidad contra la agenda del médico (horario y superposición con turnos confirmados)
  - Cobertura del turno tomada automáticamente del paciente, sin poder pisarse desde el body
- Endpoint de cancelación de turno propio (rol `paciente`) o de la sede (roles `operador`, `medico`)
- Endpoint de atención de turno por parte del médico, con carga asociada del historial clínico
  - El médico solo puede atender sus propios turnos confirmados
- Endpoint de consulta de historial clínico
  - El paciente ve la totalidad de su propio historial
  - El médico ve únicamente los registros de los turnos que él mismo atendió
- Sistema de notificaciones internas, generadas automáticamente ante alta, cancelación y atención de un turno
  - Endpoint de listado de notificaciones propias, de más reciente a más antigua
  - Endpoint para marcar una notificación propia como leída
- Listados de turnos: por paciente (`mis-turnos`), por médico y fecha, y por sede y fecha (para el operador)
- Colección Postman `backend/postman/backend-semana-3.json`

### [Semana 2] — Backend: CRUD de sedes, especialidades, coberturas y agenda
#### Agregado
- CRUD completo de sedes — solo rol `administrador`
  - Validación antes de eliminar: no puede tener usuarios ni agenda asociada
- CRUD completo de especialidades — solo rol `administrador`
  - Validación antes de eliminar: no puede tener médicos asociados en `medico_especialidad`
- CRUD completo de coberturas — solo rol `administrador`
  - Validación antes de eliminar: no puede tener usuarios asociados
  - Endpoint público `GET /coberturas/public` reutilizable desde el registro de pacientes
- CRUD completo de agenda médica — roles `medico`, `operador`, `administrador`
  - El médico solo puede gestionar su propia agenda
  - El operador puede gestionar la agenda de cualquier médico y sede
  - El paciente no tiene acceso
  - Listado filtrable por médico, sede y fecha
- Script de usuarios de prueba `backend/scripts/usuarios_prueba.sql`
- Colección Postman `backend/postman/backend-semana-2.json`

### [Semana 1] — Backend: Setup y autenticación
#### Agregado
- Inicialización del proyecto Node.js + Express
- Conexión a MySQL con pool de conexiones
- Variables de entorno con dotenv
- Middleware `verificarToken` — valida JWT en requests protegidos
- Middleware `verificarRol` — valida el rol del usuario
- `GET /health` — health check del servidor
- `GET /auth/coberturas` — lista coberturas para el registro
- `POST /auth/registro` — registro de paciente con bcrypt
- `POST /auth/login` — login por DNI, devuelve JWT
- `GET /auth/perfil` — datos del usuario logueado (protegido)
- Script de base de datos `backend/scripts/clinica_ampliada.sql`
- Colección Postman `backend/postman/backend-semana-1.json`