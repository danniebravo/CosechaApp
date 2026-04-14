-- ============================================
-- COSECHA APP - Datos de prueba
-- ============================================

-- Usuario demo (password: cosecha123)
INSERT INTO usuarios (id, nombre, email, password_hash, telefono, rol) VALUES
('a1b2c3d4-e5f6-7890-abcd-ef1234567890',
 'Carlos Rodríguez',
 'carlos@demo.com',
 '$2b$10$YourHashedPasswordHere',
 '3101234567',
 'admin');

-- Finca demo
INSERT INTO fincas (id, usuario_id, nombre, ubicacion, municipio, departamento, area_total, altitud) VALUES
('f1a2b3c4-d5e6-7890-abcd-ef1234567890',
 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
 'Finca El Progreso',
 'Vereda La Esperanza',
 'Ventaquemada',
 'Boyacá',
 12.5,
 2800);

-- Lotes demo
INSERT INTO lotes (id, finca_id, nombre, area, tipo_suelo, altitud) VALUES
('l1a2b3c4-d5e6-7890-abcd-ef1234567890',
 'f1a2b3c4-d5e6-7890-abcd-ef1234567890',
 'Lote Norte', 3.5, 'Franco arcilloso', 2850),
('l2a2b3c4-d5e6-7890-abcd-ef1234567890',
 'f1a2b3c4-d5e6-7890-abcd-ef1234567890',
 'Lote Sur', 4.0, 'Franco arenoso', 2780);

-- Cosecha demo
INSERT INTO cosechas (id, lote_id, variedad_papa, fecha_siembra, fecha_cosecha_estimada, estado, area_sembrada, cantidad_semilla) VALUES
('c1a2b3c4-d5e6-7890-abcd-ef1234567890',
 'l1a2b3c4-d5e6-7890-abcd-ef1234567890',
 'Pastusa Suprema',
 '2025-01-15',
 '2025-07-15',
 'en_progreso',
 3.0,
 1500);
