const BaseModel = require('./BaseModel');
const { query } = require('../config/database');

class Venta extends BaseModel {
  constructor() {
    super('ventas');
  }

  async findByCosecha(cosechaId) {
    const result = await query(
      'SELECT * FROM ventas WHERE cosecha_id = $1 ORDER BY fecha DESC',
      [cosechaId]
    );
    return result.rows;
  }

  async getResumenPorCalidad(cosechaId) {
    const result = await query(`
      SELECT calidad, COUNT(*) as num_ventas,
        COALESCE(SUM(cantidad_kg), 0) as total_kg,
        COALESCE(SUM(valor_total), 0) as total_valor,
        COALESCE(AVG(precio_por_kg), 0) as precio_promedio
      FROM ventas WHERE cosecha_id = $1
      GROUP BY calidad ORDER BY total_valor DESC
    `, [cosechaId]);
    return result.rows;
  }
}

module.exports = new Venta();
