-- =============================================
-- Migration V4: Seguridad de autenticacion
-- Intentos fallidos, bloqueo temporal, reset de password
-- =============================================

-- 1. Campos de bloqueo por intentos fallidos
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP DEFAULT NULL;

-- 2. Campos de recuperacion de contrasena
-- Se guarda el hash del token (no el token en texto plano)
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS reset_token_hash VARCHAR(255) DEFAULT NULL;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS reset_token_expires_at TIMESTAMP DEFAULT NULL;

-- 3. Metodo de recuperacion (extensible: email, phone, etc.)
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS reset_method VARCHAR(20) DEFAULT NULL;
