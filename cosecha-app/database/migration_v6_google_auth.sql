-- =============================================
-- Migration V6: Google auth + auth_provider
-- =============================================

-- Identificador de Google (sub claim del ID token)
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE DEFAULT NULL;

-- Proveedor de autenticacion: 'local', 'google', 'phone'
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(20) DEFAULT 'local';

-- Indice para busqueda rapida por google_id
CREATE INDEX IF NOT EXISTS idx_usuarios_google_id ON usuarios(google_id) WHERE google_id IS NOT NULL;

-- Las cuentas de Google no tienen password local: permitir NULL
ALTER TABLE usuarios ALTER COLUMN password_hash DROP NOT NULL;
