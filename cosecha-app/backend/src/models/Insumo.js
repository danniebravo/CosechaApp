const BaseModel = require('./BaseModel');
const { query } = require('../config/database');

class Insumo extends BaseModel {
  constructor() {
    super('insumos_cosecha');
  }

  async findByCosecha(cosechaId) {
    const result = await query(
      'SELECT * FROM insumos_cosecha WHERE cosecha_id = $1 ORDER BY fecha DESC',
      [cosechaId]
    );
    return result.rows;
  }

  async getResumenPorTipo(cosechaId) {
    const result = await query(`
      SELECT
        tipo,
        COUNT(*) as cantidad_registros,
        COALESCE(SUM(valor_total), 0) as total
      FROM insumos_cosecha
      WHERE cosecha_id = $1
      GROUP BY tipo
      ORDER BY total DESC
    `, [cosechaId]);
    return result.rows;
  }

  async getResumenPorFase(cosechaId) {
    const result = await query(`
      SELECT
        fase,
        COUNT(*) as cantidad_registros,
        COALESCE(SUM(valor_total), 0) as total
      FROM insumos_cosecha
      WHERE cosecha_id = $1
      GROUP BY fase
      ORDER BY total DESC
    `, [cosechaId]);
    return result.rows;
  }
}

module.exports = new Insumo();
