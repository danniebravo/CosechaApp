const BaseModel = require('./BaseModel');
const { query } = require('../config/database');

class Trabajador extends BaseModel {
  constructor() {
    super('trabajadores');
  }

  async findByUsuario(usuarioId) {
    const result = await query(
      'SELECT * FROM trabajadores WHERE usuario_id = $1 AND activo = true ORDER BY nombre ASC',
      [usuarioId]
    );
    return result.rows;
  }

  async findByCosecha(cosechaId) {
    const result = await query(`
      SELECT t.*, ct.valor_dia, ct.valor_hora, ct.valor_bulto, ct.modalidad, ct.id as asignacion_id
      FROM trabajadores t
      JOIN cosecha_trabajadores ct ON t.id = ct.trabajador_id
      WHERE ct.cosecha_id = $1 AND ct.activo = true AND t.activo = true
      ORDER BY t.nombre ASC
    `, [cosechaId]);
    return result.rows;
  }

  async asignarACosecha(cosechaId, trabajadorId, config) {
    const result = await query(`
      INSERT INTO cosecha_trabajadores (cosecha_id, trabajador_id, valor_dia, valor_hora, valor_bulto, modalidad)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (cosecha_id, trabajador_id)
      DO UPDATE SET valor_dia = $3, valor_hora = $4, valor_bulto = $5, modalidad = $6, activo = true
      RETURNING *
    `, [cosechaId, trabajadorId, config.valor_dia || 0, config.valor_hora || 0, config.valor_bulto || 0, config.modalidad || 'dia']);
    return result.rows[0];
  }

  async desasignarDeCosecha(cosechaId, trabajadorId) {
    const result = await query(
      'UPDATE cosecha_trabajadores SET activo = false WHERE cosecha_id = $1 AND trabajador_id = $2 RETURNING *',
      [cosechaId, trabajadorId]
    );
    return result.rows[0];
  }

  async getResumenPorCosecha(cosechaId) {
    const result = await query(`
      SELECT
        t.id, t.nombre,
        COUNT(j.id) as dias_trabajados,
        COALESCE(SUM(j.horas_trabajadas), 0) as total_horas,
        COALESCE(SUM(j.bultos_cosechados), 0) as total_bultos,
        COALESCE(SUM(j.subtotal_pago), 0) as total_pago,
        COALESCE(SUM(j.valor_comida), 0) as total_comida,
        COALESCE(SUM(j.subtotal_pago + j.valor_comida), 0) as total_costo
      FROM trabajadores t
      JOIN cosecha_trabajadores ct ON t.id = ct.trabajador_id
      LEFT JOIN jornadas_trabajo j ON j.trabajador_id = t.id AND j.cosecha_id = $1
      WHERE ct.cosecha_id = $1 AND ct.activo = true
      GROUP BY t.id, t.nombre
      ORDER BY t.nombre
    `, [cosechaId]);
    return result.rows;
  }
}

module.exports = new Trabajador();
