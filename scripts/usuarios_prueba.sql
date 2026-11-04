-- Script de usuarios de prueba para verificacion de endpoints
-- Contrasena de todos los usuarios: password123

USE `clinica`;

INSERT INTO `usuario` (`nombre`, `apellido`, `fecha_nacimiento`, `password`, `rol`, `email`, `telefono`, `dni`, `id_sede`, `id_cobertura`) VALUES
('Admin', 'Prueba', '2000-01-01', '$2b$10$MmWAPBdFBWciSR.MpOi0c.a1uPUMxWgY82eMKh4w22jjwrWLmrrHq', 'administrador', 'admin@clinica.com', '3410000001', '00000001', NULL, NULL),
('Medico', 'Prueba', '2000-01-01', '$2b$10$MmWAPBdFBWciSR.MpOi0c.a1uPUMxWgY82eMKh4w22jjwrWLmrrHq', 'medico', 'medico@clinica.com', '3410000002', '00000002', 1, NULL),
('Operador', 'Prueba', '2000-01-01', '$2b$10$MmWAPBdFBWciSR.MpOi0c.a1uPUMxWgY82eMKh4w22jjwrWLmrrHq', 'operador', 'operador@clinica.com', '3410000003', '00000003', 1, NULL),
('Paciente', 'Prueba', '2000-01-01', '$2b$10$MmWAPBdFBWciSR.MpOi0c.a1uPUMxWgY82eMKh4w22jjwrWLmrrHq', 'paciente', 'paciente@clinica.com', '3410000004', '00000004', NULL, 1);
