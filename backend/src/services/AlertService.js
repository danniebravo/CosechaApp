const Alerta = require('../models/Alerta');
const { Cosecha } = require('../models');
const { query } = require('../config/database');

// Ciclo en días por variedad de papa colombiana
const CICLO_POR_VARIEDAD = {
  'pastusa_suprema':  { dias: 150, nombre: 'Pastusa Suprema' },
  'diacol_capiro':    { dias: 150, nombre: 'Diacol Capiro (R-12)' },
  'parda_pastusa':    { dias: 165, nombre: 'Parda Pastusa' },
  'ica_unica':        { dias: 140, nombre: 'ICA Unica' },
  'tuquerena':        { dias: 160, nombre: 'Tuquerena' },
  'betina':           { dias: 120, nombre: 'Betina' },
  'rubi':             { dias: 140, nombre: 'Rubi' },
  'sabanera':         { dias: 155, nombre: 'Sabanera' },
  'criolla_colombia': { dias: 120, nombre: 'Criolla Colombia' },
  'criolla_galeras':  { dias: 115, nombre: 'Criolla Galeras' },
  'criolla_guanena':  { dias: 110, nombre: 'Criolla Guanena' },
  'superior':         { dias: 150, nombre: 'Superior' },
  'ica_nevada':       { dias: 145, nombre: 'ICA Nevada' },
};
const DIAS_COSECHA_DEFAULT = 150;

class AlertService {
  // Configuracion de alertas por defecto para papa
  CICLO_PAPA = {
    dias_cosecha: DIAS_COSECHA_DEFAULT,
    fertilizacion: [30, 65, 100],
    fumigacion: [45, 63, 81, 99, 117],
    riego_intervalo: 8,
  };

  /**
   * Retorna la cantidad de días estimados de cosecha para una variedad.
   * Busca por clave (value) o por nombre parcial.
   */
  getDiasPorVariedad(variedad) {
    if (!variedad) return DIAS_COSECHA_DEFAULT;

    // Buscar por clave exacta
    const lower = variedad.toLowerCase().replace(/\s+/g, '_');
    if (CICLO_POR_VARIEDAD[lower]) return CICLO_POR_VARIEDAD[lower].dias;

    // Buscar por nombre parcial
    const search = variedad.toLowerCase();
    for (const [, config] of Object.entries(CICLO_POR_VARIEDAD)) {
      if (config.nombre.toLowerCase().includes(search)) return config.dias;
    }

    return DIAS_COSECHA_DEFAULT;
  }

  /**
   * Calcula la fecha de cosecha estimada.
   */
  calcularFechaCosecha(fechaSiembra, variedad) {
    const dias = this.getDiasPorVariedad(variedad);
    const siembra = new Date(fechaSiembra);
    const cosecha = new Date(siembra);
    cosecha.setDate(cosecha.getDate() + dias);
    return { fecha: cosecha.toISOString().split('T')[0], dias };
  }

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

const alertService = new AlertService();
alertService.CICLO_POR_VARIEDAD = CICLO_POR_VARIEDAD;
alertService.DIAS_COSECHA_DEFAULT = DIAS_COSECHA_DEFAULT;

module.exports = alertService;
