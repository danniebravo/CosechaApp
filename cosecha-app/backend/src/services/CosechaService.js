const { Cosecha, Lote, Finca } = require('../models');
const { query } = require('../config/database');

class CosechaService {
  async verificarPropietario(cosechaId, usuarioId) {
    const result = await query(`
      SELECT c.id FROM cosechas c
      JOIN lotes l ON c.lote_id = l.id
      JOIN fincas f ON l.finca_id = f.id
      WHERE c.id = $1 AND f.usuario_id = $2
    `, [cosechaId, usuarioId]);
    return result.rows.length > 0;
  }

  async verificarLotePropietario(loteId, usuarioId) {
    const result = await query(`
      SELECT l.id FROM lotes l
      JOIN fincas f ON l.finca_id = f.id
      WHERE l.id = $1 AND f.usuario_id = $2
    `, [loteId, usuarioId]);
    return result.rows.length > 0;
  }

  async listar(usuarioId) {
    return Cosecha.findByUsuario(usuarioId);
  }

  async obtener(id, usuarioId) {
    const esPropietario = await this.verificarPropietario(id, usuarioId);
    if (!esPropietario) {
      const err = new Error('Cosecha no encontrada'); err.status = 404; throw err;
    }
    return Cosecha.findByIdCompleto(id);
  }

  async crear(data, usuarioId) {
    const esPropietario = await this.verificarLotePropietario(data.lote_id, usuarioId);
    if (!esPropietario) {
      const err = new Error('Lote no encontrado'); err.status = 404; throw err;
    }
    return Cosecha.create(data);
  }

  async actualizar(id, data, usuarioId) {
    const esPropietario = await this.verificarPropietario(id, usuarioId);
    if (!esPropietario) {
      const err = new Error('Cosecha no encontrada'); err.status = 404; throw err;
    }
    const cosecha = await Cosecha.update(id, data);
    await Cosecha.recalcularTotales(id);
    return Cosecha.findById(id);
  }

  async eliminar(id, usuarioId) {
    const esPropietario = await this.verificarPropietario(id, usuarioId);
    if (!esPropietario) {
      const err = new Error('Cosecha no encontrada'); err.status = 404; throw err;
    }
    return Cosecha.delete(id);
  }

  async getEstadisticas(usuarioId) {
    return Cosecha.getEstadisticas(usuarioId);
  }

  async getResumen(usuarioId) {
    return Cosecha.getResumen(usuarioId);
  }

  async getDashboard(usuarioId) {
    const [estadisticas, cosechasActivas, resumen] = await Promise.all([
      Cosecha.getEstadisticas(usuarioId),
      query(`
        SELECT c.*, l.nombre as lote_nombre, f.nombre as finca_nombre
        FROM cosechas c JOIN lotes l ON c.lote_id = l.id JOIN fincas f ON l.finca_id = f.id
        WHERE f.usuario_id = $1 AND c.estado IN ('planificada', 'en_progreso')
        ORDER BY c.fecha_siembra DESC LIMIT 5
      `, [usuarioId]),
      query(`
        SELECT
          EXTRACT(MONTH FROM c.fecha_siembra) as mes,
          EXTRACT(YEAR FROM c.fecha_siembra) as anio,
          COUNT(*) as total,
          COALESCE(SUM(c.produccion_total), 0) as produccion,
          COALESCE(SUM(c.ingreso_total - c.costo_total), 0) as utilidad
        FROM cosechas c JOIN lotes l ON c.lote_id = l.id JOIN fincas f ON l.finca_id = f.id
        WHERE f.usuario_id = $1
        GROUP BY EXTRACT(YEAR FROM c.fecha_siembra), EXTRACT(MONTH FROM c.fecha_siembra)
        ORDER BY anio DESC, mes DESC LIMIT 12
      `, [usuarioId]),
    ]);

    return {
      estadisticas,
      cosechasActivas: cosechasActivas.rows,
      historico: resumen.rows,
    };
  }
}

module.exports = new CosechaService();
