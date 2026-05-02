-- =============================================
-- Migration V9: Verificación de email al registrarse
-- OTP de 6 dígitos por correo + cooldown anti-abuso
-- =============================================

-- 1. Campo de verificación
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;

-- 2. OTP de email (mismo patrón que phone_otp)
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS email_otp_hash VARCHAR(255) DEFAULT NULL;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS email_otp_expires_at TIMESTAMP DEFAULT NULL;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS email_otp_attempts INTEGER DEFAULT 0;

-- 3. Cooldown / anti-abuso de reenvío de OTP por email
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS email_otp_last_sent_at TIMESTAMP DEFAULT NULL;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS email_otp_send_count INTEGER DEFAULT 0;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS email_otp_window_started_at TIMESTAMP DEFAULT NULL;

-- 4. Usuarios existentes se marcan como verificados (ya estaban activos)
UPDATE usuarios SET email_verified = true WHERE email_verified IS NULL OR email_verified = false;

-- 5. Usuarios creados vía Google ya están verificados por defecto
-- (Google ya verificó su email)
