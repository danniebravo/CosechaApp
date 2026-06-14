const BaseModel = require('./BaseModel');
const { query } = require('../config/database');

class Jornada extends BaseModel {
  constructor() {
    super('jornadas_trabajo');
  }

  async findByCosecha(cosechaId) {
    const result = await query(`
      SELECT j.*, t.nombre as trabajador_nombre
      FROM jornadas_trabajo j
      JOIN trabajadores t ON j.trabajador_id = t.id
      WHERE j.cosecha_id = $1
      ORDER BY j.fecha DESC, t.nombre ASC
    `, [cosechaId]);
    return result.rows;
  }

  async findByTrabajadorYCosecha(trabajadorId, cosechaId) {
    const result = await query(`
      SELECT * FROM jornadas_trabajo
      WHERE trabajador_id = $1 AND cosecha_id = $2
      ORDER BY fecha DESC
    `, [trabajadorId, cosechaId]);
    return result.rows;
  }

  async findByFecha(cosechaId, fecha) {
    const result = await query(`
      SELECT j.*, t.nombre as trabajador_nombre
      FROM jornadas_trabajo j
      JOIN trabajadores t ON j.trabajador_id = t.id
      WHERE j.cosecha_id = $1 AND j.fecha = $2
      ORDER BY t.nombre ASC
    `, [cosechaId, fecha]);
    return result.rows;
  }

  async getResumenDiario(cosechaId) {
    const result = await query(`
      SELECT
        j.fecha,
        COUNT(DISTINCT j.trabajador_id) as num_trabajadores,
        COALESCE(SUM(j.bultos_cosechados), 0) as total_bultos,
        COALESCE(SUM(j.subtotal_pago), 0) as total_pagos,
        COALESCE(SUM(j.valor_comida), 0) as total_comida,
        COALESCE(SUM(j.subtotal_pago + j.valor_comida), 0) as total_dia
      FROM jornadas_trabajo j
      WHERE j.cosecha_id = $1
      GROUP BY j.fecha
      ORDER BY j.fecha DESC
    `, [cosechaId]);
    return result.rows;
  }
}

module.exports = new Jornada();
