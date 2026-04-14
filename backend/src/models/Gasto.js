const BaseModel = require('./BaseModel');
const { query } = require('../config/database');

class Gasto extends BaseModel {
  constructor() {
    super('gastos');
  }

  async findByCosecha(cosechaId) {
    const result = await query(
      'SELECT * FROM gastos WHERE cosecha_id = $1 ORDER BY fecha DESC',
      [cosechaId]
    );
    return result.rows;
  }

  async getResumenPorTipo(cosechaId) {
    const result = await query(`
      SELECT tipo, COUNT(*) as cantidad, COALESCE(SUM(valor_total), 0) as total
      FROM gastos WHERE cosecha_id = $1
      GROUP BY tipo ORDER BY total DESC
    `, [cosechaId]);
    return result.rows;
  }
}

module.exports = new Gasto();
