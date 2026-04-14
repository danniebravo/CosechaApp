-- ============================================
-- COSECHA APP - Schema PostgreSQL
-- Sistema de Gestión de Cosechas de Papa
-- ============================================

-- Extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- TIPOS ENUM
-- ============================================
CREATE TYPE estado_cosecha AS ENUM ('planificada', 'en_progreso', 'cosechada', 'vendida', 'finalizada');
CREATE TYPE tipo_actividad AS ENUM ('siembra', 'fertilizacion', 'fumigacion', 'riego', 'cosecha', 'otro');
CREATE TYPE tipo_gasto AS ENUM ('insumos', 'mano_de_obra', 'transporte', 'maquinaria', 'arriendo', 'otro');
CREATE TYPE calidad_producto AS ENUM ('primera', 'segunda', 'tercera', 'descarte');
CREATE TYPE unidad_medida AS ENUM ('kg', 'bulto', 'tonelada', 'litro', 'unidad', 'jornal', 'hectarea');
CREATE TYPE rol_usuario AS ENUM ('admin', 'agricultor', 'operario');

-- ============================================
-- TABLA: usuarios
-- ============================================
CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    telefono VARCHAR(20),
    rol rol_usuario DEFAULT 'agricultor',
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- TABLA: fincas
-- ============================================
CREATE TABLE fincas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    nombre VARCHAR(100) NOT NULL,
    ubicacion VARCHAR(200),
    municipio VARCHAR(100),
    departamento VARCHAR(100),
    area_total DECIMAL(10,2), -- en hectáreas
    altitud INTEGER, -- msnm
    latitud DECIMAL(10,7),
    longitud DECIMAL(10,7),
    notas TEXT,
    activa BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- TABLA: lotes
-- ============================================
CREATE TABLE lotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    finca_id UUID NOT NULL REFERENCES fincas(id) ON DELETE CASCADE,
    nombre VARCHAR(100) NOT NULL,
    area DECIMAL(10,2), -- en hectáreas
    tipo_suelo VARCHAR(100),
    altitud INTEGER,
    latitud DECIMAL(10,7),
    longitud DECIMAL(10,7),
    notas TEXT,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- TABLA: cosechas
-- ============================================
CREATE TABLE cosechas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lote_id UUID NOT NULL REFERENCES lotes(id) ON DELETE CASCADE,
    variedad_papa VARCHAR(100) NOT NULL,
    fecha_siembra DATE NOT NULL,
    fecha_cosecha_estimada DATE,
    fecha_cosecha_real DATE,
    estado estado_cosecha DEFAULT 'planificada',
    area_sembrada DECIMAL(10,2), -- hectáreas
    cantidad_semilla DECIMAL(10,2), -- kg
    produccion_total DECIMAL(12,2) DEFAULT 0, -- kg
    produccion_primera DECIMAL(12,2) DEFAULT 0,
    produccion_segunda DECIMAL(12,2) DEFAULT 0,
    produccion_tercera DECIMAL(12,2) DEFAULT 0,
    produccion_descarte DECIMAL(12,2) DEFAULT 0,
    perdidas DECIMAL(12,2) DEFAULT 0, -- kg
    costo_total DECIMAL(14,2) DEFAULT 0,
    ingreso_total DECIMAL(14,2) DEFAULT 0,
    notas TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- TABLA: actividades
-- ============================================
CREATE TABLE actividades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cosecha_id UUID NOT NULL REFERENCES cosechas(id) ON DELETE CASCADE,
    tipo tipo_actividad NOT NULL,
    fecha DATE NOT NULL,
    descripcion TEXT,
    producto_usado VARCHAR(200),
    cantidad_producto DECIMAL(10,2),
    unidad unidad_medida,
    costo DECIMAL(12,2) DEFAULT 0,
    responsable VARCHAR(100),
    notas TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- TABLA: gastos
-- ============================================
CREATE TABLE gastos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cosecha_id UUID NOT NULL REFERENCES cosechas(id) ON DELETE CASCADE,
    tipo tipo_gasto NOT NULL,
    concepto VARCHAR(200) NOT NULL,
    cantidad DECIMAL(10,2) DEFAULT 1,
    valor_unitario DECIMAL(12,2) NOT NULL,
    valor_total DECIMAL(14,2) NOT NULL,
    fecha DATE NOT NULL,
    proveedor VARCHAR(150),
    factura VARCHAR(50),
    notas TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- TABLA: ventas
-- ============================================
CREATE TABLE ventas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cosecha_id UUID NOT NULL REFERENCES cosechas(id) ON DELETE CASCADE,
    fecha DATE NOT NULL,
    cliente VARCHAR(150) NOT NULL,
    calidad calidad_producto NOT NULL,
    cantidad_kg DECIMAL(12,2) NOT NULL,
    precio_por_kg DECIMAL(10,2) NOT NULL,
    valor_total DECIMAL(14,2) NOT NULL,
    forma_pago VARCHAR(50) DEFAULT 'efectivo',
    factura VARCHAR(50),
    notas TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- TIPOS Y TABLA: alertas
-- ============================================
CREATE TYPE tipo_alerta AS ENUM ('fertilizacion', 'fumigacion', 'riego', 'cosecha_estimada', 'general');
CREATE TYPE estado_alerta AS ENUM ('pendiente', 'completada', 'descartada');

CREATE TABLE alertas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cosecha_id UUID NOT NULL REFERENCES cosechas(id) ON DELETE CASCADE,
    tipo tipo_alerta NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT,
    fecha_programada DATE NOT NULL,
    estado estado_alerta DEFAULT 'pendiente',
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- ÍNDICES
-- ============================================
CREATE INDEX idx_fincas_usuario ON fincas(usuario_id);
CREATE INDEX idx_lotes_finca ON lotes(finca_id);
CREATE INDEX idx_cosechas_lote ON cosechas(lote_id);
CREATE INDEX idx_cosechas_estado ON cosechas(estado);
CREATE INDEX idx_cosechas_fecha ON cosechas(fecha_siembra);
CREATE INDEX idx_actividades_cosecha ON actividades(cosecha_id);
CREATE INDEX idx_actividades_tipo ON actividades(tipo);
CREATE INDEX idx_gastos_cosecha ON gastos(cosecha_id);
CREATE INDEX idx_gastos_tipo ON gastos(tipo);
CREATE INDEX idx_ventas_cosecha ON ventas(cosecha_id);
CREATE INDEX idx_ventas_fecha ON ventas(fecha);
CREATE INDEX idx_alertas_cosecha ON alertas(cosecha_id);
CREATE INDEX idx_alertas_estado ON alertas(estado);
CREATE INDEX idx_alertas_fecha ON alertas(fecha_programada);

-- ============================================
-- FUNCIÓN: Actualizar updated_at
-- ============================================
CREATE OR REPLACE FUNCTION actualizar_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER trg_usuarios_updated BEFORE UPDATE ON usuarios FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();
CREATE TRIGGER trg_fincas_updated BEFORE UPDATE ON fincas FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();
CREATE TRIGGER trg_lotes_updated BEFORE UPDATE ON lotes FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();
CREATE TRIGGER trg_cosechas_updated BEFORE UPDATE ON cosechas FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();

-- ============================================
-- FUNCIÓN: Recalcular totales de cosecha
-- ============================================
CREATE OR REPLACE FUNCTION recalcular_cosecha(p_cosecha_id UUID)
RETURNS VOID AS $$
DECLARE
    v_costo_actividades DECIMAL(14,2);
    v_costo_gastos DECIMAL(14,2);
    v_ingreso_ventas DECIMAL(14,2);
    v_produccion DECIMAL(12,2);
BEGIN
    SELECT COALESCE(SUM(costo), 0) INTO v_costo_actividades
    FROM actividades WHERE cosecha_id = p_cosecha_id;

    SELECT COALESCE(SUM(valor_total), 0) INTO v_costo_gastos
    FROM gastos WHERE cosecha_id = p_cosecha_id;

    SELECT COALESCE(SUM(valor_total), 0) INTO v_ingreso_ventas
    FROM ventas WHERE cosecha_id = p_cosecha_id;

    UPDATE cosechas SET
        costo_total = v_costo_actividades + v_costo_gastos,
        ingreso_total = v_ingreso_ventas,
        produccion_total = produccion_primera + produccion_segunda + produccion_tercera + produccion_descarte
    WHERE id = p_cosecha_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- VISTA: Resumen de cosechas
-- ============================================
CREATE OR REPLACE VIEW v_resumen_cosechas AS
SELECT
    c.id,
    c.variedad_papa,
    c.estado,
    c.fecha_siembra,
    c.fecha_cosecha_real,
    c.area_sembrada,
    c.produccion_total,
    c.perdidas,
    c.costo_total,
    c.ingreso_total,
    (c.ingreso_total - c.costo_total) AS utilidad_neta,
    CASE WHEN c.produccion_total > 0
        THEN ROUND(c.costo_total / c.produccion_total, 2)
        ELSE 0
    END AS costo_por_kg,
    CASE WHEN c.area_sembrada > 0
        THEN ROUND(c.produccion_total / c.area_sembrada, 2)
        ELSE 0
    END AS rendimiento_por_ha,
    l.nombre AS lote_nombre,
    f.nombre AS finca_nombre,
    u.id AS usuario_id
FROM cosechas c
JOIN lotes l ON c.lote_id = l.id
JOIN fincas f ON l.finca_id = f.id
JOIN usuarios u ON f.usuario_id = u.id;
