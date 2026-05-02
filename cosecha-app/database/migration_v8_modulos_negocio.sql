-- =============================================
-- Migration V8: Modulos de Negocio Completos
-- Trabajadores, Insumos, Empaques, Fletes, Amedieros
-- + Bugfixes: soft-delete en queries, recalcular_cosecha
-- =============================================

-- ============================================
-- 1. NUEVOS ENUMS
-- ============================================

DO $$ BEGIN
  CREATE TYPE modalidad_pago AS ENUM ('dia', 'hora', 'bulto');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE unidad_registro AS ENUM ('kilos', 'bultos');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE fase_gasto AS ENUM ('pre_siembra', 'siembra', 'desarrollo', 'cosecha', 'post_cosecha');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE tipo_insumo AS ENUM ('semilla', 'abono', 'insecticida', 'fungicida', 'herbicida', 'desinfectante', 'fertilizante', 'otro');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE tipo_empaque AS ENUM ('saco', 'cabulla', 'bolsa_plastica', 'otro');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE tipo_proceso AS ENUM ('melgar', 'arada', 'surcada', 'desinfeccion', 'tapada', 'aporque', 'otro');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- 2. MODIFICAR TABLA COSECHAS
-- Agregar config de unidades, modalidad y duración
-- ============================================

ALTER TABLE cosechas ADD COLUMN IF NOT EXISTS unidad_registro unidad_registro DEFAULT 'bultos';
ALTER TABLE cosechas ADD COLUMN IF NOT EXISTS modalidad_pago modalidad_pago DEFAULT 'dia';
ALTER TABLE cosechas ADD COLUMN IF NOT EXISTS valor_bulto DECIMAL(12,2) DEFAULT NULL;
ALTER TABLE cosechas ADD COLUMN IF NOT EXISTS duracion_estimada_dias INTEGER DEFAULT 210;
ALTER TABLE cosechas ADD COLUMN IF NOT EXISTS costo_trabajadores DECIMAL(14,2) DEFAULT 0;
ALTER TABLE cosechas ADD COLUMN IF NOT EXISTS costo_insumos DECIMAL(14,2) DEFAULT 0;
ALTER TABLE cosechas ADD COLUMN IF NOT EXISTS costo_empaques DECIMAL(14,2) DEFAULT 0;
ALTER TABLE cosechas ADD COLUMN IF NOT EXISTS costo_fletes DECIMAL(14,2) DEFAULT 0;
ALTER TABLE cosechas ADD COLUMN IF NOT EXISTS costo_procesos DECIMAL(14,2) DEFAULT 0;
ALTER TABLE cosechas ADD COLUMN IF NOT EXISTS inversion_total DECIMAL(14,2) DEFAULT 0;
ALTER TABLE cosechas ADD COLUMN IF NOT EXISTS utilidad_bruta DECIMAL(14,2) DEFAULT 0;
ALTER TABLE cosechas ADD COLUMN IF NOT EXISTS utilidad_neta DECIMAL(14,2) DEFAULT 0;

-- ============================================
-- 3. TABLA: trabajadores (maestro de personas)
-- Un trabajador puede participar en multiples cosechas
-- ============================================

CREATE TABLE IF NOT EXISTS trabajadores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    nombre VARCHAR(150) NOT NULL,
    telefono VARCHAR(20),
    documento VARCHAR(30),
    notas TEXT,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trabajadores_usuario ON trabajadores(usuario_id);

-- ============================================
-- 4. TABLA: cosecha_trabajadores (asignacion)
-- Qué trabajadores participan en cada cosecha
-- ============================================

CREATE TABLE IF NOT EXISTS cosecha_trabajadores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cosecha_id UUID NOT NULL REFERENCES cosechas(id) ON DELETE CASCADE,
    trabajador_id UUID NOT NULL REFERENCES trabajadores(id) ON DELETE CASCADE,
    valor_dia DECIMAL(12,2) DEFAULT 0,
    valor_hora DECIMAL(12,2) DEFAULT 0,
    valor_bulto DECIMAL(12,2) DEFAULT 0,
    modalidad modalidad_pago DEFAULT 'dia',
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(cosecha_id, trabajador_id)
);

CREATE INDEX IF NOT EXISTS idx_cosecha_trabajadores_cosecha ON cosecha_trabajadores(cosecha_id);
CREATE INDEX IF NOT EXISTS idx_cosecha_trabajadores_trabajador ON cosecha_trabajadores(trabajador_id);

-- ============================================
-- 5. TABLA: jornadas_trabajo
-- Registro diario de cada trabajador
-- ============================================

CREATE TABLE IF NOT EXISTS jornadas_trabajo (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cosecha_id UUID NOT NULL REFERENCES cosechas(id) ON DELETE CASCADE,
    trabajador_id UUID NOT NULL REFERENCES trabajadores(id) ON DELETE CASCADE,
    fecha DATE NOT NULL,
    horas_trabajadas DECIMAL(4,1) DEFAULT 0,
    bultos_cosechados DECIMAL(10,2) DEFAULT 0,
    valor_dia DECIMAL(12,2) DEFAULT 0,
    valor_comida DECIMAL(12,2) DEFAULT 0,
    subtotal_pago DECIMAL(12,2) DEFAULT 0,
    notas TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_jornadas_cosecha ON jornadas_trabajo(cosecha_id);
CREATE INDEX IF NOT EXISTS idx_jornadas_trabajador ON jornadas_trabajo(trabajador_id);
CREATE INDEX IF NOT EXISTS idx_jornadas_fecha ON jornadas_trabajo(fecha);

-- ============================================
-- 6. TABLA: insumos_cosecha
-- Semilla, abono, insecticidas, desinfectantes, etc.
-- ============================================

CREATE TABLE IF NOT EXISTS insumos_cosecha (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cosecha_id UUID NOT NULL REFERENCES cosechas(id) ON DELETE CASCADE,
    tipo tipo_insumo NOT NULL,
    nombre VARCHAR(200) NOT NULL,
    marca VARCHAR(150),
    cantidad DECIMAL(10,2) NOT NULL,
    unidad VARCHAR(50) NOT NULL,
    valor_unitario DECIMAL(12,2) NOT NULL,
    valor_total DECIMAL(14,2) NOT NULL,
    fecha DATE NOT NULL,
    fase fase_gasto DEFAULT 'siembra',
    proveedor VARCHAR(150),
    notas TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_insumos_cosecha ON insumos_cosecha(cosecha_id);
CREATE INDEX IF NOT EXISTS idx_insumos_tipo ON insumos_cosecha(tipo);
CREATE INDEX IF NOT EXISTS idx_insumos_fase ON insumos_cosecha(fase);

-- ============================================
-- 7. TABLA: empaques
-- Sacos, cabulla, bolsas plasticas, etc.
-- ============================================

CREATE TABLE IF NOT EXISTS empaques (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cosecha_id UUID NOT NULL REFERENCES cosechas(id) ON DELETE CASCADE,
    tipo tipo_empaque NOT NULL,
    descripcion VARCHAR(200) NOT NULL,
    cantidad INTEGER NOT NULL,
    valor_unitario DECIMAL(12,2) NOT NULL,
    valor_total DECIMAL(14,2) NOT NULL,
    fecha DATE NOT NULL,
    notas TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_empaques_cosecha ON empaques(cosecha_id);

-- ============================================
-- 8. TABLA: fletes
-- Transporte de papa, costo por bulto/kilo/viaje
-- ============================================

CREATE TABLE IF NOT EXISTS fletes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cosecha_id UUID NOT NULL REFERENCES cosechas(id) ON DELETE CASCADE,
    fecha DATE NOT NULL,
    descripcion VARCHAR(200),
    origen VARCHAR(200),
    destino VARCHAR(200),
    cantidad_bultos DECIMAL(10,2) DEFAULT 0,
    cantidad_kilos DECIMAL(12,2) DEFAULT 0,
    valor_por_bulto DECIMAL(12,2) DEFAULT 0,
    valor_total DECIMAL(14,2) NOT NULL,
    transportista VARCHAR(150),
    vehiculo VARCHAR(100),
    notas TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fletes_cosecha ON fletes(cosecha_id);
CREATE INDEX IF NOT EXISTS idx_fletes_fecha ON fletes(fecha);

-- ============================================
-- 9. TABLA: procesos_cultivo
-- Melgar, arada, surcada, desinfeccion, aporque, etc.
-- ============================================

CREATE TABLE IF NOT EXISTS procesos_cultivo (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cosecha_id UUID NOT NULL REFERENCES cosechas(id) ON DELETE CASCADE,
    tipo tipo_proceso NOT NULL,
    fecha DATE NOT NULL,
    descripcion TEXT,
    duracion_horas DECIMAL(5,1),
    costo DECIMAL(14,2) NOT NULL DEFAULT 0,
    responsable VARCHAR(150),
    maquinaria_usada VARCHAR(200),
    notas TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_procesos_cosecha ON procesos_cultivo(cosecha_id);
CREATE INDEX IF NOT EXISTS idx_procesos_tipo ON procesos_cultivo(tipo);

-- ============================================
-- 10. TABLA: amedieros (socios de la cosecha)
-- Distribución de inversión y ganancias
-- ============================================

CREATE TABLE IF NOT EXISTS amedieros (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cosecha_id UUID NOT NULL REFERENCES cosechas(id) ON DELETE CASCADE,
    nombre VARCHAR(150) NOT NULL,
    telefono VARCHAR(20),
    porcentaje_inversion DECIMAL(5,2) NOT NULL DEFAULT 0,
    porcentaje_ganancia DECIMAL(5,2) NOT NULL DEFAULT 0,
    descripcion_aporte TEXT,
    monto_invertido DECIMAL(14,2) DEFAULT 0,
    ganancia_calculada DECIMAL(14,2) DEFAULT 0,
    notas TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_amedieros_cosecha ON amedieros(cosecha_id);

-- ============================================
-- 11. TRIGGERS para updated_at en nuevas tablas
-- ============================================

CREATE TRIGGER trg_trabajadores_updated BEFORE UPDATE ON trabajadores
FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();

CREATE TRIGGER trg_amedieros_updated BEFORE UPDATE ON amedieros
FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();

-- ============================================
-- 12. BUGFIX: Actualizar funcion recalcular_cosecha
-- Ahora incluye trabajadores, insumos, empaques,
-- fletes y procesos de cultivo
-- ============================================

CREATE OR REPLACE FUNCTION recalcular_cosecha(p_cosecha_id UUID)
RETURNS VOID AS $$
DECLARE
    v_costo_actividades DECIMAL(14,2);
    v_costo_gastos DECIMAL(14,2);
    v_costo_trabajadores DECIMAL(14,2);
    v_costo_insumos DECIMAL(14,2);
    v_costo_empaques DECIMAL(14,2);
    v_costo_fletes DECIMAL(14,2);
    v_costo_procesos DECIMAL(14,2);
    v_ingreso_ventas DECIMAL(14,2);
    v_inversion_total DECIMAL(14,2);
BEGIN
    SELECT COALESCE(SUM(costo), 0) INTO v_costo_actividades
    FROM actividades WHERE cosecha_id = p_cosecha_id;

    SELECT COALESCE(SUM(valor_total), 0) INTO v_costo_gastos
    FROM gastos WHERE cosecha_id = p_cosecha_id;

    -- Trabajadores: jornadas (pago + comida)
    SELECT COALESCE(SUM(subtotal_pago + valor_comida), 0) INTO v_costo_trabajadores
    FROM jornadas_trabajo WHERE cosecha_id = p_cosecha_id;

    SELECT COALESCE(SUM(valor_total), 0) INTO v_costo_insumos
    FROM insumos_cosecha WHERE cosecha_id = p_cosecha_id;

    SELECT COALESCE(SUM(valor_total), 0) INTO v_costo_empaques
    FROM empaques WHERE cosecha_id = p_cosecha_id;

    SELECT COALESCE(SUM(valor_total), 0) INTO v_costo_fletes
    FROM fletes WHERE cosecha_id = p_cosecha_id;

    SELECT COALESCE(SUM(costo), 0) INTO v_costo_procesos
    FROM procesos_cultivo WHERE cosecha_id = p_cosecha_id;

    SELECT COALESCE(SUM(valor_total), 0) INTO v_ingreso_ventas
    FROM ventas WHERE cosecha_id = p_cosecha_id;

    v_inversion_total := v_costo_actividades + v_costo_gastos + v_costo_trabajadores
                       + v_costo_insumos + v_costo_empaques + v_costo_fletes + v_costo_procesos;

    UPDATE cosechas SET
        costo_total = v_inversion_total,
        costo_trabajadores = v_costo_trabajadores,
        costo_insumos = v_costo_insumos,
        costo_empaques = v_costo_empaques,
        costo_fletes = v_costo_fletes,
        costo_procesos = v_costo_procesos,
        ingreso_total = v_ingreso_ventas,
        inversion_total = v_inversion_total,
        utilidad_bruta = v_ingreso_ventas - v_inversion_total,
        utilidad_neta = v_ingreso_ventas - v_inversion_total,
        produccion_total = produccion_primera + produccion_segunda + produccion_tercera + produccion_descarte
    WHERE id = p_cosecha_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 13. BUGFIX: Vista resumen con filtro soft-delete
-- ============================================

DROP VIEW IF EXISTS v_resumen_cosechas;
CREATE OR REPLACE VIEW v_resumen_cosechas AS
SELECT
    c.id,
    c.variedad_papa,
    c.estado,
    c.fecha_siembra,
    c.fecha_cosecha_estimada,
    c.fecha_cosecha_real,
    c.area_sembrada,
    c.unidad_registro,
    c.modalidad_pago,
    c.produccion_total,
    c.produccion_primera,
    c.produccion_segunda,
    c.produccion_tercera,
    c.produccion_descarte,
    c.perdidas,
    c.costo_total,
    c.costo_trabajadores,
    c.costo_insumos,
    c.costo_empaques,
    c.costo_fletes,
    c.costo_procesos,
    c.ingreso_total,
    c.inversion_total,
    (c.ingreso_total - c.costo_total) AS utilidad_neta,
    CASE WHEN c.ingreso_total > 0
        THEN ROUND(((c.ingreso_total - c.costo_total) / c.ingreso_total) * 100, 2)
        ELSE 0
    END AS margen_porcentaje,
    CASE WHEN c.produccion_total > 0
        THEN ROUND(c.costo_total / c.produccion_total, 2)
        ELSE 0
    END AS costo_por_kg,
    CASE WHEN c.area_sembrada > 0
        THEN ROUND(c.produccion_total / c.area_sembrada, 2)
        ELSE 0
    END AS rendimiento_por_ha,
    CASE WHEN c.costo_total > 0
        THEN ROUND(((c.ingreso_total - c.costo_total) / c.costo_total) * 100, 2)
        ELSE 0
    END AS roi_porcentaje,
    l.nombre AS lote_nombre,
    f.nombre AS finca_nombre,
    f.departamento AS finca_departamento,
    f.municipio AS finca_municipio,
    u.id AS usuario_id
FROM cosechas c
JOIN lotes l ON c.lote_id = l.id AND l.activo = true
JOIN fincas f ON l.finca_id = f.id AND f.activa = true
JOIN usuarios u ON f.usuario_id = u.id AND u.activo = true;

-- ============================================
-- 14. FUNCIÓN: Recalcular ganancias de amedieros
-- ============================================

CREATE OR REPLACE FUNCTION recalcular_amedieros(p_cosecha_id UUID)
RETURNS VOID AS $$
DECLARE
    v_utilidad DECIMAL(14,2);
    v_inversion DECIMAL(14,2);
BEGIN
    SELECT
        (ingreso_total - costo_total),
        inversion_total
    INTO v_utilidad, v_inversion
    FROM cosechas WHERE id = p_cosecha_id;

    UPDATE amedieros SET
        ganancia_calculada = CASE
            WHEN v_utilidad > 0
            THEN ROUND(v_utilidad * (porcentaje_ganancia / 100), 2)
            ELSE ROUND(v_utilidad * (porcentaje_ganancia / 100), 2)
        END,
        monto_invertido = ROUND(v_inversion * (porcentaje_inversion / 100), 2)
    WHERE cosecha_id = p_cosecha_id;
END;
$$ LANGUAGE plpgsql;
