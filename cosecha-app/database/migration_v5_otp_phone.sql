-- =============================================
-- Migration V5: OTP por celular para recuperacion
-- =============================================

-- Campos OTP en tabla usuarios (junto con los de reset por email)
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS phone_otp_hash VARCHAR(255) DEFAULT NULL;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS phone_otp_expires_at TIMESTAMP DEFAULT NULL;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS phone_otp_attempts INTEGER DEFAULT 0;
