USE clinica;
----------------------------
-- Todos los usuarios usan 'password123' como contraseña
----------------------------
SET @hash = '$2b$10$2m51ddasppBJl5iNKJOZCedPxtSB5rQkzePn1aJ7w.XP/Bj2pgBAO';

INSERT INTO usuario (apellido, nombre, fecha_nacimiento, password, rol, email, telefono, dni, id_sede, id_cobertura) VALUES
-- Admins
('Admin', 'Uno',  '1980-01-10', @hash, 'admin', 'admin1@clinica.com', '3424000101', '30000001', NULL, NULL),
('Admin', 'Dos',  '1981-02-11', @hash, 'admin', 'admin2@clinica.com', '3424000102', '30000002', NULL, NULL),
('Admin', 'Tres', '1982-03-12', @hash, 'admin', 'admin3@clinica.com', '3424000103', '30000003', NULL, NULL),
-- Operadores
('Operador', 'Uno',  '1990-04-10', @hash, 'operador', 'operador1@clinica.com', '3424000201', '31000001', 1, NULL),
('Operador', 'Dos',  '1991-05-11', @hash, 'operador', 'operador2@clinica.com', '3424000202', '31000002', 2, NULL),
('Operador', 'Tres', '1992-06-12', @hash, 'operador', 'operador3@clinica.com', '3424000203', '31000003', 1, NULL),
-- Médicos
('Medico', 'Uno',  '1975-07-10', @hash, 'medico', 'medico1@clinica.com', '3424000301', '32000001', 1, NULL),
('Medico', 'Dos',  '1976-08-11', @hash, 'medico', 'medico2@clinica.com', '3424000302', '32000002', 2, NULL),
('Medico', 'Tres', '1977-09-12', @hash, 'medico', 'medico3@clinica.com', '3424000303', '32000003', 1, NULL),
-- Pacientes
('Paciente', 'Uno',  '1995-10-10', @hash, 'paciente', 'paciente1@clinica.com', '3424000401', '33000001', NULL, 1),
('Paciente', 'Dos',  '1996-11-11', @hash, 'paciente', 'paciente2@clinica.com', '3424000402', '33000002', NULL, 1),
('Paciente', 'Tres', '1997-12-12', @hash, 'paciente', 'paciente3@clinica.com', '3424000403', '33000003', NULL, 1);

INSERT INTO medico_especialidad (id_medico, id_especialidad)
SELECT id, 1 FROM usuario WHERE email IN ('medico1@clinica.com','medico2@clinica.com','medico3@clinica.com');

INSERT INTO sede (nombre, direccion, telefono) VALUES
('Sede Central', 'Bv. Pellegrini 789', '3424000003');

INSERT INTO especialidad (descripcion) VALUES
('Cardiologia'),
('Pediatria');

INSERT INTO cobertura (nombre) VALUES
('OSDE'),
('Swiss Medical');