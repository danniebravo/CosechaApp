const BaseModel = require('./BaseModel');
const { query } = require('../config/database');

class Flete extends BaseModel {
  constructor() {
    super('fletes');
  }

  async findByCosecha(cosechaId) {
    const result = await query(
      'SELECT * FROM fletes WHERE cosecha_id = $1 ORDER BY fecha DESC',
      [cosechaId]
    );
    return result.rows;
  }

  async getResumen(cosechaId) {
    const result = await query(`
      SELECT
        COUNT(*) as total_viajes,
        COALESCE(SUM(cantidad_bultos), 0) as total_bultos,
        COALESCE(SUM(cantidad_kilos), 0) as total_kilos,
        COALESCE(SUM(valor_total), 0) as total_costo
      FROM fletes
      WHERE cosecha_id = $1
    `, [cosechaId]);
    return result.rows[0];
  }
}

module.exports = new Flete();
