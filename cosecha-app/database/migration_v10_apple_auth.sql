-- =============================================
-- Migration V10: Apple Sign-In
-- =============================================

-- 1. Campo para Apple ID (sub del identity token)
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS apple_id VARCHAR(255) UNIQUE DEFAULT NULL;

-- 2. Indice para busquedas rapidas
CREATE INDEX IF NOT EXISTS idx_usuarios_apple_id ON usuarios(apple_id) WHERE apple_id IS NOT NULL;

-- 3. Actualizar auth_provider para soportar 'apple'
-- (VARCHAR(20) ya soporta el valor, no necesita ALTER)
