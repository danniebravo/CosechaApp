-- =============================================
-- Migration V7: Cooldown de reenvio (OTP/email)
-- =============================================
-- Permite controlar:
--   1) Tiempo minimo entre envios consecutivos (cooldown)
--   2) Cantidad maxima de envios por ventana de tiempo (anti-abuso)

-- ── OTP por telefono (compartido por sendLoginOtp + forgotByPhone) ──
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS phone_otp_last_sent_at TIMESTAMP DEFAULT NULL;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS phone_otp_send_count INTEGER DEFAULT 0;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS phone_otp_window_started_at TIMESTAMP DEFAULT NULL;

-- ── Enlace de recuperacion por email ──
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS reset_email_last_sent_at TIMESTAMP DEFAULT NULL;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS reset_email_send_count INTEGER DEFAULT 0;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS reset_email_window_started_at TIMESTAMP DEFAULT NULL;
