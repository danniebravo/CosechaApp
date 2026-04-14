-- =============================================
-- Migration V2: Coordenadas + Sistema de Alertas
-- =============================================

-- 1. Agregar coordenadas a fincas
ALTER TABLE fincas ADD COLUMN IF NOT EXISTS latitud DECIMAL(10, 7);
ALTER TABLE fincas ADD COLUMN IF NOT EXISTS longitud DECIMAL(10, 7);

-- 2. Agregar coordenadas a lotes
ALTER TABLE lotes ADD COLUMN IF NOT EXISTS latitud DECIMAL(10, 7);
ALTER TABLE lotes ADD COLUMN IF NOT EXISTS longitud DECIMAL(10, 7);

-- 3. Crear tipos ENUM para alertas
DO $$ BEGIN
  CREATE TYPE tipo_alerta AS ENUM ('fertilizacion', 'fumigacion', 'riego', 'cosecha_estimada', 'general');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE estado_alerta AS ENUM ('pendiente', 'completada', 'descartada');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 4. Crear tabla de alertas
CREATE TABLE IF NOT EXISTS alertas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cosecha_id UUID NOT NULL REFERENCES cosechas(id) ON DELETE CASCADE,
    tipo tipo_alerta NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT,
    fecha_programada DATE NOT NULL,
    estado estado_alerta DEFAULT 'pendiente',
    created_at TIMESTAMP DEFAULT NOW()
);

-- 5. Indices para alertas
CREATE INDEX IF NOT EXISTS idx_alertas_cosecha ON alertas(cosecha_id);
CREATE INDEX IF NOT EXISTS idx_alertas_estado ON alertas(estado);
CREATE INDEX IF NOT EXISTS idx_alertas_fecha ON alertas(fecha_programada);
CREATE INDEX IF NOT EXISTS idx_alertas_cosecha_estado ON alertas(cosecha_id, estado);
