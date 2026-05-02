import { useState, useEffect } from 'react';
import { empaquesAPI, procesosAPI } from '../../services/api';
import { Modal } from '../ui';
import { formatCOP, formatDate, formatDateInput } from '../../utils/helpers';
import { Box, Wrench, Plus, Trash2, Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';

// ── Empaques ──
const TIPOS_EMPAQUE = [
  { value: 'saco', label: 'Saco / Costal', icon: '🛍️' },
  { value: 'cabulla', label: 'Cabulla / Fibra', icon: '🧵' },
  { value: 'bolsa_plastica', label: 'Bolsa plastica', icon: '🛒' },
  { value: 'otro', label: 'Otro empaque', icon: '📦' },
];

// ── Procesos ──
const TIPOS_PROCESO = [
  { value: 'melgar', label: 'Melgar (hacer surcos)', icon: '🔲' },
  { value: 'arada', label: 'Arada', icon: '🚜' },
  { value: 'surcada', label: 'Surcada', icon: '〰️' },
  { value: 'desinfeccion', label: 'Desinfeccion de suelo', icon: '🧹' },
  { value: 'tapada', label: 'Tapada', icon: '🏔️' },
  { value: 'aporque', label: 'Aporque', icon: '⛏️' },
  { value: 'otro', label: 'Otro proceso', icon: '📋' },
];

const emptyEmpaque = { tipo: 'saco', descripcion: '', cantidad: '', valor_unitario: '', valor_total: '', fecha: '' };
const emptyProceso = { tipo: 'arada', fecha: '', descripcion: '', duracion_horas: '', costo: '', responsable: '', maquinaria_usada: '' };

export default function EmpaquesYProcesosTab({ cosechaId, onCostChange }) {
  const [section, setSection] = useState('empaques'); // 'empaques' | 'procesos'

  // Empaques
  const [empaques, setEmpaques] = useState([]);
  const [empaqueModal, setEmpaqueModal] = useState(false);
  const [editingEmpaque, setEditingEmpaque] = useState(null);
  const [empaqueForm, setEmpaqueForm] = useState({ ...emptyEmpaque, cosecha_id: cosechaId });

  // Procesos
  const [procesos, setProcesos] = useState([]);
  const [procesoModal, setProcesoModal] = useState(false);
  const [editingProceso, setEditingProceso] = useState(null);
  const [procesoForm, setProcesoForm] = useState({ ...emptyProceso, cosecha_id: cosechaId });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [emp, proc] = await Promise.all([
        empaquesAPI.listar(cosechaId),
        procesosAPI.listar(cosechaId),
      ]);
      setEmpaques(emp);
      setProcesos(proc);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, [cosechaId]);

  // ── Empaques handlers ──
  const openEmpaque = (item = null) => {
    if (item) {
      setEmpaqueForm({ ...item, fecha: formatDateInput(item.fecha) });
      setEditingEmpaque(item);
    } else {
      setEmpaqueForm({ ...emptyEmpaque, cosecha_id: cosechaId, fecha: new Date().toISOString().split('T')[0] });
      setEditingEmpaque(null);
    }
    setEmpaqueModal(true);
  };

  const onEmpaqueChange = (e) => {
    const { name, value, type } = e.target;
    const val = type === 'number' ? (value === '' ? '' : parseFloat(value)) : value;
    setEmpaqueForm((p) => {
      const next = { ...p, [name]: val };
      if (name === 'cantidad' || name === 'valor_unitario') {
        const c = name === 'cantidad' ? (parseFloat(value) || 0) : (parseFloat(p.cantidad) || 0);
        const v = name === 'valor_unitario' ? (parseFloat(value) || 0) : (parseFloat(p.valor_unitario) || 0);
        next.valor_total = c * v;
      }
      return next;
    });
  };

  const saveEmpaque = async (e) => {
    e.preventDefault();
    if (!empaqueForm.descripcion.trim() || !empaqueForm.cantidad) {
      toast.error('Descripcion y cantidad requeridos'); return;
    }
    setSaving(true);
    try {
      if (editingEmpaque) await empaquesAPI.actualizar(editingEmpaque.id, empaqueForm);
      else await empaquesAPI.crear(empaqueForm);
      toast.success(editingEmpaque ? 'Actualizado' : 'Registrado');
      setEmpaqueModal(false); fetchAll(); onCostChange?.();
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const deleteEmpaque = async (id) => {
    try { await empaquesAPI.eliminar(id); toast.success('Eliminado'); fetchAll(); onCostChange?.(); }
    catch (err) { toast.error(err.message); }
  };

  // ── Procesos handlers ──
  const openProceso = (item = null) => {
    if (item) {
      setProcesoForm({ ...item, fecha: formatDateInput(item.fecha) });
      setEditingProceso(item);
    } else {
      setProcesoForm({ ...emptyProceso, cosecha_id: cosechaId, fecha: new Date().toISOString().split('T')[0] });
      setEditingProceso(null);
    }
    setProcesoModal(true);
  };

  const onProcesoChange = (e) => {
    const { name, value, type } = e.target;
    setProcesoForm((p) => ({ ...p, [name]: type === 'number' ? (value === '' ? '' : parseFloat(value)) : value }));
  };

  const saveProceso = async (e) => {
    e.preventDefault();
    if (!procesoForm.fecha || procesoForm.costo === '') {
      toast.error('Fecha y costo requeridos'); return;
    }
    setSaving(true);
    try {
      if (editingProceso) await procesosAPI.actualizar(editingProceso.id, procesoForm);
      else await procesosAPI.crear(procesoForm);
      toast.success(editingProceso ? 'Actualizado' : 'Registrado');
      setProcesoModal(false); fetchAll(); onCostChange?.();
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const deleteProceso = async (id) => {
    try { await procesosAPI.eliminar(id); toast.success('Eliminado'); fetchAll(); onCostChange?.(); }
    catch (err) { toast.error(err.message); }
  };

  const totalEmpaques = empaques.reduce((s, e) => s + parseFloat(e.valor_total || 0), 0);
  const totalProcesos = procesos.reduce((s, p) => s + parseFloat(p.costo || 0), 0);

  if (loading) return <div className="text-center py-10 text-tierra-400 text-sm">Cargando...</div>;

  return (
    <div>
      {/* Sub-nav */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-1">
          <button onClick={() => setSection('empaques')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              section === 'empaques' ? 'bg-campo-100 text-campo-700' : 'text-tierra-500 hover:bg-tierra-50'
            }`}>
            <Box className="w-3.5 h-3.5" /> Empaques
            {empaques.length > 0 && <span className="bg-tierra-200 text-tierra-700 text-[10px] px-1.5 rounded-full">{empaques.length}</span>}
          </button>
          <button onClick={() => setSection('procesos')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              section === 'procesos' ? 'bg-campo-100 text-campo-700' : 'text-tierra-500 hover:bg-tierra-50'
            }`}>
            <Wrench className="w-3.5 h-3.5" /> Procesos
            {procesos.length > 0 && <span className="bg-tierra-200 text-tierra-700 text-[10px] px-1.5 rounded-full">{procesos.length}</span>}
          </button>
        </div>
        <button onClick={() => section === 'empaques' ? openEmpaque() : openProceso()}
          className="btn-primary text-xs flex items-center gap-1">
          <Plus className="w-3.5 h-3.5" /> {section === 'empaques' ? 'Empaque' : 'Proceso'}
        </button>
      </div>

      {/* Totales */}
      <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 mb-4">
        <div className="bg-tierra-50 rounded-xl px-4 py-2.5 flex items-center justify-between">
          <span className="text-xs text-tierra-500">Empaques:</span>
          <span className="font-bold text-sm">{formatCOP(totalEmpaques)}</span>
        </div>
        <div className="bg-tierra-50 rounded-xl px-4 py-2.5 flex items-center justify-between">
          <span className="text-xs text-tierra-500">Procesos:</span>
          <span className="font-bold text-sm">{formatCOP(totalProcesos)}</span>
        </div>
      </div>

      {/* ═══ EMPAQUES ═══ */}
      {section === 'empaques' && (
        empaques.length === 0 ? (
          <div className="text-center py-10">
            <Box className="w-12 h-12 text-tierra-300 mx-auto mb-3" />
            <p className="text-tierra-500 text-sm mb-1">Sin empaques registrados</p>
            <p className="text-tierra-400 text-xs mb-4">Sacos, cabulla, bolsas plasticas y mas</p>
            <button onClick={() => openEmpaque()} className="btn-primary text-sm">Registrar empaque</button>
          </div>
        ) : (
          <div className="space-y-2">
            {empaques.map((e) => {
              const tipo = TIPOS_EMPAQUE.find((t) => t.value === e.tipo);
              return (
                <div key={e.id} className="card p-4 flex items-center gap-3">
                  <span className="text-xl shrink-0">{tipo?.icon || '📦'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{e.descripcion}</p>
                    <p className="text-xs text-tierra-400">
                      {tipo?.label} · {e.cantidad} uds x {formatCOP(e.valor_unitario)} · {formatDate(e.fecha)}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-tierra-800 shrink-0">{formatCOP(e.valor_total)}</span>
                  <button onClick={() => openEmpaque(e)} className="p-1.5 hover:bg-tierra-100 rounded-lg">
                    <Edit2 className="w-3.5 h-3.5 text-tierra-400" /></button>
                  <button onClick={() => deleteEmpaque(e.id)} className="p-1.5 hover:bg-red-50 rounded-lg">
                    <Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* ═══ PROCESOS ═══ */}
      {section === 'procesos' && (
        procesos.length === 0 ? (
          <div className="text-center py-10">
            <Wrench className="w-12 h-12 text-tierra-300 mx-auto mb-3" />
            <p className="text-tierra-500 text-sm mb-1">Sin procesos registrados</p>
            <p className="text-tierra-400 text-xs mb-4">Melgar, arada, surcada, aporque y mas</p>
            <button onClick={() => openProceso()} className="btn-primary text-sm">Registrar proceso</button>
          </div>
        ) : (
          <div className="space-y-2">
            {procesos.map((p) => {
              const tipo = TIPOS_PROCESO.find((t) => t.value === p.tipo);
              return (
                <div key={p.id} className="card p-4 flex items-center gap-3">
                  <span className="text-xl shrink-0">{tipo?.icon || '📋'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{tipo?.label || p.tipo}</p>
                    <p className="text-xs text-tierra-400">
                      {formatDate(p.fecha)}
                      {p.duracion_horas && ` · ${p.duracion_horas}h`}
                      {p.responsable && ` · ${p.responsable}`}
                      {p.maquinaria_usada && ` · ${p.maquinaria_usada}`}
                    </p>
                    {p.descripcion && <p className="text-[10px] text-tierra-300 truncate">{p.descripcion}</p>}
                  </div>
                  <span className="text-sm font-bold text-tierra-800 shrink-0">{formatCOP(p.costo)}</span>
                  <button onClick={() => openProceso(p)} className="p-1.5 hover:bg-tierra-100 rounded-lg">
                    <Edit2 className="w-3.5 h-3.5 text-tierra-400" /></button>
                  <button onClick={() => deleteProceso(p.id)} className="p-1.5 hover:bg-red-50 rounded-lg">
                    <Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* ═══ MODAL EMPAQUE ═══ */}
      <Modal isOpen={empaqueModal} onClose={() => setEmpaqueModal(false)}
        title={editingEmpaque ? 'Editar empaque' : 'Registrar empaque'} maxWidth="max-w-md">
        <form onSubmit={saveEmpaque} className="space-y-4">
          <div>
            <label className="label">Tipo *</label>
            <select name="tipo" value={empaqueForm.tipo} onChange={onEmpaqueChange}
              className="input-field appearance-none cursor-pointer">
              {TIPOS_EMPAQUE.map((t) => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Descripcion *</label>
            <input name="descripcion" value={empaqueForm.descripcion} onChange={onEmpaqueChange}
              className="input-field" placeholder="Ej: Sacos de fique 50kg, Paca de 500" />
          </div>
          <div>
            <label className="label">Fecha *</label>
            <input name="fecha" type="date" value={empaqueForm.fecha} onChange={onEmpaqueChange} className="input-field" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Cantidad *</label>
              <input name="cantidad" type="number" min="1" value={empaqueForm.cantidad}
                onChange={onEmpaqueChange} className="input-field" placeholder="500" />
            </div>
            <div>
              <label className="label">$/unidad *</label>
              <input name="valor_unitario" type="number" step="10" min="0" value={empaqueForm.valor_unitario}
                onChange={onEmpaqueChange} className="input-field" placeholder="200" />
            </div>
            <div>
              <label className="label">Total</label>
              <div className="input-field bg-tierra-50 font-bold text-campo-700">
                {formatCOP(empaqueForm.valor_total || 0)}
              </div>
            </div>
          </div>
          <button type="submit" disabled={saving} className="btn-primary w-full text-center">
            {saving ? 'Guardando...' : editingEmpaque ? 'Actualizar' : 'Registrar'}
          </button>
        </form>
      </Modal>

      {/* ═══ MODAL PROCESO ═══ */}
      <Modal isOpen={procesoModal} onClose={() => setProcesoModal(false)}
        title={editingProceso ? 'Editar proceso' : 'Registrar proceso'} maxWidth="max-w-md">
        <form onSubmit={saveProceso} className="space-y-4">
          <div>
            <label className="label">Tipo de proceso *</label>
            <select name="tipo" value={procesoForm.tipo} onChange={onProcesoChange}
              className="input-field appearance-none cursor-pointer">
              {TIPOS_PROCESO.map((t) => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Fecha *</label>
            <input name="fecha" type="date" value={procesoForm.fecha} onChange={onProcesoChange} className="input-field" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Costo ($) *</label>
              <input name="costo" type="number" step="1000" min="0" value={procesoForm.costo}
                onChange={onProcesoChange} className="input-field" placeholder="Ej: 500000" />
            </div>
            <div>
              <label className="label">Duracion (horas)</label>
              <input name="duracion_horas" type="number" step="0.5" min="0" value={procesoForm.duracion_horas}
                onChange={onProcesoChange} className="input-field" placeholder="Ej: 8" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Responsable</label>
              <input name="responsable" value={procesoForm.responsable} onChange={onProcesoChange}
                className="input-field" placeholder="Quien lo hizo" />
            </div>
            <div>
              <label className="label">Maquinaria</label>
              <input name="maquinaria_usada" value={procesoForm.maquinaria_usada} onChange={onProcesoChange}
                className="input-field" placeholder="Ej: Tractor John Deere" />
            </div>
          </div>
          <div>
            <label className="label">Descripcion</label>
            <textarea name="descripcion" value={procesoForm.descripcion || ''} onChange={onProcesoChange}
              className="input-field" rows={2} placeholder="Detalles del proceso..." />
          </div>
          <button type="submit" disabled={saving} className="btn-primary w-full text-center">
            {saving ? 'Guardando...' : editingProceso ? 'Actualizar' : 'Registrar'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
