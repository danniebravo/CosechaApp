-- ============================================
-- MIGRACIÓN V3: Teléfono internacional
-- ============================================
-- El campo telefono VARCHAR(20) ya existe.
-- Solo necesitamos asegurarnos de que acepte formato "+573001234567"
-- No se requieren cambios en la tabla, el VARCHAR(20) es suficiente.
-- Esta migración es un NO-OP documental.

-- Si en el futuro necesitas separar prefijo y número:
-- ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS telefono_prefijo VARCHAR(5);
-- ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS telefono_numero VARCHAR(15);

-- Por ahora, telefono guardará el formato concatenado: "+573001234567"
-- Esto es más simple y compatible con el schema actual.
