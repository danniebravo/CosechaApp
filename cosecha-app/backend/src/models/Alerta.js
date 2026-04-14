const BaseModel = require('./BaseModel');
const { query } = require('../config/database');

class Alerta extends BaseModel {
  constructor() {
    super('alertas');
  }

  async findByCosecha(cosechaId) {
    const result = await query(
      `SELECT * FROM alertas WHERE cosecha_id = $1 ORDER BY fecha_programada ASC`,
      [cosechaId]
    );
    return result.rows;
  }

  async findPendientesByUsuario(usuarioId) {
    const result = await query(`
      SELECT a.*, c.variedad_papa, c.fecha_siembra, l.nombre as lote_nombre, f.nombre as finca_nombre
      FROM alertas a
      JOIN cosechas c ON a.cosecha_id = c.id
      JOIN lotes l ON c.lote_id = l.id
      JOIN fincas f ON l.finca_id = f.id
      WHERE f.usuario_id = $1 AND a.estado = 'pendiente'
      ORDER BY a.fecha_programada ASC
    `, [usuarioId]);
    return result.rows;
  }

  async countPendientesByUsuario(usuarioId) {
    const result = await query(`
      SELECT COUNT(*) as total
      FROM alertas a
      JOIN cosechas c ON a.cosecha_id = c.id
      JOIN lotes l ON c.lote_id = l.id
      JOIN fincas f ON l.finca_id = f.id
      WHERE f.usuario_id = $1 AND a.estado = 'pendiente'
    `, [usuarioId]);
    return parseInt(result.rows[0].total);
  }

  async marcarCompletada(id) {
    const result = await query(
      `UPDATE alertas SET estado = 'completada' WHERE id = $1 RETURNING *`,
      [id]
    );
    return result.rows[0];
  }

  async marcarDescartada(id) {
    const result = await query(
      `UPDATE alertas SET estado = 'descartada' WHERE id = $1 RETURNING *`,
      [id]
    );
    return result.rows[0];
  }

  async eliminarPorCosecha(cosechaId) {
    await query(
      `DELETE FROM alertas WHERE cosecha_id = $1 AND estado = 'pendiente'`,
      [cosechaId]
    );
  }
}

module.exports = new Alerta();
