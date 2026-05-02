import { useState, lazy, Suspense } from 'react';
import { useApi } from '../hooks/useApi';
import { fincasAPI } from '../services/api';
import { useColombiaData } from '../hooks/useColombiaData';
import { PageHeader, LoadingPage, ErrorMsg, EmptyState, Modal, ConfirmDialog, Spinner } from '../components/ui';
import { MapPin, Plus, Edit2, Trash2, ChevronRight, Mountain, Navigation } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';

const MapaPicker = lazy(() => import('../components/MapaPicker'));

const emptyFinca = {
  nombre: '', ubicacion: '', municipio: '', departamento: '',
  area_total: '', altitud: '', notas: '', latitud: null, longitud: null,
};

export default function FincasPage() {
  const navigate = useNavigate();
  const { data: fincas, loading, error, refetch } = useApi(() => fincasAPI.listar(), []);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [values, setValues] = useState(emptyFinca);
  const [saving, setSaving] = useState(false);

  // Datos de Colombia encadenados
  const { departamentos, municipios } = useColombiaData(values.departamento);

  const handleChange = (e) => {
    const { name, value, type } = e.target;

    if (name === 'departamento') {
      // Cambiar departamento → limpiar municipio
      setValues((prev) => ({ ...prev, departamento: value, municipio: '' }));
    } else {
      setValues((prev) => ({
        ...prev,
        [name]: type === 'number' ? (value === '' ? '' : parseFloat(value)) : value,
      }));
    }
  };

  const openNew = () => { setValues(emptyFinca); setEditing(null); setModalOpen(true); };
  const openEdit = (f) => {
    setValues({
      nombre: f.nombre || '', ubicacion: f.ubicacion || '',
      municipio: f.municipio || '', departamento: f.departamento || '',
      area_total: f.area_total || '', altitud: f.altitud || '', notas: f.notas || '',
      latitud: f.latitud || null, longitud: f.longitud || null,
    });
    setEditing(f);
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!values.nombre.trim()) { toast.error('Nombre requerido'); return; }
    if (!values.departamento) { toast.error('Selecciona un departamento'); return; }
    if (!values.municipio) { toast.error('Selecciona un municipio'); return; }
    setSaving(true);
    try {
      if (editing) {
        await fincasAPI.actualizar(editing.id, values);
        toast.success('Finca actualizada');
      } else {
        await fincasAPI.crear(values);
        toast.success('Finca creada');
      }
      setModalOpen(false); refetch();
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try {
      await fincasAPI.eliminar(deleteTarget.id);
      toast.success('Finca eliminada');
      setDeleteTarget(null); refetch();
    } catch (err) { toast.error(err.message); }
  };

  if (loading) return <LoadingPage />;
  if (error) return <ErrorMsg message={error} onRetry={refetch} />;

  return (
    <div className="animate-fade-in">
      <Toaster position="top-center" />
      <PageHeader title="Mis Fincas" subtitle={`${fincas?.length || 0} fincas registradas`}
        action={<button onClick={openNew} className="btn-primary text-sm flex items-center gap-1.5"><Plus className="w-4 h-4" /> Nueva</button>} />

      {(!fincas || fincas.length === 0) ? (
        <EmptyState icon={MapPin} title="No tienes fincas" description="Registra tu primera finca para comenzar."
          action={<button onClick={openNew} className="btn-primary text-sm">Crear finca</button>} />
      ) : (
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
          {fincas.map(f => (
            <div key={f.id} className="card p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-campo-50 rounded-xl flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-campo-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{f.nombre}</h3>
                    <p className="text-xs text-tierra-400">{[f.municipio, f.departamento].filter(Boolean).join(', ') || f.ubicacion || 'Sin ubicacion'}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(f)} className="p-1.5 hover:bg-tierra-100 rounded-lg"><Edit2 className="w-4 h-4 text-tierra-500" /></button>
                  <button onClick={() => setDeleteTarget(f)} className="p-1.5 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4 text-red-400" /></button>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-tierra-500 mb-3">
                {f.area_total && <span>{f.area_total} ha</span>}
                {f.altitud && <span className="flex items-center gap-1"><Mountain className="w-3 h-3" />{f.altitud} msnm</span>}
                {f.latitud && f.longitud && (
                  <span className="flex items-center gap-1 text-campo-600"><Navigation className="w-3 h-3" />Georeferenciada</span>
                )}
              </div>
              <button onClick={() => navigate(`/fincas/${f.id}`)}
                className="flex items-center gap-1 text-campo-600 text-xs font-medium hover:underline">
                Ver lotes <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal crear/editar */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar finca' : 'Nueva finca'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="label">Nombre *</label>
            <input name="nombre" value={values.nombre} onChange={handleChange}
              className="input-field" placeholder="Nombre de la finca" />
          </div>

          {/* Departamento */}
          <div>
            <label className="label">Departamento *</label>
            <select name="departamento" value={values.departamento} onChange={handleChange}
              className="input-field appearance-none cursor-pointer">
              <option value="">Seleccionar departamento...</option>
              {departamentos.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          {/* Municipio */}
          <div>
            <label className="label">Municipio *</label>
            <select name="municipio" value={values.municipio} onChange={handleChange}
              className={`input-field appearance-none cursor-pointer ${!values.departamento ? 'opacity-50' : ''}`}
              disabled={!values.departamento}>
              <option value="">
                {values.departamento ? 'Seleccionar municipio...' : 'Primero selecciona un departamento'}
              </option>
              {municipios.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          <div>
            <label className="label">Vereda / Ubicacion</label>
            <input name="ubicacion" value={values.ubicacion} onChange={handleChange}
              className="input-field" placeholder="Ej: Vereda El Salitre" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Area (ha)</label>
              <input name="area_total" type="number" step="0.01" value={values.area_total}
                onChange={handleChange} className="input-field" placeholder="Ej: 3.5" />
            </div>
            <div>
              <label className="label">Altitud (msnm)</label>
              <input name="altitud" type="number" value={values.altitud}
                onChange={handleChange} className="input-field" placeholder="Ej: 2800" />
            </div>
          </div>

          {/* Mapa de ubicación */}
          <div>
            <label className="label">Ubicacion en el mapa</label>
            <p className="text-xs text-tierra-400 mb-2">Haz clic en el mapa para marcar tu finca</p>
            <Suspense fallback={<div className="h-[220px] rounded-xl bg-tierra-100 animate-pulse flex items-center justify-center"><Spinner size="sm" /></div>}>
              <MapaPicker
                lat={values.latitud ? parseFloat(values.latitud) : null}
                lng={values.longitud ? parseFloat(values.longitud) : null}
                onSelect={({ lat, lng }) => setValues((prev) => ({ ...prev, latitud: lat, longitud: lng }))}
                height="220px"
              />
            </Suspense>
          </div>

          <div>
            <label className="label">Notas</label>
            <textarea name="notas" value={values.notas} onChange={handleChange}
              className="input-field" rows={2} placeholder="Notas adicionales..." />
          </div>

          <button type="submit" disabled={saving} className="btn-primary w-full text-center">
            {saving ? 'Guardando...' : editing ? 'Actualizar' : 'Crear finca'}
          </button>
        </form>
      </Modal>

      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title="Eliminar finca" message={`Eliminar "${deleteTarget?.nombre}"? Se eliminaran sus lotes y cosechas.`} />
    </div>
  );
}
