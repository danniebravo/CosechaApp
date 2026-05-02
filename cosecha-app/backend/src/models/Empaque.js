const BaseModel = require('./BaseModel');
const { query } = require('../config/database');

class Empaque extends BaseModel {
  constructor() {
    super('empaques');
  }

  async findByCosecha(cosechaId) {
    const result = await query(
      'SELECT * FROM empaques WHERE cosecha_id = $1 ORDER BY fecha DESC',
      [cosechaId]
    );
    return result.rows;
  }

  async getResumenPorTipo(cosechaId) {
    const result = await query(`
      SELECT
        tipo,
        SUM(cantidad) as total_unidades,
        COALESCE(SUM(valor_total), 0) as total
      FROM empaques
      WHERE cosecha_id = $1
      GROUP BY tipo
      ORDER BY total DESC
    `, [cosechaId]);
    return result.rows;
  }
}

module.exports = new Empaque();
