const BaseModel = require('./BaseModel');
const { query } = require('../config/database');

class Amediero extends BaseModel {
  constructor() {
    super('amedieros');
  }

  async findByCosecha(cosechaId) {
    const result = await query(
      'SELECT * FROM amedieros WHERE cosecha_id = $1 ORDER BY nombre ASC',
      [cosechaId]
    );
    return result.rows;
  }

  async getDistribucion(cosechaId) {
    const result = await query(`
      SELECT
        a.*,
        c.ingreso_total,
        c.costo_total,
        (c.ingreso_total - c.costo_total) as utilidad_cosecha
      FROM amedieros a
      JOIN cosechas c ON a.cosecha_id = c.id
      WHERE a.cosecha_id = $1
      ORDER BY a.porcentaje_ganancia DESC
    `, [cosechaId]);
    return result.rows;
  }

  async validarPorcentajes(cosechaId, excludeId) {
    let sql = `
      SELECT COALESCE(SUM(porcentaje_ganancia), 0) as total_ganancia,
             COALESCE(SUM(porcentaje_inversion), 0) as total_inversion
      FROM amedieros WHERE cosecha_id = $1
    `;
    const params = [cosechaId];
    if (excludeId) {
      sql += ' AND id != $2';
      params.push(excludeId);
    }
    const result = await query(sql, params);
    return result.rows[0];
  }
}

module.exports = new Amediero();
