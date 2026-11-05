-- =============================================================
--  DEMO INTEGRADOR — Sistema de Gestión de Turnos Médicos
--  Clínica Virtual · IES Santa Fe · Programación 2 · 2026
--
--  Ejecutar DESPUÉS de clinica_ampliada.sql (que crea la BD).
--  Reemplaza todos los datos de demo anteriores.
--  Contraseña de todos los usuarios: password123
-- =============================================================

USE clinica;

-- Limpiar datos previos respetando FK (orden inverso)
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE notificacion;
TRUNCATE TABLE log_auditoria;
TRUNCATE TABLE historial_clinico;
TRUNCATE TABLE turno;
TRUNCATE TABLE agenda;
TRUNCATE TABLE medico_especialidad;
TRUNCATE TABLE usuario;
TRUNCATE TABLE especialidad;
TRUNCATE TABLE cobertura;
TRUNCATE TABLE sede;
SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================
-- CATÁLOGOS BASE
-- =============================================================

INSERT INTO sede (id, nombre, direccion, telefono) VALUES
(1, 'Sede Centro',  'San Martín 123, Santa Fe',      '3424100001'),
(2, 'Sede Norte',   'Av. Rivadavia 456, Santo Tomé', '3424100002'),
(3, 'Sede Sur',     'Bv. Galvez 789, Santa Fe',      '3424100003');

INSERT INTO cobertura (id, nombre) VALUES
(1, 'Jerarquicos'),
(2, 'OSDE'),
(3, 'Swiss Medical'),
(4, 'IOSE'),
(5, 'Sin cobertura');

INSERT INTO especialidad (id, descripcion) VALUES
(1, 'Traumatología'),
(2, 'Cardiología'),
(3, 'Pediatría'),
(4, 'Clínica Médica'),
(5, 'Dermatología');

-- =============================================================
-- USUARIOS  (bcrypt de 'password123')
-- =============================================================

SET @hash = '$2b$10$2m51ddasppBJl5iNKJOZCedPxtSB5rQkzePn1aJ7w.XP/Bj2pgBAO';

INSERT INTO usuario (id, apellido, nombre, fecha_nacimiento, password, rol, email, telefono, dni, id_sede, id_cobertura) VALUES
-- Administradores
(1,  'Gomez',      'Marcos',    '1975-03-15', @hash, 'administrador', 'mgomez@clinica.com',      '3424200001', '00000001', NULL, NULL),
(2,  'Fernandez',  'Laura',     '1980-07-22', @hash, 'administrador', 'lfernandez@clinica.com',  '3424200002', '22200002', NULL, NULL),

-- Operadores
(3,  'Perez',      'Juan',      '1990-04-10', @hash, 'operador',      'jperez@clinica.com',      '3424300001', '00000002', 1,    NULL),
(4,  'Suarez',     'Maria',     '1992-09-18', @hash, 'operador',      'msuarez@clinica.com',     '3424300002', '30300002', 2,    NULL),
(5,  'Torres',     'Diego',     '1988-11-05', @hash, 'operador',      'dtorres@clinica.com',     '3424300003', '26300003', 3,    NULL),

-- Médicos
(6,  'Lopez',      'Ana',       '1978-05-10', @hash, 'medico',        'alopez@clinica.com',      '3424400001', '00000003', 1,    NULL),
(7,  'Ramirez',    'Carlos',    '1972-08-25', @hash, 'medico',        'cramirez@clinica.com',    '3424400002', '16400002', 2,    NULL),
(8,  'Vega',       'Sofia',     '1985-02-14', @hash, 'medico',        'svega@clinica.com',       '3424400003', '23400003', 1,    NULL),
(9,  'Mendez',     'Pablo',     '1980-06-30', @hash, 'medico',        'pmendez@clinica.com',     '3424400004', '22400004', 3,    NULL),
(10, 'Acosta',     'Valeria',   '1976-12-01', @hash, 'medico',        'vacosta@clinica.com',     '3424400005', '19400005', 2,    NULL),

-- Pacientes
(11, 'Friggeri',   'Franco',    '1998-03-14', @hash, 'paciente',      'ffriggeri@gmail.com',     '3424500001', '00000004', NULL, 1),
(12, 'Rodríguez',  'Valentina', '2001-07-20', @hash, 'paciente',      'vrodriguez@gmail.com',    '3424500002', '39500002', NULL, 2),
(13, 'Martínez',   'Lucas',     '1995-11-08', @hash, 'paciente',      'lmartinez@gmail.com',     '3424500003', '32500003', NULL, 3),
(14, 'Sosa',       'Camila',    '1990-04-25', @hash, 'paciente',      'csosa@gmail.com',         '3424500004', '27500004', NULL, 1),
(15, 'Blanco',     'Tomás',     '2003-01-17', @hash, 'paciente',      'tblanco@gmail.com',       '3424500005', '41500005', NULL, 2);

-- =============================================================
-- MÉDICOS ↔ ESPECIALIDADES
-- =============================================================

INSERT INTO medico_especialidad (id_medico, id_especialidad) VALUES
(6,  1),  -- Lopez: Traumatología
(6,  4),  -- Lopez: Clínica Médica
(7,  2),  -- Ramirez: Cardiología
(8,  3),  -- Vega: Pediatría
(9,  4),  -- Mendez: Clínica Médica
(9,  5),  -- Mendez: Dermatología
(10, 2),  -- Acosta: Cardiología
(10, 1);  -- Acosta: Traumatología

-- =============================================================
-- AGENDAS
-- Usamos fechas relativas a HOY para que siempre haya algo
-- próximo cuando se muestra la demo.
-- =============================================================

-- Agendas pasadas (para que los reportes tengan datos)
INSERT INTO agenda (id, hora_entrada, hora_salida, fecha, id_medico, id_especialidad, id_sede) VALUES
(1,  '08:00', '12:00', CURDATE() - INTERVAL 30 DAY, 6,  1, 1),
(2,  '14:00', '18:00', CURDATE() - INTERVAL 30 DAY, 7,  2, 2),
(3,  '09:00', '13:00', CURDATE() - INTERVAL 20 DAY, 8,  3, 1),
(4,  '10:00', '14:00', CURDATE() - INTERVAL 20 DAY, 9,  4, 3),
(5,  '08:00', '12:00', CURDATE() - INTERVAL 15 DAY, 6,  1, 1),
(6,  '14:00', '18:00', CURDATE() - INTERVAL 15 DAY, 10, 2, 2),
(7,  '09:00', '13:00', CURDATE() - INTERVAL 10 DAY, 7,  2, 2),
(8,  '08:00', '12:00', CURDATE() - INTERVAL 10 DAY, 9,  5, 3),
(9,  '14:00', '18:00', CURDATE() - INTERVAL 7 DAY,  6,  4, 1),
(10, '09:00', '13:00', CURDATE() - INTERVAL 7 DAY,  8,  3, 1),
(11, '08:00', '12:00', CURDATE() - INTERVAL 3 DAY,  7,  2, 2),
(12, '14:00', '18:00', CURDATE() - INTERVAL 3 DAY,  10, 1, 2),
-- Agendas de hoy
(13, '08:00', '12:00', CURDATE(), 6,  1, 1),
(14, '14:00', '18:00', CURDATE(), 7,  2, 2),
(15, '09:00', '13:00', CURDATE(), 8,  3, 1),
(16, '08:00', '12:00', CURDATE(), 9,  5, 3),
-- Agendas futuras (para que el paciente pueda sacar turno)
(17, '08:00', '12:00', CURDATE() + INTERVAL 1 DAY,  6,  1, 1),
(18, '14:00', '18:00', CURDATE() + INTERVAL 1 DAY,  7,  2, 2),
(19, '09:00', '13:00', CURDATE() + INTERVAL 1 DAY,  8,  3, 1),
(20, '08:00', '12:00', CURDATE() + INTERVAL 2 DAY,  9,  4, 3),
(21, '14:00', '18:00', CURDATE() + INTERVAL 2 DAY,  10, 2, 2),
(22, '09:00', '13:00', CURDATE() + INTERVAL 2 DAY,  6,  4, 1),
(23, '08:00', '12:00', CURDATE() + INTERVAL 5 DAY,  7,  2, 2),
(24, '14:00', '18:00', CURDATE() + INTERVAL 5 DAY,  8,  3, 1),
(25, '09:00', '13:00', CURDATE() + INTERVAL 7 DAY,  9,  5, 3);

-- =============================================================
-- TURNOS
-- Estados: confirmado / cancelado / atendido
-- =============================================================

INSERT INTO turno (id, nota, id_agenda, fecha, hora, id_paciente, id_cobertura, estado) VALUES
-- Turnos pasados atendidos
(1,  'Control anual',              1,  CURDATE() - INTERVAL 30 DAY, '08:30', 11, 1, 'atendido'),
(2,  'Dolor en rodilla derecha',   1,  CURDATE() - INTERVAL 30 DAY, '09:00', 12, 2, 'atendido'),
(3,  'Chequeo cardiológico',       2,  CURDATE() - INTERVAL 30 DAY, '14:30', 13, 3, 'atendido'),
(4,  'Fiebre y tos',               3,  CURDATE() - INTERVAL 20 DAY, '09:30', 14, 1, 'atendido'),
(5,  'Control de crecimiento',     3,  CURDATE() - INTERVAL 20 DAY, '10:00', 15, 2, 'atendido'),
(6,  'Dolor lumbar',               4,  CURDATE() - INTERVAL 20 DAY, '10:30', 11, 1, 'atendido'),
(7,  'Arritmia ocasional',         6,  CURDATE() - INTERVAL 15 DAY, '14:30', 12, 2, 'atendido'),
(8,  'Revisión de fractura',       5,  CURDATE() - INTERVAL 15 DAY, '08:30', 13, 3, 'atendido'),
(9,  'Manchas en la piel',         8,  CURDATE() - INTERVAL 10 DAY, '08:30', 14, 1, 'atendido'),
(10, 'Presión alta',               7,  CURDATE() - INTERVAL 10 DAY, '09:30', 15, 2, 'atendido'),
(11, 'Consulta por alergias',      9,  CURDATE() - INTERVAL 7 DAY,  '14:30', 11, 1, 'atendido'),
(12, 'Dolor en tobillo',           12, CURDATE() - INTERVAL 3 DAY,  '14:30', 12, 2, 'atendido'),
-- Turnos pasados cancelados
(13, NULL,                         1,  CURDATE() - INTERVAL 30 DAY, '10:00', 13, 3, 'cancelado'),
(14, NULL,                         2,  CURDATE() - INTERVAL 30 DAY, '15:30', 14, 1, 'cancelado'),
(15, NULL,                         5,  CURDATE() - INTERVAL 15 DAY, '09:30', 15, 2, 'cancelado'),
(16, NULL,                         7,  CURDATE() - INTERVAL 10 DAY, '10:30', 11, 1, 'cancelado'),
(17, NULL,                         11, CURDATE() - INTERVAL 3 DAY,  '08:30', 13, 3, 'cancelado'),
-- Turnos de hoy confirmados (el médico los verá en su panel)
(18, 'Seguimiento postoperatorio', 13, CURDATE(), '08:30', 11, 1, 'confirmado'),
(19, 'Dolor en hombro',            13, CURDATE(), '09:00', 12, 2, 'confirmado'),
(20, 'Chequeo de rutina',          14, CURDATE(), '14:30', 13, 3, 'confirmado'),
(21, 'Vacuna antigripal',          15, CURDATE(), '09:30', 14, 1, 'confirmado'),
(22, 'Consulta dermatológica',     16, CURDATE(), '08:30', 15, 2, 'confirmado'),
-- Turno futuro (el paciente lo ve en "Mis turnos")
(23, 'Primera consulta',           17, CURDATE() + INTERVAL 1 DAY,  '08:30', 11, 1, 'confirmado'),
(24, 'Electrocardiograma',         18, CURDATE() + INTERVAL 1 DAY,  '14:30', 12, 2, 'confirmado');

-- =============================================================
-- HISTORIAL CLÍNICO
-- Solo para turnos atendidos
-- =============================================================

INSERT INTO historial_clinico (id, id_turno, id_medico, id_paciente, diagnostico, tratamiento, observaciones, fecha_registro) VALUES
(1,  1,  6,  11, 'Contusión leve en rodilla',           'Reposo 48hs, antiinflamatorio',              'Control en 15 días',              CURDATE() - INTERVAL 30 DAY),
(2,  2,  6,  12, 'Esguince tobillo grado I',             'Inmovilización y hielo',                     'Radiografía descartó fractura',    CURDATE() - INTERVAL 30 DAY),
(3,  3,  7,  13, 'Hipertensión arterial leve',           'Dieta baja en sodio, caminata diaria',       'Monitoreo de presión semanal',     CURDATE() - INTERVAL 30 DAY),
(4,  4,  8,  14, 'Faringitis viral',                     'Reposo, ibuprofeno 400mg',                   'Sin antibiótico necesario',        CURDATE() - INTERVAL 20 DAY),
(5,  5,  8,  15, 'Desarrollo normal para su edad',       'Sin tratamiento',                            'Próximo control en 6 meses',       CURDATE() - INTERVAL 20 DAY),
(6,  6,  9,  11, 'Lumbalgia mecánica',                   'Kinesiología 10 sesiones',                   'Evitar levantar peso',             CURDATE() - INTERVAL 20 DAY),
(7,  7,  10, 12, 'Arritmia sinusal benigna',             'Sin medicación por ahora',                   'Holter en 30 días',                CURDATE() - INTERVAL 15 DAY),
(8,  8,  6,  13, 'Fractura consolidada correctamente',   'Alta médica, fisioterapia de mantenimiento', 'Sin restricciones laborales',      CURDATE() - INTERVAL 15 DAY),
(9,  9,  9,  14, 'Dermatitis atópica leve',              'Hidratante y corticoide tópico',             'Evitar jabones agresivos',         CURDATE() - INTERVAL 10 DAY),
(10, 10, 7,  15, 'Presión arterial 140/90',              'Losartán 50mg, control en 1 mes',            'Se indica dieta hiposódica',       CURDATE() - INTERVAL 10 DAY),
(11, 11, 6,  11, 'Rinitis alérgica estacional',          'Loratadina 10mg, lavados nasales',           'Evitar exposición a polvo',        CURDATE() - INTERVAL 7 DAY),
(12, 12, 10, 12, 'Esguince de tobillo grado II',         'Inmovilización 3 semanas',                   'Radiografía de control en 10 días',CURDATE() - INTERVAL 3 DAY);

-- =============================================================
-- NOTIFICACIONES
-- =============================================================

INSERT INTO notificacion (id, id_usuario, tipo, mensaje, leida, fecha) VALUES
-- Paciente Franco Friggeri (11)
(1,  11, 'turno_confirmado', CONCAT('Tu turno del ', DATE_FORMAT(CURDATE() + INTERVAL 1 DAY, '%d/%m/%Y'), ' a las 08:30 con Dr/a Lopez fue confirmado.'),  0, NOW() - INTERVAL 1 HOUR),
(2,  11, 'turno_atendido',   CONCAT('Tu turno del ', DATE_FORMAT(CURDATE() - INTERVAL 7 DAY,  '%d/%m/%Y'), ' fue registrado como atendido.'),               1, CURDATE() - INTERVAL 7 DAY),
(3,  11, 'turno_cancelado',  CONCAT('Tu turno del ', DATE_FORMAT(CURDATE() - INTERVAL 10 DAY, '%d/%m/%Y'), ' fue cancelado.'),                              1, CURDATE() - INTERVAL 10 DAY),
-- Paciente Valentina Rodriguez (12)
(4,  12, 'turno_confirmado', CONCAT('Tu turno del ', DATE_FORMAT(CURDATE() + INTERVAL 1 DAY, '%d/%m/%Y'), ' a las 14:30 con Dr/a Ramirez fue confirmado.'), 0, NOW() - INTERVAL 30 MINUTE),
(5,  12, 'turno_atendido',   CONCAT('Tu turno del ', DATE_FORMAT(CURDATE() - INTERVAL 3 DAY,  '%d/%m/%Y'), ' fue registrado como atendido.'),               0, CURDATE() - INTERVAL 3 DAY),
-- Paciente Lucas Martinez (13)
(6,  13, 'turno_confirmado', CONCAT('Tu turno del ', DATE_FORMAT(CURDATE(), '%d/%m/%Y'), ' a las 14:30 con Dr/a Ramirez fue confirmado.'),                  0, NOW() - INTERVAL 2 HOUR),
-- Médico Ana Lopez (6)
(7,  6,  'turno_atendido',   'Registraste el turno de Franco Friggeri como atendido.',    1, CURDATE() - INTERVAL 7 DAY),
(8,  6,  'turno_atendido',   'Registraste el turno de Lucas Martínez como atendido.',     0, CURDATE() - INTERVAL 15 DAY);

-- =============================================================
-- LOG DE AUDITORÍA
-- =============================================================

INSERT INTO log_auditoria (id, id_usuario, accion, entidad, id_entidad, detalle, fecha) VALUES
-- Altas de usuarios por admin
(1,  1, 'ALTA',        'usuario',     3,  'Alta de operador Perez Juan',               NOW() - INTERVAL 60 DAY),
(2,  1, 'ALTA',        'usuario',     6,  'Alta de médico Lopez Ana',                  NOW() - INTERVAL 60 DAY),
(3,  1, 'ALTA',        'usuario',     7,  'Alta de médico Ramirez Carlos',             NOW() - INTERVAL 60 DAY),
(4,  2, 'ALTA',        'usuario',     11, 'Alta de paciente Friggeri Franco',          NOW() - INTERVAL 55 DAY),
(5,  2, 'ALTA',        'usuario',     12, 'Alta de paciente Rodriguez Valentina',      NOW() - INTERVAL 55 DAY),
-- Altas de catálogos
(6,  1, 'ALTA',        'sede',        3,  'Alta de Sede Sur',                          NOW() - INTERVAL 50 DAY),
(7,  1, 'ALTA',        'especialidad',3,  'Alta de especialidad Pediatría',            NOW() - INTERVAL 50 DAY),
(8,  1, 'ALTA',        'especialidad',5,  'Alta de especialidad Dermatología',         NOW() - INTERVAL 50 DAY),
(9,  1, 'ALTA',        'cobertura',   2,  'Alta de cobertura OSDE',                    NOW() - INTERVAL 48 DAY),
-- Turnos
(10, 3, 'ALTA',        'turno',       18, 'Turno asignado a Friggeri Franco para hoy', NOW() - INTERVAL 1 DAY),
(11, 11,'ALTA',        'turno',       23, 'Turno solicitado por paciente',             NOW() - INTERVAL 2 HOUR),
(12, 12,'ALTA',        'turno',       24, 'Turno solicitado por paciente',             NOW() - INTERVAL 1 HOUR),
(13, 3, 'BAJA',        'turno',       14, 'Cancelación de turno por operador',         NOW() - INTERVAL 30 DAY),
-- Modificación de usuario
(14, 1, 'MODIFICACION','usuario',     8,  'Actualización de teléfono de Vega Sofia',   NOW() - INTERVAL 20 DAY),
-- Atención de turnos por médicos
(15, 6, 'MODIFICACION','turno',       1,  'Turno marcado como atendido por Lopez Ana', CURDATE() - INTERVAL 30 DAY),
(16, 7, 'MODIFICACION','turno',       3,  'Turno marcado como atendido por Ramirez',   CURDATE() - INTERVAL 30 DAY);
