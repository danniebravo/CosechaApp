import { useState, useEffect } from 'react';
import { insumosAPI } from '../../services/api';
import { Modal } from '../ui';
import { formatCOP, formatDate, formatDateInput } from '../../utils/helpers';
import { Package, Plus, Trash2, Edit2, BarChart3 } from 'lucide-react';
import toast from 'react-hot-toast';

const TIPOS_INSUMO = [
  { value: 'semilla', label: 'Semilla', icon: '🌱' },
  { value: 'abono', label: 'Abono', icon: '🧪' },
  { value: 'fertilizante', label: 'Fertilizante', icon: '🧴' },
  { value: 'insecticida', label: 'Insecticida', icon: '🐛' },
  { value: 'fungicida', label: 'Fungicida', icon: '🍄' },
  { value: 'herbicida', label: 'Herbicida', icon: '🌿' },
  { value: 'desinfectante', label: 'Desinfectante', icon: '🧹' },
  { value: 'otro', label: 'Otro', icon: '📦' },
];

const FASES = [
  { value: 'pre_siembra', label: 'Pre-siembra' },
  { value: 'siembra', label: 'Siembra' },
  { value: 'desarrollo', label: 'Desarrollo' },
  { value: 'cosecha', label: 'Cosecha' },
  { value: 'post_cosecha', label: 'Post-cosecha' },
];

const emptyForm = {
  tipo: 'semilla', nombre: '', marca: '', cantidad: '', unidad: 'kg',
  valor_unitario: '', valor_total: '', fecha: '', fase: 'siembra', proveedor: '', notas: '',
};

export default function InsumosTab({ cosechaId, onCostChange }) {
  const [view, setView] = useState('lista'); // 'lista' | 'resumen'
  const [insumos, setInsumos] = useState([]);
  const [resumenTipo, setResumenTipo] = useState([]);
  const [resumenFase, setResumenFase] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...emptyForm, cosecha_id: cosechaId });
  const [saving, setSaving] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [list, byTipo, byFase] = await Promise.all([
        insumosAPI.listar(cosechaId),
        insumosAPI.resumenPorTipo(cosechaId),
        insumosAPI.resumenPorFase(cosechaId),
      ]);
      setInsumos(list);
      setResumenTipo(byTipo);
      setResumenFase(byFase);
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
      // Auto-calcular total
      if (name === 'cantidad' || name === 'valor_unitario') {
        const cant = name === 'cantidad' ? (parseFloat(value) || 0) : (parseFloat(p.cantidad) || 0);
        const unit = name === 'valor_unitario' ? (parseFloat(value) || 0) : (parseFloat(p.valor_unitario) || 0);
        next.valor_total = cant * unit;
      }
      return next;
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.nombre.trim() || !form.cantidad || !form.valor_unitario) {
      toast.error('Nombre, cantidad y valor unitario requeridos'); return;
    }
    setSaving(true);
    try {
      if (editing) {
        await insumosAPI.actualizar(editing.id, form);
        toast.success('Insumo actualizado');
      } else {
        await insumosAPI.crear(form);
        toast.success('Insumo registrado');
      }
      setModalOpen(false);
      fetchAll();
      onCostChange?.();
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try {
      await insumosAPI.eliminar(id);
      toast.success('Insumo eliminado');
      fetchAll();
      onCostChange?.();
    } catch (err) { toast.error(err.message); }
  };

  const totalInsumos = insumos.reduce((s, i) => s + parseFloat(i.valor_total || 0), 0);

  if (loading) return <div className="text-center py-10 text-tierra-400 text-sm">Cargando...</div>;

  return (
    <div>
      {/* Header con toggle y acciones */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-1">
          {[
            { id: 'lista', label: 'Insumos', icon: Package },
            { id: 'resumen', label: 'Resumen', icon: BarChart3 },
          ].map((v) => (
            <button key={v.id} onClick={() => setView(v.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                view === v.id ? 'bg-campo-100 text-campo-700' : 'text-tierra-500 hover:bg-tierra-50'
              }`}>
              <v.icon className="w-3.5 h-3.5" /> {v.label}
            </button>
          ))}
        </div>
        {view === 'lista' && (
          <button onClick={() => openModal()} className="btn-primary text-xs flex items-center gap-1">
            <Plus className="w-3.5 h-3.5" /> Insumo
          </button>
        )}
      </div>

      {/* Total */}
      {insumos.length > 0 && (
        <div className="bg-tierra-50 rounded-xl px-4 py-2.5 mb-4 flex items-center justify-between">
          <span className="text-sm text-tierra-600">Total insumos:</span>
          <span className="font-bold text-tierra-900">{formatCOP(totalInsumos)}</span>
        </div>
      )}

      {/* ═══ LISTA ═══ */}
      {view === 'lista' && (
        insumos.length === 0 ? (
          <div className="text-center py-10">
            <Package className="w-12 h-12 text-tierra-300 mx-auto mb-3" />
            <p className="text-tierra-500 text-sm mb-1">Sin insumos registrados</p>
            <p className="text-tierra-400 text-xs mb-4">Registra semillas, abonos, insecticidas y mas</p>
            <button onClick={() => openModal()} className="btn-primary text-sm">Registrar insumo</button>
          </div>
        ) : (
          <div className="space-y-2">
            {insumos.map((i) => {
              const tipo = TIPOS_INSUMO.find((t) => t.value === i.tipo);
              const fase = FASES.find((f) => f.value === i.fase);
              return (
                <div key={i.id} className="card p-4 flex items-center gap-3">
                  <span className="text-xl shrink-0">{tipo?.icon || '📦'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{i.nombre}</p>
                    <p className="text-xs text-tierra-400">
                      {tipo?.label} · {i.cantidad} {i.unidad} · {formatDate(i.fecha)}
                      {fase && <span className="ml-1">· {fase.label}</span>}
                    </p>
                    {i.marca && <p className="text-[10px] text-tierra-300">Marca: {i.marca}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-tierra-800">{formatCOP(i.valor_total)}</p>
                    <p className="text-[10px] text-tierra-400">{formatCOP(i.valor_unitario)}/{i.unidad}</p>
                  </div>
                  <button onClick={() => openModal(i)} className="p-1.5 hover:bg-tierra-100 rounded-lg">
                    <Edit2 className="w-3.5 h-3.5 text-tierra-400" />
                  </button>
                  <button onClick={() => handleDelete(i.id)} className="p-1.5 hover:bg-red-50 rounded-lg">
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  </button>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* ═══ RESUMEN ═══ */}
      {view === 'resumen' && (
        <div className="space-y-4">
          {/* Por tipo */}
          {resumenTipo.length > 0 && (
            <div className="card p-4">
              <h4 className="font-semibold text-sm mb-3">Por tipo de insumo</h4>
              <div className="space-y-2">
                {resumenTipo.map((r) => {
                  const tipo = TIPOS_INSUMO.find((t) => t.value === r.tipo);
                  return (
                    <div key={r.tipo} className="flex items-center gap-3">
                      <span className="text-lg">{tipo?.icon || '📦'}</span>
                      <span className="flex-1 text-sm text-tierra-700">{tipo?.label || r.tipo}</span>
                      <span className="text-xs text-tierra-400">{r.cantidad_registros} items</span>
                      <span className="text-sm font-bold">{formatCOP(r.total)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Por fase */}
          {resumenFase.length > 0 && (
            <div className="card p-4">
              <h4 className="font-semibold text-sm mb-3">Por fase del cultivo</h4>
              <div className="space-y-2">
                {resumenFase.map((r) => {
                  const fase = FASES.find((f) => f.value === r.fase);
                  return (
                    <div key={r.fase} className="flex items-center justify-between">
                      <span className="text-sm text-tierra-700">{fase?.label || r.fase}</span>
                      <div className="text-right">
                        <span className="text-sm font-bold">{formatCOP(r.total)}</span>
                        <span className="text-[10px] text-tierra-400 ml-2">{r.cantidad_registros} items</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {resumenTipo.length === 0 && resumenFase.length === 0 && (
            <p className="text-center text-tierra-400 py-10 text-sm">Sin datos para mostrar</p>
          )}
        </div>
      )}

      {/* ═══ MODAL ═══ */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}
        title={editing ? 'Editar insumo' : 'Registrar insumo'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Tipo *</label>
              <select name="tipo" value={form.tipo} onChange={handleChange}
                className="input-field appearance-none cursor-pointer">
                {TIPOS_INSUMO.map((t) => (
                  <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Fase del cultivo</label>
              <select name="fase" value={form.fase} onChange={handleChange}
                className="input-field appearance-none cursor-pointer">
                {FASES.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="label">Nombre del producto *</label>
            <input name="nombre" value={form.nombre} onChange={handleChange}
              className="input-field" placeholder="Ej: Fertilizante 10-30-10, Semilla Pastusa" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Marca</label>
              <input name="marca" value={form.marca} onChange={handleChange}
                className="input-field" placeholder="Opcional" />
            </div>
            <div>
              <label className="label">Proveedor</label>
              <input name="proveedor" value={form.proveedor} onChange={handleChange}
                className="input-field" placeholder="Opcional" />
            </div>
          </div>

          <div>
            <label className="label">Fecha *</label>
            <input name="fecha" type="date" value={form.fecha} onChange={handleChange} className="input-field" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Cantidad *</label>
              <input name="cantidad" type="number" step="0.01" min="0" value={form.cantidad}
                onChange={handleChange} className="input-field" placeholder="Ej: 50" />
            </div>
            <div>
              <label className="label">Unidad</label>
              <select name="unidad" value={form.unidad} onChange={handleChange}
                className="input-field appearance-none cursor-pointer">
                <option value="kg">kg</option>
                <option value="bulto">Bultos</option>
                <option value="litro">Litros</option>
                <option value="unidad">Unidades</option>
                <option value="tonelada">Toneladas</option>
              </select>
            </div>
            <div>
              <label className="label">$/unidad *</label>
              <input name="valor_unitario" type="number" step="100" min="0" value={form.valor_unitario}
                onChange={handleChange} className="input-field" />
            </div>
          </div>

          {/* Total calculado */}
          <div className="bg-campo-50 rounded-xl px-4 py-3 flex items-center justify-between">
            <span className="text-sm text-campo-700">Valor total:</span>
            <span className="font-bold text-campo-800 text-lg">{formatCOP(form.valor_total || 0)}</span>
          </div>

          <div>
            <label className="label">Notas</label>
            <textarea name="notas" value={form.notas || ''} onChange={handleChange}
              className="input-field" rows={2} placeholder="Observaciones..." />
          </div>

          <button type="submit" disabled={saving} className="btn-primary w-full text-center">
            {saving ? 'Guardando...' : editing ? 'Actualizar' : 'Registrar insumo'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
