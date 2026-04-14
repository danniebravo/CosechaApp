const BaseModel = require('./BaseModel');
const { query } = require('../config/database');

class Actividad extends BaseModel {
  constructor() {
    super('actividades');
  }

  async findByCosecha(cosechaId) {
    const result = await query(
      'SELECT * FROM actividades WHERE cosecha_id = $1 ORDER BY fecha DESC',
      [cosechaId]
    );
    return result.rows;
  }

  async findByTipo(cosechaId, tipo) {
    const result = await query(
      'SELECT * FROM actividades WHERE cosecha_id = $1 AND tipo = $2 ORDER BY fecha DESC',
      [cosechaId, tipo]
    );
    return result.rows;
  }

  async getCostosPorTipo(cosechaId) {
    const result = await query(`
      SELECT tipo, COUNT(*) as cantidad, COALESCE(SUM(costo), 0) as total
      FROM actividades WHERE cosecha_id = $1
      GROUP BY tipo ORDER BY total DESC
    `, [cosechaId]);
    return result.rows;
  }
}

module.exports = new Actividad();
