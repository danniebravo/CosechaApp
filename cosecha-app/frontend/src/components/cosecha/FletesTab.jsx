import { useState, useEffect } from 'react';
import { fletesAPI } from '../../services/api';
import { Modal } from '../ui';
import { formatCOP, formatDate, formatDateInput } from '../../utils/helpers';
import { Truck, Plus, Trash2, Edit2, BarChart3, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';

const emptyForm = {
  fecha: '', descripcion: '', origen: '', destino: '',
  cantidad_bultos: '', cantidad_kilos: '', valor_por_bulto: '', valor_total: '',
  transportista: '', vehiculo: '', notas: '',
};

export default function FletesTab({ cosechaId, onCostChange }) {
  const [fletes, setFletes] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...emptyForm, cosecha_id: cosechaId });
  const [calcMode, setCalcMode] = useState('manual'); // 'manual' | 'por_bulto'
  const [saving, setSaving] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [list, resum] = await Promise.all([
        fletesAPI.listar(cosechaId),
        fletesAPI.resumen(cosechaId),
      ]);
      setFletes(list);
      setResumen(resum);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, [cosechaId]);

  const openModal = (item = null) => {
    if (item) {
      setForm({ ...item, fecha: formatDateInput(item.fecha) });
      setEditing(item);
      setCalcMode(parseFloat(item.valor_por_bulto) > 0 ? 'por_bulto' : 'manual');
    } else {
      setForm({ ...emptyForm, cosecha_id: cosechaId, fecha: new Date().toISOString().split('T')[0] });
      setEditing(null);
      setCalcMode('manual');
    }
    setModalOpen(true);
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    const val = type === 'number' ? (value === '' ? '' : parseFloat(value)) : value;
    setForm((p) => {
      const next = { ...p, [name]: val };
      // Auto-calcular total cuando es por bulto
      if (calcMode === 'por_bulto' && (name === 'cantidad_bultos' || name === 'valor_por_bulto')) {
        const bultos = name === 'cantidad_bultos' ? (parseFloat(value) || 0) : (parseFloat(p.cantidad_bultos) || 0);
        const ppb = name === 'valor_por_bulto' ? (parseFloat(value) || 0) : (parseFloat(p.valor_por_bulto) || 0);
        next.valor_total = bultos * ppb;
      }
      return next;
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.fecha || !form.valor_total) {
      toast.error('Fecha y valor total requeridos'); return;
    }
    setSaving(true);
    try {
      if (editing) {
        await fletesAPI.actualizar(editing.id, form);
        toast.success('Flete actualizado');
      } else {
        await fletesAPI.crear(form);
        toast.success('Flete registrado');
      }
      setModalOpen(false);
      fetchAll();
      onCostChange?.();
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try {
      await fletesAPI.eliminar(id);
      toast.success('Flete eliminado');
      fetchAll();
      onCostChange?.();
    } catch (err) { toast.error(err.message); }
  };

  const totalFletes = fletes.reduce((s, f) => s + parseFloat(f.valor_total || 0), 0);
  const totalBultos = fletes.reduce((s, f) => s + parseFloat(f.cantidad_bultos || 0), 0);
  const totalViajes = fletes.length;

  if (loading) return <div className="text-center py-10 text-tierra-400 text-sm">Cargando...</div>;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-bold text-base flex items-center gap-2">
          <Truck className="w-5 h-5 text-tierra-600" /> Fletes y transporte
        </h3>
        <button onClick={() => openModal()} className="btn-primary text-xs flex items-center gap-1">
          <Plus className="w-3.5 h-3.5" /> Flete
        </button>
      </div>

      {/* Resumen cards */}
      {fletes.length > 0 && (
        <div className="grid grid-cols-1 xs:grid-cols-3 gap-3 mb-4">
          <div className="bg-tierra-50 rounded-xl px-4 py-3 text-center">
            <p className="text-[10px] text-tierra-400 uppercase font-medium">Viajes</p>
            <p className="font-bold text-lg text-tierra-900">{totalViajes}</p>
          </div>
          <div className="bg-tierra-50 rounded-xl px-4 py-3 text-center">
            <p className="text-[10px] text-tierra-400 uppercase font-medium">Bultos</p>
            <p className="font-bold text-lg text-tierra-900">{totalBultos}</p>
          </div>
          <div className="bg-campo-50 rounded-xl px-4 py-3 text-center">
            <p className="text-[10px] text-campo-500 uppercase font-medium">Total</p>
            <p className="font-bold text-lg text-campo-800">{formatCOP(totalFletes)}</p>
          </div>
        </div>
      )}

      {/* Lista */}
      {fletes.length === 0 ? (
        <div className="text-center py-10">
          <Truck className="w-12 h-12 text-tierra-300 mx-auto mb-3" />
          <p className="text-tierra-500 text-sm mb-1">Sin fletes registrados</p>
          <p className="text-tierra-400 text-xs mb-4">Registra el transporte de papa: tractor, camion, etc.</p>
          <button onClick={() => openModal()} className="btn-primary text-sm">Registrar flete</button>
        </div>
      ) : (
        <div className="space-y-2">
          {fletes.map((f) => (
            <div key={f.id} className="card p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-tierra-50 rounded-xl flex items-center justify-center shrink-0">
                <Truck className="w-5 h-5 text-tierra-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">
                  {f.descripcion || `Flete ${formatDate(f.fecha)}`}
                </p>
                <p className="text-xs text-tierra-400">
                  {formatDate(f.fecha)}
                  {parseFloat(f.cantidad_bultos) > 0 && ` · ${f.cantidad_bultos} bultos`}
                  {parseFloat(f.cantidad_kilos) > 0 && ` · ${f.cantidad_kilos} kg`}
                  {f.transportista && ` · ${f.transportista}`}
                </p>
                {(f.origen || f.destino) && (
                  <p className="text-[10px] text-tierra-300 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3" />
                    {[f.origen, f.destino].filter(Boolean).join(' → ')}
                  </p>
                )}
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-tierra-800">{formatCOP(f.valor_total)}</p>
                {parseFloat(f.valor_por_bulto) > 0 && (
                  <p className="text-[10px] text-tierra-400">{formatCOP(f.valor_por_bulto)}/bulto</p>
                )}
              </div>
              <button onClick={() => openModal(f)} className="p-1.5 hover:bg-tierra-100 rounded-lg">
                <Edit2 className="w-3.5 h-3.5 text-tierra-400" />
              </button>
              <button onClick={() => handleDelete(f.id)} className="p-1.5 hover:bg-red-50 rounded-lg">
                <Trash2 className="w-3.5 h-3.5 text-red-400" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ═══ MODAL ═══ */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}
        title={editing ? 'Editar flete' : 'Registrar flete'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="label">Fecha *</label>
            <input name="fecha" type="date" value={form.fecha} onChange={handleChange} className="input-field" />
          </div>

          <div>
            <label className="label">Descripcion</label>
            <input name="descripcion" value={form.descripcion} onChange={handleChange}
              className="input-field" placeholder="Ej: Transporte de papa al centro de acopio" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Origen</label>
              <input name="origen" value={form.origen} onChange={handleChange}
                className="input-field" placeholder="Ej: Finca El Porvenir" />
            </div>
            <div>
              <label className="label">Destino</label>
              <input name="destino" value={form.destino} onChange={handleChange}
                className="input-field" placeholder="Ej: Centro de acopio" />
            </div>
          </div>

          {/* Modo de calculo */}
          <div>
            <label className="label">Como calcular el costo?</label>
            <div className="flex gap-2">
              <button type="button" onClick={() => setCalcMode('manual')}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium border transition-all ${
                  calcMode === 'manual' ? 'bg-campo-50 border-campo-400 text-campo-700' : 'border-tierra-200 text-tierra-500'
                }`}>
                Valor fijo por viaje
              </button>
              <button type="button" onClick={() => setCalcMode('por_bulto')}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium border transition-all ${
                  calcMode === 'por_bulto' ? 'bg-campo-50 border-campo-400 text-campo-700' : 'border-tierra-200 text-tierra-500'
                }`}>
                Por bulto transportado
              </button>
            </div>
          </div>

          {calcMode === 'por_bulto' ? (
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="label">Bultos *</label>
                <input name="cantidad_bultos" type="number" min="0" value={form.cantidad_bultos}
                  onChange={handleChange} className="input-field" placeholder="200" />
              </div>
              <div>
                <label className="label">$/bulto *</label>
                <input name="valor_por_bulto" type="number" step="100" min="0" value={form.valor_por_bulto}
                  onChange={handleChange} className="input-field" placeholder="1500" />
              </div>
              <div>
                <label className="label">Total</label>
                <div className="input-field bg-tierra-50 font-bold text-campo-700">
                  {formatCOP(form.valor_total || 0)}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label">Bultos transportados</label>
                <input name="cantidad_bultos" type="number" min="0" value={form.cantidad_bultos}
                  onChange={handleChange} className="input-field" placeholder="Opcional" />
              </div>
              <div>
                <label className="label">Valor total ($) *</label>
                <input name="valor_total" type="number" step="1000" min="0" value={form.valor_total}
                  onChange={handleChange} className="input-field" placeholder="Ej: 300000" />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Transportista</label>
              <input name="transportista" value={form.transportista} onChange={handleChange}
                className="input-field" placeholder="Nombre del conductor" />
            </div>
            <div>
              <label className="label">Vehiculo</label>
              <input name="vehiculo" value={form.vehiculo} onChange={handleChange}
                className="input-field" placeholder="Ej: Tractor, Camion" />
            </div>
          </div>

          <div>
            <label className="label">Notas</label>
            <textarea name="notas" value={form.notas || ''} onChange={handleChange}
              className="input-field" rows={2} placeholder="Observaciones..." />
          </div>

          {/* Total final */}
          <div className="bg-campo-50 rounded-xl px-4 py-3 flex items-center justify-between">
            <span className="text-sm text-campo-700">Costo del flete:</span>
            <span className="font-bold text-campo-800 text-lg">{formatCOP(form.valor_total || 0)}</span>
          </div>

          <button type="submit" disabled={saving} className="btn-primary w-full text-center">
            {saving ? 'Guardando...' : editing ? 'Actualizar' : 'Registrar flete'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
