import { useState, useEffect } from 'react';
import { ventasAPI } from '../../services/api';
import { Modal } from '../ui';
import { formatCOP, formatKg, formatDate, formatDateInput, CALIDADES } from '../../utils/helpers';
import { ShoppingCart, Plus, Trash2, Edit2, BarChart3, Users, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

const emptyForm = {
  fecha: '', cliente: '', calidad: 'primera', cantidad_kg: '', precio_por_kg: '', valor_total: '',
  forma_pago: 'efectivo', notas: '',
};

const FORMAS_PAGO = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'credito', label: 'A credito' },
];

const CALIDAD_COLORS = {
  primera: 'bg-campo-100 text-campo-800',
  segunda: 'bg-cosecha-100 text-cosecha-800',
  tercera: 'bg-tierra-100 text-tierra-700',
  descarte: 'bg-red-100 text-red-700',
};

export default function VentasTab({ cosechaId, onCostChange }) {
  const [view, setView] = useState('ventas'); // 'ventas' | 'calidad' | 'clientes'
  const [ventas, setVentas] = useState([]);
  const [resumenCalidad, setResumenCalidad] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...emptyForm, cosecha_id: cosechaId });
  const [saving, setSaving] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [list, resCal] = await Promise.all([
        ventasAPI.listar(cosechaId),
        ventasAPI.resumen(cosechaId),
      ]);
      setVentas(list);
      setResumenCalidad(resCal);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, [cosechaId]);

  const openModal = (item = null) => {
    if (item) {
      setForm({ ...item, fecha: formatDateInput(item.fecha) });
      setEditing(item);
    } else {
      setForm({ ...emptyForm, cosecha_id: cosechaId, fecha: new Date().toISOString().split('T')[0] });
      setEditing(null);
    }
    setModalOpen(true);
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    const val = type === 'number' ? (value === '' ? '' : parseFloat(value)) : value;
    setForm((p) => {
      const next = { ...p, [name]: val };
      if (name === 'cantidad_kg' || name === 'precio_por_kg') {
        const kg = name === 'cantidad_kg' ? (parseFloat(value) || 0) : (parseFloat(p.cantidad_kg) || 0);
        const ppk = name === 'precio_por_kg' ? (parseFloat(value) || 0) : (parseFloat(p.precio_por_kg) || 0);
        next.valor_total = kg * ppk;
      }
      return next;
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.fecha || !form.cliente.trim() || !form.cantidad_kg || !form.precio_por_kg) {
      toast.error('Fecha, cliente, cantidad y precio requeridos'); return;
    }
    setSaving(true);
    try {
      if (editing) await ventasAPI.actualizar(editing.id, form);
      else await ventasAPI.crear(form);
      toast.success(editing ? 'Venta actualizada' : 'Venta registrada');
      setModalOpen(false);
      fetchAll();
      onCostChange?.();
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try {
      await ventasAPI.eliminar(id);
      toast.success('Venta eliminada');
      fetchAll();
      onCostChange?.();
    } catch (err) { toast.error(err.message); }
  };

  // Calculos
  const totalVentas = ventas.reduce((s, v) => s + parseFloat(v.valor_total || 0), 0);
  const totalKg = ventas.reduce((s, v) => s + parseFloat(v.cantidad_kg || 0), 0);
  const precioPromedio = totalKg > 0 ? totalVentas / totalKg : 0;

  // Agrupar por cliente
  const clientesMap = {};
  ventas.forEach((v) => {
    if (!clientesMap[v.cliente]) clientesMap[v.cliente] = { nombre: v.cliente, ventas: 0, kg: 0, total: 0 };
    clientesMap[v.cliente].ventas++;
    clientesMap[v.cliente].kg += parseFloat(v.cantidad_kg || 0);
    clientesMap[v.cliente].total += parseFloat(v.valor_total || 0);
  });
  const clientes = Object.values(clientesMap).sort((a, b) => b.total - a.total);

  // Agrupar por fecha
  const fechasMap = {};
  ventas.forEach((v) => {
    const f = v.fecha?.split('T')[0] || v.fecha;
    if (!fechasMap[f]) fechasMap[f] = { fecha: f, ventas: [], totalKg: 0, totalCop: 0 };
    fechasMap[f].ventas.push(v);
    fechasMap[f].totalKg += parseFloat(v.cantidad_kg || 0);
    fechasMap[f].totalCop += parseFloat(v.valor_total || 0);
  });
  const fechas = Object.values(fechasMap).sort((a, b) => b.fecha.localeCompare(a.fecha));

  if (loading) return <div className="text-center py-10 text-tierra-400 text-sm">Cargando...</div>;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-1">
          {[
            { id: 'ventas', label: 'Diario', icon: Calendar },
            { id: 'calidad', label: 'Por calidad', icon: BarChart3 },
            { id: 'clientes', label: 'Clientes', icon: Users },
          ].map((v) => (
            <button key={v.id} onClick={() => setView(v.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                view === v.id ? 'bg-campo-100 text-campo-700' : 'text-tierra-500 hover:bg-tierra-50'
              }`}>
              <v.icon className="w-3.5 h-3.5" /> {v.label}
            </button>
          ))}
        </div>
        <button onClick={() => openModal()} className="btn-primary text-xs flex items-center gap-1">
          <Plus className="w-3.5 h-3.5" /> Venta
        </button>
      </div>

      {/* Resumen totales */}
      {ventas.length > 0 && (
        <div className="grid grid-cols-1 xs:grid-cols-3 gap-3 mb-4">
          <div className="bg-campo-50 rounded-xl px-4 py-3 text-center">
            <p className="text-[10px] text-campo-500 uppercase font-medium">Total vendido</p>
            <p className="font-bold text-lg text-campo-800">{formatCOP(totalVentas)}</p>
          </div>
          <div className="bg-tierra-50 rounded-xl px-4 py-3 text-center">
            <p className="text-[10px] text-tierra-400 uppercase font-medium">Kg vendidos</p>
            <p className="font-bold text-lg text-tierra-800">{formatKg(totalKg)}</p>
          </div>
          <div className="bg-tierra-50 rounded-xl px-4 py-3 text-center">
            <p className="text-[10px] text-tierra-400 uppercase font-medium">Precio promedio</p>
            <p className="font-bold text-lg text-tierra-800">{formatCOP(precioPromedio)}/kg</p>
          </div>
        </div>
      )}

      {/* ═══ VISTA DIARIA ═══ */}
      {view === 'ventas' && (
        ventas.length === 0 ? (
          <div className="text-center py-10">
            <ShoppingCart className="w-12 h-12 text-tierra-300 mx-auto mb-3" />
            <p className="text-tierra-500 text-sm mb-1">Sin ventas registradas</p>
            <p className="text-tierra-400 text-xs mb-4">Las ventas se hacen diarias. Registra cada venta con fecha.</p>
            <button onClick={() => openModal()} className="btn-primary text-sm">Registrar venta</button>
          </div>
        ) : (
          <div className="space-y-4">
            {fechas.map((grupo) => (
              <div key={grupo.fecha}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-tierra-600">
                    {formatDate(grupo.fecha)}
                  </p>
                  <p className="text-xs text-tierra-400">
                    {formatKg(grupo.totalKg)} · {formatCOP(grupo.totalCop)}
                  </p>
                </div>
                <div className="space-y-2">
                  {grupo.ventas.map((v) => (
                    <div key={v.id} className="card p-4 flex items-center gap-3">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full shrink-0 ${CALIDAD_COLORS[v.calidad] || ''}`}>
                        {v.calidad}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{v.cliente}</p>
                        <p className="text-xs text-tierra-400">
                          {formatKg(v.cantidad_kg)} a {formatCOP(v.precio_por_kg)}/kg
                          {v.forma_pago !== 'efectivo' && ` · ${v.forma_pago}`}
                        </p>
                      </div>
                      <p className="text-sm font-bold text-campo-700 shrink-0">{formatCOP(v.valor_total)}</p>
                      <button onClick={() => openModal(v)} className="p-1.5 hover:bg-tierra-100 rounded-lg">
                        <Edit2 className="w-3.5 h-3.5 text-tierra-400" /></button>
                      <button onClick={() => handleDelete(v.id)} className="p-1.5 hover:bg-red-50 rounded-lg">
                        <Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* ═══ POR CALIDAD ═══ */}
      {view === 'calidad' && (
        resumenCalidad.length === 0 ? (
          <p className="text-center text-tierra-400 py-10 text-sm">Sin datos</p>
        ) : (
          <div className="space-y-3">
            {resumenCalidad.map((r) => {
              const calLabel = CALIDADES.find((c) => c.value === r.calidad)?.label || r.calidad;
              const pctKg = totalKg > 0 ? (parseFloat(r.total_kg || r.cantidad_kg || 0) / totalKg * 100) : 0;
              const totalCalidad = parseFloat(r.total_valor || r.valor_total || 0);
              const kgCalidad = parseFloat(r.total_kg || r.cantidad_kg || 0);
              const precioCalidad = kgCalidad > 0 ? totalCalidad / kgCalidad : 0;
              return (
                <div key={r.calidad} className="card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${CALIDAD_COLORS[r.calidad] || 'bg-tierra-100'}`}>
                      {calLabel}
                    </span>
                    <span className="text-sm font-bold text-campo-700">{formatCOP(totalCalidad)}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-center text-xs">
                    <div>
                      <p className="text-tierra-400">Cantidad</p>
                      <p className="font-bold text-tierra-800">{formatKg(kgCalidad)}</p>
                    </div>
                    <div>
                      <p className="text-tierra-400">Precio prom.</p>
                      <p className="font-bold text-tierra-800">{formatCOP(precioCalidad)}/kg</p>
                    </div>
                    <div>
                      <p className="text-tierra-400">% del total</p>
                      <p className="font-bold text-tierra-800">{pctKg.toFixed(1)}%</p>
                    </div>
                  </div>
                  <div className="mt-2 h-1.5 bg-tierra-100 rounded-full overflow-hidden">
                    <div className="h-full bg-campo-500 rounded-full" style={{ width: `${pctKg}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* ═══ POR CLIENTE ═══ */}
      {view === 'clientes' && (
        clientes.length === 0 ? (
          <p className="text-center text-tierra-400 py-10 text-sm">Sin datos</p>
        ) : (
          <div className="space-y-2">
            {clientes.map((c) => (
              <div key={c.nombre} className="card p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-campo-50 rounded-full flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-campo-700">{c.nombre.charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{c.nombre}</p>
                  <p className="text-xs text-tierra-400">{c.ventas} ventas · {formatKg(c.kg)}</p>
                </div>
                <p className="text-sm font-bold text-campo-700 shrink-0">{formatCOP(c.total)}</p>
              </div>
            ))}
          </div>
        )
      )}

      {/* ═══ MODAL ═══ */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}
        title={editing ? 'Editar venta' : 'Registrar venta'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="label">Cliente *</label>
            <input name="cliente" value={form.cliente} onChange={handleChange}
              className="input-field" placeholder="Nombre del comprador" autoFocus />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Fecha *</label>
              <input name="fecha" type="date" value={form.fecha} onChange={handleChange} className="input-field" />
            </div>
            <div>
              <label className="label">Calidad *</label>
              <select name="calidad" value={form.calidad} onChange={handleChange}
                className="input-field appearance-none cursor-pointer">
                {CALIDADES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Cantidad (kg) *</label>
              <input name="cantidad_kg" type="number" step="0.1" min="0" value={form.cantidad_kg}
                onChange={handleChange} className="input-field" />
            </div>
            <div>
              <label className="label">$/kg *</label>
              <input name="precio_por_kg" type="number" step="10" min="0" value={form.precio_por_kg}
                onChange={handleChange} className="input-field" />
            </div>
            <div>
              <label className="label">Total</label>
              <div className="input-field bg-campo-50 font-bold text-campo-700">
                {formatCOP(form.valor_total || 0)}
              </div>
            </div>
          </div>
          <div>
            <label className="label">Forma de pago</label>
            <select name="forma_pago" value={form.forma_pago} onChange={handleChange}
              className="input-field appearance-none cursor-pointer">
              {FORMAS_PAGO.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Notas</label>
            <textarea name="notas" value={form.notas || ''} onChange={handleChange}
              className="input-field" rows={2} placeholder="Observaciones..." />
          </div>

          <div className="bg-campo-50 rounded-xl px-4 py-3 flex items-center justify-between">
            <span className="text-sm text-campo-700">Valor de la venta:</span>
            <span className="font-bold text-campo-800 text-lg">{formatCOP(form.valor_total || 0)}</span>
          </div>

          <button type="submit" disabled={saving} className="btn-primary w-full text-center">
            {saving ? 'Guardando...' : editing ? 'Actualizar' : 'Registrar venta'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
