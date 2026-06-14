const ExcelJS = require('exceljs');
const { query } = require('../config/database');

class ExportService {

  /**
   * Genera un workbook Excel con todos los datos de una cosecha.
   * @returns {ExcelJS.Workbook}
   */
  async generarExcelCosecha(cosechaId) {
    // Cargar todos los datos en paralelo
    const [cosechaR, trabajadoresR, jornadasR, insumosR, empaquesR, procesosR, fletesR, gastosR, ventasR, amedierosR] = await Promise.all([
      query(`SELECT c.*, l.nombre as lote_nombre, f.nombre as finca_nombre, f.departamento, f.municipio
             FROM cosechas c JOIN lotes l ON c.lote_id = l.id JOIN fincas f ON l.finca_id = f.id WHERE c.id = $1`, [cosechaId]),
      query(`SELECT t.nombre, t.telefono, ct.modalidad, ct.valor_dia, ct.valor_hora, ct.valor_bulto
             FROM cosecha_trabajadores ct JOIN trabajadores t ON ct.trabajador_id = t.id
             WHERE ct.cosecha_id = $1 AND ct.activo = true ORDER BY t.nombre`, [cosechaId]),
      query(`SELECT j.fecha, t.nombre as trabajador, j.horas_trabajadas, j.bultos_cosechados,
             j.valor_dia, j.valor_comida, j.subtotal_pago
             FROM jornadas_trabajo j JOIN trabajadores t ON j.trabajador_id = t.id
             WHERE j.cosecha_id = $1 ORDER BY j.fecha DESC, t.nombre`, [cosechaId]),
      query(`SELECT * FROM insumos_cosecha WHERE cosecha_id = $1 ORDER BY fecha DESC`, [cosechaId]),
      query(`SELECT * FROM empaques WHERE cosecha_id = $1 ORDER BY fecha DESC`, [cosechaId]),
      query(`SELECT * FROM procesos_cultivo WHERE cosecha_id = $1 ORDER BY fecha DESC`, [cosechaId]),
      query(`SELECT * FROM fletes WHERE cosecha_id = $1 ORDER BY fecha DESC`, [cosechaId]),
      query(`SELECT * FROM gastos WHERE cosecha_id = $1 ORDER BY fecha DESC`, [cosechaId]),
      query(`SELECT * FROM ventas WHERE cosecha_id = $1 ORDER BY fecha DESC`, [cosechaId]),
      query(`SELECT * FROM amedieros WHERE cosecha_id = $1 ORDER BY nombre`, [cosechaId]),
    ]);

    const cosecha = cosechaR.rows[0];
    if (!cosecha) return null;

    const wb = new ExcelJS.Workbook();
    wb.creator = 'CosechaApp';
    wb.created = new Date();

    const headerStyle = { font: { bold: true, color: { argb: 'FFFFFFFF' } }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF265F2A' } } };
    const moneyFmt = '"$"#,##0';
    const dateFmt = 'DD/MM/YYYY';

    // ── Hoja 1: Resumen ──
    const ws1 = wb.addWorksheet('Resumen');
    ws1.columns = [{ width: 30 }, { width: 25 }];
    const inversion = parseFloat(cosecha.costo_total || 0);
    const ingresos = parseFloat(cosecha.ingreso_total || 0);

    const resumenData = [
      ['RESUMEN DE COSECHA', ''],
      ['', ''],
      ['Finca', cosecha.finca_nombre],
      ['Lote', cosecha.lote_nombre],
      ['Ubicacion', `${cosecha.municipio}, ${cosecha.departamento}`],
      ['Variedad', cosecha.variedad_papa],
      ['Fecha siembra', cosecha.fecha_siembra],
      ['Fecha cosecha estimada', cosecha.fecha_cosecha_estimada || 'N/A'],
      ['Fecha cosecha real', cosecha.fecha_cosecha_real || 'Pendiente'],
      ['Estado', cosecha.estado],
      ['Area sembrada (ha)', cosecha.area_sembrada],
      ['', ''],
      ['PRODUCCION', ''],
      ['Primera (kg)', cosecha.produccion_primera],
      ['Segunda (kg)', cosecha.produccion_segunda],
      ['Tercera (kg)', cosecha.produccion_tercera],
      ['Descarte (kg)', cosecha.produccion_descarte],
      ['Perdidas (kg)', cosecha.perdidas],
      ['Total produccion (kg)', cosecha.produccion_total],
      ['', ''],
      ['FINANCIERO', ''],
      ['Inversion total', inversion],
      ['  - Trabajadores', cosecha.costo_trabajadores],
      ['  - Insumos', cosecha.costo_insumos],
      ['  - Empaques', cosecha.costo_empaques],
      ['  - Fletes', cosecha.costo_fletes],
      ['  - Procesos', cosecha.costo_procesos],
      ['Ingresos por ventas', ingresos],
      ['Utilidad neta', ingresos - inversion],
      ['ROI', inversion > 0 ? `${(((ingresos - inversion) / inversion) * 100).toFixed(1)}%` : 'N/A'],
    ];
    resumenData.forEach((row) => ws1.addRow(row));
    ws1.getRow(1).font = { bold: true, size: 14 };
    ws1.getRow(13).font = { bold: true, size: 12 };
    ws1.getRow(21).font = { bold: true, size: 12 };

    // ── Hoja 2: Jornadas de trabajo ──
    if (jornadasR.rows.length > 0) {
      const ws2 = wb.addWorksheet('Jornadas');
      const cols2 = ['Fecha', 'Trabajador', 'Horas', 'Bultos', 'Pago dia', 'Comida', 'Subtotal'];
      ws2.addRow(cols2);
      ws2.getRow(1).eachCell((cell) => { Object.assign(cell, headerStyle); });
      jornadasR.rows.forEach((j) => {
        ws2.addRow([j.fecha, j.trabajador, j.horas_trabajadas, j.bultos_cosechados, j.valor_dia, j.valor_comida, j.subtotal_pago]);
      });
      ws2.columns = [{ width: 12 }, { width: 25 }, { width: 8 }, { width: 10 }, { width: 15 }, { width: 12 }, { width: 15 }];
    }

    // ── Hoja 3: Insumos ──
    if (insumosR.rows.length > 0) {
      const ws3 = wb.addWorksheet('Insumos');
      const cols3 = ['Fecha', 'Tipo', 'Nombre', 'Marca', 'Cantidad', 'Unidad', 'V. Unitario', 'V. Total', 'Fase', 'Proveedor'];
      ws3.addRow(cols3);
      ws3.getRow(1).eachCell((cell) => { Object.assign(cell, headerStyle); });
      insumosR.rows.forEach((i) => {
        ws3.addRow([i.fecha, i.tipo, i.nombre, i.marca, i.cantidad, i.unidad, i.valor_unitario, i.valor_total, i.fase, i.proveedor]);
      });
      ws3.columns = [{ width: 12 }, { width: 14 }, { width: 25 }, { width: 15 }, { width: 10 }, { width: 8 }, { width: 14 }, { width: 14 }, { width: 14 }, { width: 18 }];
    }

    // ── Hoja 4: Empaques ──
    if (empaquesR.rows.length > 0) {
      const ws4 = wb.addWorksheet('Empaques');
      const cols4 = ['Fecha', 'Tipo', 'Descripcion', 'Cantidad', 'V. Unitario', 'V. Total'];
      ws4.addRow(cols4);
      ws4.getRow(1).eachCell((cell) => { Object.assign(cell, headerStyle); });
      empaquesR.rows.forEach((e) => {
        ws4.addRow([e.fecha, e.tipo, e.descripcion, e.cantidad, e.valor_unitario, e.valor_total]);
      });
      ws4.columns = [{ width: 12 }, { width: 16 }, { width: 30 }, { width: 10 }, { width: 14 }, { width: 14 }];
    }

    // ── Hoja 5: Procesos ──
    if (procesosR.rows.length > 0) {
      const ws5 = wb.addWorksheet('Procesos');
      const cols5 = ['Fecha', 'Tipo', 'Descripcion', 'Horas', 'Costo', 'Responsable', 'Maquinaria'];
      ws5.addRow(cols5);
      ws5.getRow(1).eachCell((cell) => { Object.assign(cell, headerStyle); });
      procesosR.rows.forEach((p) => {
        ws5.addRow([p.fecha, p.tipo, p.descripcion, p.duracion_horas, p.costo, p.responsable, p.maquinaria_usada]);
      });
      ws5.columns = [{ width: 12 }, { width: 16 }, { width: 30 }, { width: 8 }, { width: 14 }, { width: 18 }, { width: 20 }];
    }

    // ── Hoja 6: Fletes ──
    if (fletesR.rows.length > 0) {
      const ws6 = wb.addWorksheet('Fletes');
      const cols6 = ['Fecha', 'Descripcion', 'Origen', 'Destino', 'Bultos', 'Kilos', '$/Bulto', 'Total', 'Transportista', 'Vehiculo'];
      ws6.addRow(cols6);
      ws6.getRow(1).eachCell((cell) => { Object.assign(cell, headerStyle); });
      fletesR.rows.forEach((f) => {
        ws6.addRow([f.fecha, f.descripcion, f.origen, f.destino, f.cantidad_bultos, f.cantidad_kilos, f.valor_por_bulto, f.valor_total, f.transportista, f.vehiculo]);
      });
      ws6.columns = [{ width: 12 }, { width: 25 }, { width: 18 }, { width: 18 }, { width: 10 }, { width: 10 }, { width: 12 }, { width: 14 }, { width: 18 }, { width: 15 }];
    }

    // ── Hoja 7: Otros gastos ──
    if (gastosR.rows.length > 0) {
      const ws7 = wb.addWorksheet('Gastos');
      const cols7 = ['Fecha', 'Tipo', 'Concepto', 'Cantidad', 'V. Unitario', 'V. Total', 'Proveedor'];
      ws7.addRow(cols7);
      ws7.getRow(1).eachCell((cell) => { Object.assign(cell, headerStyle); });
      gastosR.rows.forEach((g) => {
        ws7.addRow([g.fecha, g.tipo, g.concepto, g.cantidad, g.valor_unitario, g.valor_total, g.proveedor]);
      });
      ws7.columns = [{ width: 12 }, { width: 16 }, { width: 30 }, { width: 10 }, { width: 14 }, { width: 14 }, { width: 20 }];
    }

    // ── Hoja 8: Ventas ──
    if (ventasR.rows.length > 0) {
      const ws8 = wb.addWorksheet('Ventas');
      const cols8 = ['Fecha', 'Cliente', 'Calidad', 'Cantidad (kg)', '$/kg', 'Total', 'Forma pago'];
      ws8.addRow(cols8);
      ws8.getRow(1).eachCell((cell) => { Object.assign(cell, headerStyle); });
      ventasR.rows.forEach((v) => {
        ws8.addRow([v.fecha, v.cliente, v.calidad, v.cantidad_kg, v.precio_por_kg, v.valor_total, v.forma_pago]);
      });
      ws8.columns = [{ width: 12 }, { width: 22 }, { width: 12 }, { width: 14 }, { width: 12 }, { width: 14 }, { width: 14 }];
    }

    // ── Hoja 9: Amedieros ──
    if (amedierosR.rows.length > 0) {
      const ws9 = wb.addWorksheet('Socios');
      const cols9 = ['Nombre', 'Telefono', '% Inversion', 'Monto invertido', '% Ganancia', 'Ganancia calculada', 'Aporte'];
      ws9.addRow(cols9);
      ws9.getRow(1).eachCell((cell) => { Object.assign(cell, headerStyle); });
      amedierosR.rows.forEach((a) => {
        ws9.addRow([a.nombre, a.telefono, a.porcentaje_inversion, a.monto_invertido, a.porcentaje_ganancia, a.ganancia_calculada, a.descripcion_aporte]);
      });
      ws9.columns = [{ width: 22 }, { width: 15 }, { width: 14 }, { width: 18 }, { width: 14 }, { width: 18 }, { width: 30 }];
    }

    return { workbook: wb, cosecha };
  }
}

module.exports = new ExportService();
