import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { cosechasAPI, actividadesAPI, gastosAPI, ventasAPI } from '../services/api';
import { PageHeader, LoadingPage, ErrorMsg, StatCard, Modal, ConfirmDialog } from '../components/ui';
import { formatCOP, formatKg, formatDate, formatDateInput, ESTADOS, TIPOS_ACTIVIDAD, TIPOS_GASTO, CALIDADES } from '../utils/helpers';
import {
  DollarSign, TrendingUp, Package, AlertTriangle, Activity,
  Receipt, ShoppingCart, BarChart3, Plus, Trash2, Edit2
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const TABS = [
  { id: 'resumen', label: 'Resumen', icon: BarChart3 },
  { id: 'actividades', label: 'Actividades', icon: Activity },
  { id: 'gastos', label: 'Gastos', icon: Receipt },
  { id: 'ventas', label: 'Ventas', icon: ShoppingCart },
];
const PIE_COLORS = ['#3d9641', '#eba809', '#b07a42', '#d97706', '#6366f1', '#ec4899'];

export default function CosechaDetallePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: cosecha, loading, error, refetch } = useApi(() => cosechasAPI.obtener(id), [id]);
  const [tab, setTab] = useState('resumen');
  const [modal, setModal] = useState({ open: false, type: null, editing: null });
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [prodModal, setProdModal] = useState(false);
  const [prodForm, setProdForm] = useState({});

  if (loading) return <LoadingPage />;
  if (error) return <ErrorMsg message={error} onRetry={refetch} />;
  if (!cosecha) return <ErrorMsg message="Cosecha no encontrada" />;

  const est = ESTADOS[cosecha.estado] || ESTADOS.planificada;
  const costoTotal = parseFloat(cosecha.costo_total || 0);
  const ingresoTotal = parseFloat(cosecha.ingreso_total || 0);
  const produccionTotal = parseFloat(cosecha.produccion_total || 0);
  const utilidad = ingresoTotal - costoTotal;
  const costoPorKg = produccionTotal > 0 ? costoTotal / produccionTotal : 0;

  // ── Handlers genéricos ──
  const onChange = (e) => {
    const { name, value, type } = e.target;
    setForm(p => ({ ...p, [name]: type === 'number' ? (value === '' ? '' : parseFloat(value)) : value }));
  };

  const openModal = (type, item = null) => {
    if (type === 'actividad') {
      setForm(item ? { ...item, fecha: formatDateInput(item.fecha) } : { cosecha_id: id, tipo: 'siembra', fecha: '', descripcion: '', producto_usado: '', cantidad_producto: '', costo: '', responsable: '' });
    } else if (type === 'gasto') {
      setForm(item ? { ...item, fecha: formatDateInput(item.fecha) } : { cosecha_id: id, tipo: 'insumos', concepto: '', cantidad: 1, valor_unitario: '', valor_total: '', fecha: '', proveedor: '' });
    } else if (type === 'venta') {
      setForm(item ? { ...item, fecha: formatDateInput(item.fecha) } : { cosecha_id: id, fecha: '', cliente: '', calidad: 'primera', cantidad_kg: '', precio_por_kg: '', valor_total: '' });
    }
    setModal({ open: true, type, editing: item });
  };

  const saveItem = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { type, editing } = modal;
      const apiMap = { actividad: actividadesAPI, gasto: gastosAPI, venta: ventasAPI };
      const api = apiMap[type];
      if (editing) { await api.actualizar(editing.id, form); }
      else { await api.crear(form); }
      toast.success(editing ? 'Actualizado' : 'Registrado');
      setModal({ open: false, type: null, editing: null });
      refetch();
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const deleteItem = async () => {
    try {
      const { type, item } = deleteTarget;
      const apiMap = { actividad: actividadesAPI, gasto: gastosAPI, venta: ventasAPI };
      await apiMap[type].eliminar(item.id);
      toast.success('Eliminado'); setDeleteTarget(null); refetch();
    } catch (err) { toast.error(err.message); }
  };

  // ── Auto-calcular valor_total en gastos y ventas ──
  const onGastoChange = (e) => {
    onChange(e);
    const updated = { ...form, [e.target.name]: e.target.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value };
    if (e.target.name === 'cantidad' || e.target.name === 'valor_unitario') {
      const total = (parseFloat(updated.cantidad) || 0) * (parseFloat(updated.valor_unitario) || 0);
      setForm(p => ({ ...p, [e.target.name]: updated[e.target.name], valor_total: total }));
    } else { onChange(e); }
  };

  const onVentaChange = (e) => {
    onChange(e);
    const updated = { ...form, [e.target.name]: e.target.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value };
    if (e.target.name === 'cantidad_kg' || e.target.name === 'precio_por_kg') {
      const total = (parseFloat(updated.cantidad_kg) || 0) * (parseFloat(updated.precio_por_kg) || 0);
      setForm(p => ({ ...p, [e.target.name]: updated[e.target.name], valor_total: total }));
    } else { onChange(e); }
  };

  // ── Producción ──
  const openProd = () => {
    setProdForm({
      produccion_primera: cosecha.produccion_primera || 0,
      produccion_segunda: cosecha.produccion_segunda || 0,
      produccion_tercera: cosecha.produccion_tercera || 0,
      produccion_descarte: cosecha.produccion_descarte || 0,
      perdidas: cosecha.perdidas || 0,
      fecha_cosecha_real: formatDateInput(cosecha.fecha_cosecha_real) || '',
      estado: cosecha.estado,
    });
    setProdModal(true);
  };

  const saveProd = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await cosechasAPI.actualizar(id, prodForm);
      toast.success('Producción actualizada');
      setProdModal(false); refetch();
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const onProdChange = (e) => {
    const { name, value, type } = e.target;
    setProdForm(p => ({ ...p, [name]: type === 'number' ? (value === '' ? 0 : parseFloat(value)) : value }));
  };

  // ── Gasto pie chart ──
  const gastosPorTipo = {};
  (cosecha.gastos || []).forEach(g => {
    const t = TIPOS_GASTO.find(x => x.value === g.tipo)?.label || g.tipo;
    gastosPorTipo[t] = (gastosPorTipo[t] || 0) + parseFloat(g.valor_total);
  });
  (cosecha.actividades || []).forEach(a => {
    if (parseFloat(a.costo) > 0) {
      const t = TIPOS_ACTIVIDAD.find(x => x.value === a.tipo)?.label || a.tipo;
      gastosPorTipo[t] = (gastosPorTipo[t] || 0) + parseFloat(a.costo);
    }
  });
  const pieData = Object.entries(gastosPorTipo).map(([name, value]) => ({ name, value }));

  return (
    <div className="animate-fade-in">
      <Toaster position="top-center" />
      <PageHeader
        title={cosecha.variedad_papa}
        subtitle={`${cosecha.lote?.finca_nombre} · ${cosecha.lote?.nombre} · Siembra: ${formatDate(cosecha.fecha_siembra)}`}
        onBack={() => navigate('/cosechas')}
        action={
          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${est.color}`}>{est.label}</span>
        }
      />

      {/* Stats principales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <StatCard label="Producción" value={formatKg(produccionTotal)} icon={Package} color="cosecha" />
        <StatCard label="Costo total" value={formatCOP(costoTotal)} icon={Receipt} color="tierra" />
        <StatCard label="Ingresos" value={formatCOP(ingresoTotal)} icon={DollarSign} color="campo" />
        <StatCard label="Utilidad" value={formatCOP(utilidad)} icon={TrendingUp} color={utilidad >= 0 ? 'campo' : 'red'}
          sub={costoPorKg > 0 ? `Costo/kg: ${formatCOP(costoPorKg)}` : undefined} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 mb-5 -mx-1 px-1">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              tab === t.id ? 'bg-campo-600 text-white shadow-sm' : 'bg-white text-tierra-600 hover:bg-tierra-50'
            }`}>
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {/* ═══ TAB: RESUMEN ═══ */}
      {tab === 'resumen' && (
        <div className="space-y-4">
          {/* Producción */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-base">Producción</h3>
              <button onClick={openProd} className="btn-secondary text-xs flex items-center gap-1"><Edit2 className="w-3.5 h-3.5" /> Editar</button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
              <div><span className="text-tierra-500 text-xs">Primera</span><p className="font-semibold">{formatKg(cosecha.produccion_primera)}</p></div>
              <div><span className="text-tierra-500 text-xs">Segunda</span><p className="font-semibold">{formatKg(cosecha.produccion_segunda)}</p></div>
              <div><span className="text-tierra-500 text-xs">Tercera</span><p className="font-semibold">{formatKg(cosecha.produccion_tercera)}</p></div>
              <div><span className="text-tierra-500 text-xs">Descarte</span><p className="font-semibold">{formatKg(cosecha.produccion_descarte)}</p></div>
              <div><span className="text-tierra-500 text-xs">Pérdidas</span><p className="font-semibold text-red-600">{formatKg(cosecha.perdidas)}</p></div>
              <div><span className="text-tierra-500 text-xs">Total</span><p className="font-bold text-campo-700">{formatKg(produccionTotal)}</p></div>
            </div>
          </div>

          {/* Distribución de costos */}
          {pieData.length > 0 && (
            <div className="card p-5">
              <h3 className="font-display font-bold text-base mb-4">Distribución de costos</h3>
              <div className="flex items-center gap-6">
                <div className="w-40 h-40 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={65} innerRadius={35}>
                        {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={v => formatCOP(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 flex-1">
                  {pieData.map((d, i) => (
                    <div key={d.name} className="flex items-center gap-2 text-xs">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="flex-1 text-tierra-600">{d.name}</span>
                      <span className="font-semibold">{formatCOP(d.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ TAB: ACTIVIDADES ═══ */}
      {tab === 'actividades' && (
        <div>
          <div className="flex justify-end mb-3">
            <button onClick={() => openModal('actividad')} className="btn-primary text-sm flex items-center gap-1.5"><Plus className="w-4 h-4" /> Actividad</button>
          </div>
          {(cosecha.actividades || []).length === 0 ? (
            <p className="text-center text-tierra-400 py-10 text-sm">Sin actividades registradas</p>
          ) : (
            <div className="space-y-2">
              {cosecha.actividades.map(a => {
                const tipo = TIPOS_ACTIVIDAD.find(t => t.value === a.tipo);
                return (
                  <div key={a.id} className="card p-4 flex items-center gap-3">
                    <span className="text-xl">{tipo?.icon || '📋'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">{tipo?.label || a.tipo}</p>
                      <p className="text-xs text-tierra-400">{formatDate(a.fecha)} {a.descripcion ? `· ${a.descripcion}` : ''}</p>
                    </div>
                    {parseFloat(a.costo) > 0 && <span className="text-sm font-semibold text-tierra-700">{formatCOP(a.costo)}</span>}
                    <button onClick={() => openModal('actividad', a)} className="p-1.5 hover:bg-tierra-100 rounded-lg"><Edit2 className="w-3.5 h-3.5 text-tierra-400" /></button>
                    <button onClick={() => setDeleteTarget({ type: 'actividad', item: a })} className="p-1.5 hover:bg-red-50 rounded-lg"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ═══ TAB: GASTOS ═══ */}
      {tab === 'gastos' && (
        <div>
          <div className="flex justify-end mb-3">
            <button onClick={() => openModal('gasto')} className="btn-primary text-sm flex items-center gap-1.5"><Plus className="w-4 h-4" /> Gasto</button>
          </div>
          {(cosecha.gastos || []).length === 0 ? (
            <p className="text-center text-tierra-400 py-10 text-sm">Sin gastos registrados</p>
          ) : (
            <div className="space-y-2">
              {cosecha.gastos.map(g => {
                const tipo = TIPOS_GASTO.find(t => t.value === g.tipo);
                return (
                  <div key={g.id} className="card p-4 flex items-center gap-3">
                    <span className="text-xl">{tipo?.icon || '📦'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">{g.concepto}</p>
                      <p className="text-xs text-tierra-400">{tipo?.label} · {formatDate(g.fecha)} {g.proveedor ? `· ${g.proveedor}` : ''}</p>
                    </div>
                    <span className="text-sm font-bold text-tierra-800">{formatCOP(g.valor_total)}</span>
                    <button onClick={() => openModal('gasto', g)} className="p-1.5 hover:bg-tierra-100 rounded-lg"><Edit2 className="w-3.5 h-3.5 text-tierra-400" /></button>
                    <button onClick={() => setDeleteTarget({ type: 'gasto', item: g })} className="p-1.5 hover:bg-red-50 rounded-lg"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ═══ TAB: VENTAS ═══ */}
      {tab === 'ventas' && (
        <div>
          <div className="flex justify-end mb-3">
            <button onClick={() => openModal('venta')} className="btn-primary text-sm flex items-center gap-1.5"><Plus className="w-4 h-4" /> Venta</button>
          </div>
          {(cosecha.ventas || []).length === 0 ? (
            <p className="text-center text-tierra-400 py-10 text-sm">Sin ventas registradas</p>
          ) : (
            <div className="space-y-2">
              {cosecha.ventas.map(v => (
                <div key={v.id} className="card p-4 flex items-center gap-3">
                  <div className="w-9 h-9 bg-campo-50 rounded-xl flex items-center justify-center shrink-0">
                    <ShoppingCart className="w-4 h-4 text-campo-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{v.cliente}</p>
                    <p className="text-xs text-tierra-400">{formatDate(v.fecha)} · {formatKg(v.cantidad_kg)} · {v.calidad}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-campo-700">{formatCOP(v.valor_total)}</p>
                    <p className="text-[10px] text-tierra-400">{formatCOP(v.precio_por_kg)}/kg</p>
                  </div>
                  <button onClick={() => openModal('venta', v)} className="p-1.5 hover:bg-tierra-100 rounded-lg"><Edit2 className="w-3.5 h-3.5 text-tierra-400" /></button>
                  <button onClick={() => setDeleteTarget({ type: 'venta', item: v })} className="p-1.5 hover:bg-red-50 rounded-lg"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══ MODALES ═══ */}
      {/* Modal actividad */}
      <Modal isOpen={modal.open && modal.type === 'actividad'} onClose={() => setModal({ open: false })}
        title={modal.editing ? 'Editar actividad' : 'Nueva actividad'}>
        <form onSubmit={saveItem} className="space-y-4">
          <div><label className="label">Tipo *</label>
            <select name="tipo" value={form.tipo} onChange={onChange} className="input-field">
              {TIPOS_ACTIVIDAD.map(t => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
            </select></div>
          <div><label className="label">Fecha *</label>
            <input name="fecha" type="date" value={form.fecha} onChange={onChange} className="input-field" /></div>
          <div><label className="label">Descripción</label>
            <textarea name="descripcion" value={form.descripcion} onChange={onChange} className="input-field" rows={2} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Producto</label>
              <input name="producto_usado" value={form.producto_usado} onChange={onChange} className="input-field" /></div>
            <div><label className="label">Cantidad</label>
              <input name="cantidad_producto" type="number" step="0.1" value={form.cantidad_producto} onChange={onChange} className="input-field" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Costo ($)</label>
              <input name="costo" type="number" step="100" value={form.costo} onChange={onChange} className="input-field" /></div>
            <div><label className="label">Responsable</label>
              <input name="responsable" value={form.responsable} onChange={onChange} className="input-field" /></div>
          </div>
          <button type="submit" disabled={saving} className="btn-primary w-full text-center">
            {saving ? 'Guardando...' : modal.editing ? 'Actualizar' : 'Registrar'}
          </button>
        </form>
      </Modal>

      {/* Modal gasto */}
      <Modal isOpen={modal.open && modal.type === 'gasto'} onClose={() => setModal({ open: false })}
        title={modal.editing ? 'Editar gasto' : 'Nuevo gasto'}>
        <form onSubmit={saveItem} className="space-y-4">
          <div><label className="label">Tipo *</label>
            <select name="tipo" value={form.tipo} onChange={onChange} className="input-field">
              {TIPOS_GASTO.map(t => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
            </select></div>
          <div><label className="label">Concepto *</label>
            <input name="concepto" value={form.concepto} onChange={onChange} className="input-field" placeholder="Ej: Fertilizante 10-30-10" /></div>
          <div><label className="label">Fecha *</label>
            <input name="fecha" type="date" value={form.fecha} onChange={onChange} className="input-field" /></div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="label">Cantidad</label>
              <input name="cantidad" type="number" step="0.1" value={form.cantidad} onChange={onGastoChange} className="input-field" /></div>
            <div><label className="label">V. unitario *</label>
              <input name="valor_unitario" type="number" step="100" value={form.valor_unitario} onChange={onGastoChange} className="input-field" /></div>
            <div><label className="label">Total</label>
              <input name="valor_total" type="number" step="100" value={form.valor_total} onChange={onChange} className="input-field bg-tierra-50" /></div>
          </div>
          <div><label className="label">Proveedor</label>
            <input name="proveedor" value={form.proveedor} onChange={onChange} className="input-field" /></div>
          <button type="submit" disabled={saving} className="btn-primary w-full text-center">
            {saving ? 'Guardando...' : modal.editing ? 'Actualizar' : 'Registrar'}
          </button>
        </form>
      </Modal>

      {/* Modal venta */}
      <Modal isOpen={modal.open && modal.type === 'venta'} onClose={() => setModal({ open: false })}
        title={modal.editing ? 'Editar venta' : 'Nueva venta'}>
        <form onSubmit={saveItem} className="space-y-4">
          <div><label className="label">Cliente *</label>
            <input name="cliente" value={form.cliente} onChange={onChange} className="input-field" placeholder="Nombre del comprador" /></div>
          <div><label className="label">Fecha *</label>
            <input name="fecha" type="date" value={form.fecha} onChange={onChange} className="input-field" /></div>
          <div><label className="label">Calidad *</label>
            <select name="calidad" value={form.calidad} onChange={onChange} className="input-field">
              {CALIDADES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select></div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="label">Cantidad (kg) *</label>
              <input name="cantidad_kg" type="number" step="0.1" value={form.cantidad_kg} onChange={onVentaChange} className="input-field" /></div>
            <div><label className="label">$/kg *</label>
              <input name="precio_por_kg" type="number" step="10" value={form.precio_por_kg} onChange={onVentaChange} className="input-field" /></div>
            <div><label className="label">Total</label>
              <input name="valor_total" type="number" step="100" value={form.valor_total} onChange={onChange} className="input-field bg-tierra-50" /></div>
          </div>
          <button type="submit" disabled={saving} className="btn-primary w-full text-center">
            {saving ? 'Guardando...' : modal.editing ? 'Actualizar' : 'Registrar'}
          </button>
        </form>
      </Modal>

      {/* Modal producción */}
      <Modal isOpen={prodModal} onClose={() => setProdModal(false)} title="Actualizar producción">
        <form onSubmit={saveProd} className="space-y-4">
          <div><label className="label">Estado</label>
            <select name="estado" value={prodForm.estado} onChange={onProdChange} className="input-field">
              {Object.entries(ESTADOS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select></div>
          <div><label className="label">Fecha cosecha real</label>
            <input name="fecha_cosecha_real" type="date" value={prodForm.fecha_cosecha_real} onChange={onProdChange} className="input-field" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Primera (kg)</label>
              <input name="produccion_primera" type="number" step="0.1" value={prodForm.produccion_primera} onChange={onProdChange} className="input-field" /></div>
            <div><label className="label">Segunda (kg)</label>
              <input name="produccion_segunda" type="number" step="0.1" value={prodForm.produccion_segunda} onChange={onProdChange} className="input-field" /></div>
            <div><label className="label">Tercera (kg)</label>
              <input name="produccion_tercera" type="number" step="0.1" value={prodForm.produccion_tercera} onChange={onProdChange} className="input-field" /></div>
            <div><label className="label">Descarte (kg)</label>
              <input name="produccion_descarte" type="number" step="0.1" value={prodForm.produccion_descarte} onChange={onProdChange} className="input-field" /></div>
          </div>
          <div><label className="label">Pérdidas (kg)</label>
            <input name="perdidas" type="number" step="0.1" value={prodForm.perdidas} onChange={onProdChange} className="input-field" /></div>
          <button type="submit" disabled={saving} className="btn-primary w-full text-center">
            {saving ? 'Guardando...' : 'Actualizar producción'}
          </button>
        </form>
      </Modal>

      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={deleteItem}
        title="Eliminar registro" message="¿Estás seguro? Esta acción no se puede deshacer." />
    </div>
  );
}
