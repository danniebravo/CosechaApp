const BaseModel = require('./BaseModel');
const { query } = require('../config/database');

class Cosecha extends BaseModel {
  constructor() {
    super('cosechas');
  }

  async findByLote(loteId) {
    const result = await query(
      'SELECT * FROM cosechas WHERE lote_id = $1 ORDER BY fecha_siembra DESC',
      [loteId]
    );
    return result.rows;
  }

  async findByUsuario(usuarioId) {
    const result = await query(`
      SELECT c.*, l.nombre as lote_nombre, f.nombre as finca_nombre
      FROM cosechas c
      JOIN lotes l ON c.lote_id = l.id
      JOIN fincas f ON l.finca_id = f.id
      WHERE f.usuario_id = $1
      ORDER BY c.fecha_siembra DESC
    `, [usuarioId]);
    return result.rows;
  }

  async findByIdCompleto(id) {
    const cosecha = await this.findById(id);
    if (!cosecha) return null;

    const [actividades, gastos, ventas, lote] = await Promise.all([
      query('SELECT * FROM actividades WHERE cosecha_id = $1 ORDER BY fecha DESC', [id]),
      query('SELECT * FROM gastos WHERE cosecha_id = $1 ORDER BY fecha DESC', [id]),
      query('SELECT * FROM ventas WHERE cosecha_id = $1 ORDER BY fecha DESC', [id]),
      query('SELECT l.*, f.nombre as finca_nombre FROM lotes l JOIN fincas f ON l.finca_id = f.id WHERE l.id = $1', [cosecha.lote_id]),
    ]);

    return {
      ...cosecha,
      lote: lote.rows[0],
      actividades: actividades.rows,
      gastos: gastos.rows,
      ventas: ventas.rows,
    };
  }

  async recalcularTotales(id) {
    await query('SELECT recalcular_cosecha($1)', [id]);
    return this.findById(id);
  }

  async getResumen(usuarioId) {
    const result = await query(`
      SELECT * FROM v_resumen_cosechas WHERE usuario_id = $1
      ORDER BY fecha_siembra DESC
    `, [usuarioId]);
    return result.rows;
  }

  async getEstadisticas(usuarioId) {
    const result = await query(`
      SELECT
        COUNT(*) as total_cosechas,
        COALESCE(SUM(produccion_total), 0) as total_produccion,
        COALESCE(SUM(costo_total), 0) as total_costos,
        COALESCE(SUM(ingreso_total), 0) as total_ingresos,
        COALESCE(SUM(ingreso_total - costo_total), 0) as total_utilidad,
        COALESCE(AVG(CASE WHEN produccion_total > 0 THEN costo_total / produccion_total END), 0) as costo_promedio_kg,
        COALESCE(SUM(perdidas), 0) as total_perdidas
      FROM cosechas c
      JOIN lotes l ON c.lote_id = l.id
      JOIN fincas f ON l.finca_id = f.id
      WHERE f.usuario_id = $1
    `, [usuarioId]);
    return result.rows[0];
  }
}

module.exports = new Cosecha();
