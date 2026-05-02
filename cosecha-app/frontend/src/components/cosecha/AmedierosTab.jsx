import { useState, useEffect } from 'react';
import { amedierosAPI } from '../../services/api';
import { Modal } from '../ui';
import { formatCOP } from '../../utils/helpers';
import { Handshake, Plus, Trash2, Edit2, RefreshCw, PieChart, TrendingUp, TrendingDown } from 'lucide-react';
import toast from 'react-hot-toast';

const emptyForm = {
  nombre: '', telefono: '', porcentaje_inversion: '', porcentaje_ganancia: '',
  descripcion_aporte: '', notas: '',
};

export default function AmedierosTab({ cosechaId, cosechaData, onCostChange }) {
  const [amedieros, setAmedieros] = useState([]);
  const [distribucion, setDistribucion] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...emptyForm, cosecha_id: cosechaId });
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState('socios'); // 'socios' | 'distribucion'

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [list, dist] = await Promise.all([
        amedierosAPI.listar(cosechaId),
        amedierosAPI.distribucion(cosechaId),
      ]);
      setAmedieros(list);
      setDistribucion(dist);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, [cosechaId]);

  const openModal = (item = null) => {
    if (item) {
      setForm({
        nombre: item.nombre, telefono: item.telefono || '',
        porcentaje_inversion: item.porcentaje_inversion,
        porcentaje_ganancia: item.porcentaje_ganancia,
        descripcion_aporte: item.descripcion_aporte || '',
        notas: item.notas || '',
        cosecha_id: cosechaId,
      });
      setEditing(item);
    } else {
      setForm({ ...emptyForm, cosecha_id: cosechaId });
      setEditing(null);
    }
    setModalOpen(true);
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setForm((p) => ({
      ...p,
      [name]: type === 'number' ? (value === '' ? '' : parseFloat(value)) : value,
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.nombre.trim()) { toast.error('Nombre requerido'); return; }
    if (!form.porcentaje_inversion && form.porcentaje_inversion !== 0) { toast.error('Porcentaje de inversion requerido'); return; }
    if (!form.porcentaje_ganancia && form.porcentaje_ganancia !== 0) { toast.error('Porcentaje de ganancia requerido'); return; }
    setSaving(true);
    try {
      if (editing) {
        await amedierosAPI.actualizar(editing.id, form);
        toast.success('Amediero actualizado');
      } else {
        await amedierosAPI.crear(form);
        toast.success('Amediero registrado');
      }
      setModalOpen(false);
      fetchAll();
    } catch (err) { toast.error(err.data?.error || err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try {
      await amedierosAPI.eliminar(id);
      toast.success('Amediero eliminado');
      fetchAll();
    } catch (err) { toast.error(err.message); }
  };

  const handleRecalcular = async () => {
    setRecalculating(true);
    try {
      const result = await amedierosAPI.recalcular(cosechaId);
      setAmedieros(result);
      await fetchAll();
      toast.success('Distribucion recalculada');
    } catch (err) { toast.error(err.message); }
    finally { setRecalculating(false); }
  };

  // Calcular totales de porcentajes
  const totalPctInversion = amedieros.reduce((s, a) => s + parseFloat(a.porcentaje_inversion || 0), 0);
  const totalPctGanancia = amedieros.reduce((s, a) => s + parseFloat(a.porcentaje_ganancia || 0), 0);

  // Datos financieros de la cosecha
  const inversion = parseFloat(cosechaData?.costo_total || cosechaData?.inversion_total || 0);
  const ingresos = parseFloat(cosechaData?.ingreso_total || 0);
  const utilidad = ingresos - inversion;

  if (loading) return <div className="text-center py-10 text-tierra-400 text-sm">Cargando...</div>;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-1">
          <button onClick={() => setView('socios')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              view === 'socios' ? 'bg-campo-100 text-campo-700' : 'text-tierra-500 hover:bg-tierra-50'
            }`}>
            <Handshake className="w-3.5 h-3.5" /> Socios
          </button>
          <button onClick={() => setView('distribucion')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              view === 'distribucion' ? 'bg-campo-100 text-campo-700' : 'text-tierra-500 hover:bg-tierra-50'
            }`}>
            <PieChart className="w-3.5 h-3.5" /> Distribucion
          </button>
        </div>
        <div className="flex gap-1.5">
          {amedieros.length > 0 && (
            <button onClick={handleRecalcular} disabled={recalculating}
              className="btn-secondary text-xs flex items-center gap-1">
              <RefreshCw className={`w-3.5 h-3.5 ${recalculating ? 'animate-spin' : ''}`} /> Recalcular
            </button>
          )}
          {view === 'socios' && (
            <button onClick={() => openModal()} className="btn-primary text-xs flex items-center gap-1">
              <Plus className="w-3.5 h-3.5" /> Socio
            </button>
          )}
        </div>
      </div>

      {/* Barra de porcentajes */}
      {amedieros.length > 0 && (
        <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 mb-4">
          <div className={`rounded-xl px-4 py-2.5 ${totalPctInversion > 100 ? 'bg-red-50' : 'bg-tierra-50'}`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-tierra-400 uppercase">Inversion asignada</span>
              <span className={`text-sm font-bold ${totalPctInversion > 100 ? 'text-red-600' : 'text-tierra-800'}`}>
                {totalPctInversion}%
              </span>
            </div>
            <div className="h-1.5 bg-tierra-200 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all ${totalPctInversion > 100 ? 'bg-red-500' : 'bg-campo-500'}`}
                style={{ width: `${Math.min(totalPctInversion, 100)}%` }} />
            </div>
          </div>
          <div className={`rounded-xl px-4 py-2.5 ${totalPctGanancia > 100 ? 'bg-red-50' : 'bg-tierra-50'}`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-tierra-400 uppercase">Ganancia asignada</span>
              <span className={`text-sm font-bold ${totalPctGanancia > 100 ? 'text-red-600' : 'text-tierra-800'}`}>
                {totalPctGanancia}%
              </span>
            </div>
            <div className="h-1.5 bg-tierra-200 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all ${totalPctGanancia > 100 ? 'bg-red-500' : 'bg-cosecha-500'}`}
                style={{ width: `${Math.min(totalPctGanancia, 100)}%` }} />
            </div>
          </div>
        </div>
      )}

      {/* ═══ SOCIOS ═══ */}
      {view === 'socios' && (
        amedieros.length === 0 ? (
          <div className="text-center py-10">
            <Handshake className="w-12 h-12 text-tierra-300 mx-auto mb-3" />
            <p className="text-tierra-500 text-sm mb-1">Sin amedieros / socios</p>
            <p className="text-tierra-400 text-xs mb-4 max-w-sm mx-auto">
              Si esta cosecha es a medias con alguien, registra a los socios para distribuir la inversion y las ganancias.
            </p>
            <button onClick={() => openModal()} className="btn-primary text-sm">Agregar socio</button>
          </div>
        ) : (
          <div className="space-y-2">
            {amedieros.map((a) => (
              <div key={a.id} className="card p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-cosecha-50 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-cosecha-700">{a.nombre.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{a.nombre}</p>
                    {a.descripcion_aporte && <p className="text-xs text-tierra-400 truncate">{a.descripcion_aporte}</p>}
                  </div>
                  <button onClick={() => openModal(a)} className="p-1.5 hover:bg-tierra-100 rounded-lg">
                    <Edit2 className="w-3.5 h-3.5 text-tierra-400" /></button>
                  <button onClick={() => handleDelete(a.id)} className="p-1.5 hover:bg-red-50 rounded-lg">
                    <Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-3 text-center">
                  <div className="bg-tierra-50 rounded-lg px-3 py-2">
                    <p className="text-[10px] text-tierra-400">Inversion</p>
                    <p className="text-sm font-bold text-tierra-800">{a.porcentaje_inversion}%</p>
                    <p className="text-[10px] text-tierra-500">{formatCOP(a.monto_invertido)}</p>
                  </div>
                  <div className={`rounded-lg px-3 py-2 ${parseFloat(a.ganancia_calculada) >= 0 ? 'bg-campo-50' : 'bg-red-50'}`}>
                    <p className="text-[10px] text-tierra-400">Ganancia</p>
                    <p className={`text-sm font-bold ${parseFloat(a.ganancia_calculada) >= 0 ? 'text-campo-700' : 'text-red-600'}`}>
                      {a.porcentaje_ganancia}%
                    </p>
                    <p className={`text-[10px] ${parseFloat(a.ganancia_calculada) >= 0 ? 'text-campo-600' : 'text-red-500'}`}>
                      {formatCOP(a.ganancia_calculada)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* ═══ DISTRIBUCION ═══ */}
      {view === 'distribucion' && (
        <div className="space-y-4">
          {/* Resumen de la cosecha */}
          <div className="card p-4">
            <h4 className="font-semibold text-sm mb-3">Resumen financiero de la cosecha</h4>
            <div className="grid grid-cols-1 xs:grid-cols-3 gap-3">
              <div className="text-center">
                <p className="text-[10px] text-tierra-400 uppercase">Inversion total</p>
                <p className="font-bold text-lg text-tierra-900">{formatCOP(inversion)}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-tierra-400 uppercase">Ingresos</p>
                <p className="font-bold text-lg text-campo-700">{formatCOP(ingresos)}</p>
              </div>
              <div className="text-center">
                <p className={`text-[10px] uppercase ${utilidad >= 0 ? 'text-campo-500' : 'text-red-400'}`}>
                  {utilidad >= 0 ? 'Utilidad' : 'Perdida'}
                </p>
                <p className={`font-bold text-lg flex items-center justify-center gap-1 ${utilidad >= 0 ? 'text-campo-700' : 'text-red-600'}`}>
                  {utilidad >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  {formatCOP(Math.abs(utilidad))}
                </p>
              </div>
            </div>
          </div>

          {/* Distribucion por socio */}
          {distribucion.length > 0 ? (
            <div className="card p-4">
              <h4 className="font-semibold text-sm mb-3">Distribucion entre socios</h4>
              <div className="space-y-4">
                {distribucion.map((d) => {
                  const ganancia = parseFloat(d.ganancia_calculada || 0);
                  const montoInvertido = parseFloat(d.monto_invertido || 0);
                  return (
                    <div key={d.id} className="border-b border-tierra-100 pb-3 last:border-0 last:pb-0">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 bg-cosecha-50 rounded-full flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-cosecha-700">{d.nombre.charAt(0)}</span>
                        </div>
                        <p className="font-semibold text-sm">{d.nombre}</p>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div>
                          <p className="text-tierra-400">Invirtio ({d.porcentaje_inversion}%)</p>
                          <p className="font-bold text-tierra-800">{formatCOP(montoInvertido)}</p>
                        </div>
                        <div>
                          <p className="text-tierra-400">Recibe ({d.porcentaje_ganancia}%)</p>
                          <p className={`font-bold ${ganancia >= 0 ? 'text-campo-700' : 'text-red-600'}`}>
                            {formatCOP(ganancia)}
                          </p>
                        </div>
                        <div>
                          <p className="text-tierra-400">Neto</p>
                          <p className={`font-bold ${(ganancia - montoInvertido) >= 0 ? 'text-campo-700' : 'text-red-600'}`}>
                            {formatCOP(ganancia - montoInvertido)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="text-center text-tierra-400 py-10 text-sm">Agrega socios para ver la distribucion</p>
          )}

          {/* Porcentaje no asignado */}
          {amedieros.length > 0 && (100 - totalPctGanancia) > 0 && (
            <div className="bg-cosecha-50 rounded-xl px-4 py-3 text-sm text-cosecha-800">
              <p className="font-semibold">
                {(100 - totalPctGanancia).toFixed(1)}% de ganancia sin asignar
              </p>
              <p className="text-xs text-cosecha-600 mt-0.5">
                Equivale a {formatCOP(utilidad * (100 - totalPctGanancia) / 100)} de la utilidad actual
              </p>
            </div>
          )}
        </div>
      )}

      {/* ═══ MODAL ═══ */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}
        title={editing ? 'Editar socio' : 'Agregar socio'} maxWidth="max-w-md">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="label">Nombre del socio *</label>
            <input name="nombre" value={form.nombre} onChange={handleChange}
              className="input-field" placeholder="Nombre completo" autoFocus />
          </div>
          <div>
            <label className="label">Telefono</label>
            <input name="telefono" value={form.telefono} onChange={handleChange}
              className="input-field" placeholder="Opcional" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">% Inversion *</label>
              <input name="porcentaje_inversion" type="number" step="0.1" min="0" max="100"
                value={form.porcentaje_inversion} onChange={handleChange}
                className="input-field" placeholder="Ej: 50" />
              <p className="text-[10px] text-tierra-400 mt-1">Cuanto aporta de la inversion</p>
            </div>
            <div>
              <label className="label">% Ganancia *</label>
              <input name="porcentaje_ganancia" type="number" step="0.1" min="0" max="100"
                value={form.porcentaje_ganancia} onChange={handleChange}
                className="input-field" placeholder="Ej: 50" />
              <p className="text-[10px] text-tierra-400 mt-1">Cuanto recibe de la utilidad</p>
            </div>
          </div>

          <div>
            <label className="label">Que aporta?</label>
            <textarea name="descripcion_aporte" value={form.descripcion_aporte} onChange={handleChange}
              className="input-field" rows={2} placeholder="Ej: Pone la semilla y el abono, el otro pone la tierra y la mano de obra" />
          </div>

          <div>
            <label className="label">Notas</label>
            <textarea name="notas" value={form.notas || ''} onChange={handleChange}
              className="input-field" rows={2} placeholder="Observaciones..." />
          </div>

          <button type="submit" disabled={saving} className="btn-primary w-full text-center">
            {saving ? 'Guardando...' : editing ? 'Actualizar' : 'Agregar socio'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
