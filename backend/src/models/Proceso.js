const BaseModel = require('./BaseModel');
const { query } = require('../config/database');

class Proceso extends BaseModel {
  constructor() {
    super('procesos_cultivo');
  }

  async findByCosecha(cosechaId) {
    const result = await query(
      'SELECT * FROM procesos_cultivo WHERE cosecha_id = $1 ORDER BY fecha DESC',
      [cosechaId]
    );
    return result.rows;
  }

  async getResumenPorTipo(cosechaId) {
    const result = await query(`
      SELECT
        tipo,
        COUNT(*) as cantidad,
        COALESCE(SUM(costo), 0) as total_costo,
        COALESCE(SUM(duracion_horas), 0) as total_horas
      FROM procesos_cultivo
      WHERE cosecha_id = $1
      GROUP BY tipo
      ORDER BY total_costo DESC
    `, [cosechaId]);
    return result.rows;
  }
}

module.exports = new Proceso();
