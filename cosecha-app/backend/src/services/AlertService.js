const Alerta = require('../models/Alerta');
const { Cosecha } = require('../models');
const { query } = require('../config/database');

class AlertService {
  // Configuracion de alertas por defecto para papa
  CICLO_PAPA = {
    dias_cosecha: 135,
    fertilizacion: [30, 65, 100],       // dias desde siembra
    fumigacion: [45, 63, 81, 99, 117],  // dias desde siembra
    riego_intervalo: 8,                   // cada N dias
  };

  async generarAlertas(cosechaId) {
    const cosecha = await Cosecha.findById(cosechaId);
    if (!cosecha || !cosecha.fecha_siembra) return;

    // Eliminar alertas pendientes previas (regenerar)
    await Alerta.eliminarPorCosecha(cosechaId);

    const siembra = new Date(cosecha.fecha_siembra);
    const config = this.CICLO_PAPA;
    const alertas = [];

    // Cosecha estimada
    const fechaCosecha = cosecha.fecha_cosecha_estimada
      ? new Date(cosecha.fecha_cosecha_estimada)
      : this._addDays(siembra, config.dias_cosecha);

    alertas.push({
      cosecha_id: cosechaId,
      tipo: 'cosecha_estimada',
      titulo: 'Cosecha estimada',
      descripcion: `Se estima la cosecha de ${cosecha.variedad_papa} para esta fecha.`,
      fecha_programada: fechaCosecha.toISOString().split('T')[0],
    });

    // Fertilizacion
    for (const dia of config.fertilizacion) {
      const fecha = this._addDays(siembra, dia);
      if (fecha > new Date()) {
        alertas.push({
          cosecha_id: cosechaId,
          tipo: 'fertilizacion',
          titulo: `Fertilizacion programada (dia ${dia})`,
          descripcion: `Aplicar fertilizante a ${cosecha.variedad_papa}. Dia ${dia} del ciclo.`,
          fecha_programada: fecha.toISOString().split('T')[0],
        });
      }
    }

    // Fumigacion
    for (const dia of config.fumigacion) {
      const fecha = this._addDays(siembra, dia);
      if (fecha > new Date()) {
        alertas.push({
          cosecha_id: cosechaId,
          tipo: 'fumigacion',
          titulo: `Fumigacion programada (dia ${dia})`,
          descripcion: `Aplicar fumigante preventivo a ${cosecha.variedad_papa}. Dia ${dia} del ciclo.`,
          fecha_programada: fecha.toISOString().split('T')[0],
        });
      }
    }

    // Riego (cada 8 dias desde siembra hasta cosecha)
    const diasHastaCosecha = cosecha.fecha_cosecha_estimada
      ? Math.ceil((fechaCosecha - siembra) / (1000 * 60 * 60 * 24))
      : config.dias_cosecha;

    for (let dia = config.riego_intervalo; dia < diasHastaCosecha; dia += config.riego_intervalo) {
      const fecha = this._addDays(siembra, dia);
      if (fecha > new Date()) {
        alertas.push({
          cosecha_id: cosechaId,
          tipo: 'riego',
          titulo: `Riego programado (dia ${dia})`,
          descripcion: `Verificar riego de ${cosecha.variedad_papa}. Dia ${dia} del ciclo.`,
          fecha_programada: fecha.toISOString().split('T')[0],
        });
      }
    }

    // Insertar todas las alertas
    for (const alerta of alertas) {
      await Alerta.create(alerta);
    }

    return alertas.length;
  }

  async obtenerPendientes(usuarioId) {
    return Alerta.findPendientesByUsuario(usuarioId);
  }

  async contarPendientes(usuarioId) {
    return Alerta.countPendientesByUsuario(usuarioId);
  }

  async completar(alertaId, usuarioId) {
    await this._verificarPropietario(alertaId, usuarioId);
    return Alerta.marcarCompletada(alertaId);
  }

  async descartar(alertaId, usuarioId) {
    await this._verificarPropietario(alertaId, usuarioId);
    return Alerta.marcarDescartada(alertaId);
  }

  async _verificarPropietario(alertaId, usuarioId) {
    const result = await query(`
      SELECT a.id FROM alertas a
      JOIN cosechas c ON a.cosecha_id = c.id
      JOIN lotes l ON c.lote_id = l.id
      JOIN fincas f ON l.finca_id = f.id
      WHERE a.id = $1 AND f.usuario_id = $2
    `, [alertaId, usuarioId]);
    if (result.rows.length === 0) {
      const err = new Error('Alerta no encontrada');
      err.status = 404;
      throw err;
    }
  }

  _addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }
}

module.exports = new AlertService();
