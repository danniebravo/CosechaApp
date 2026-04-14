import { useState } from 'react';
import { useApi, useForm } from '../hooks/useApi';
import { fincasAPI } from '../services/api';
import { PageHeader, LoadingPage, ErrorMsg, EmptyState, Modal, ConfirmDialog } from '../components/ui';
import MapView from '../components/MapView';
import { getDepartamentos, getMunicipios } from '../utils/colombia';
import { MapPin, Plus, Edit2, Trash2, ChevronRight, Mountain, Map } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';

const emptyFinca = { nombre: '', ubicacion: '', municipio: '', departamento: '', area_total: '', altitud: '', notas: '', latitud: '', longitud: '' };

export default function FincasPage() {
  const navigate = useNavigate();
  const { data: fincas, loading, error, refetch } = useApi(() => fincasAPI.listar(), []);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const { values, handleChange, reset, setValues, setValue } = useForm(emptyFinca);
  const [saving, setSaving] = useState(false);
  const [showMap, setShowMap] = useState(false);

  const departamentos = getDepartamentos();
  const municipios = getMunicipios(values.departamento);

  const openNew = () => { reset(); setEditing(null); setModalOpen(true); };
  const openEdit = (f) => {
    setValues({
      nombre: f.nombre, ubicacion: f.ubicacion || '', municipio: f.municipio || '',
      departamento: f.departamento || '', area_total: f.area_total || '', altitud: f.altitud || '',
      notas: f.notas || '', latitud: f.latitud || '', longitud: f.longitud || '',
    });
    setEditing(f); setModalOpen(true);
  };

  const handleDepartamentoChange = (e) => {
    setValue('departamento', e.target.value);
    setValue('municipio', '');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!values.nombre.trim()) { toast.error('Nombre requerido'); return; }
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
        action={
          <div className="flex gap-2">
            {fincas?.some(f => f.latitud) && (
              <button onClick={() => setShowMap(!showMap)} className="btn-secondary text-sm flex items-center gap-1.5">
                <Map className="w-4 h-4" /> {showMap ? 'Ocultar mapa' : 'Ver mapa'}
              </button>
            )}
            <button onClick={openNew} className="btn-primary text-sm flex items-center gap-1.5"><Plus className="w-4 h-4" /> Nueva</button>
          </div>
        } />

      {showMap && fincas?.some(f => f.latitud) && (
        <div className="mb-4">
          <MapView
            height="350px"
            markers={fincas.filter(f => f.latitud && f.longitud).map(f => ({
              id: f.id, lat: f.latitud, lng: f.longitud,
              name: f.nombre, subtitle: [f.municipio, f.departamento].filter(Boolean).join(', '),
            }))}
          />
        </div>
      )}

      {(!fincas || fincas.length === 0) ? (
        <EmptyState icon={MapPin} title="No tienes fincas" description="Registra tu primera finca para comenzar."
          action={<button onClick={openNew} className="btn-primary text-sm">Crear finca</button>} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
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
              <div className="flex items-center gap-4 text-xs text-tierra-500 mb-3">
                {f.area_total && <span>{f.area_total} ha</span>}
                {f.altitud && <span className="flex items-center gap-1"><Mountain className="w-3 h-3" />{f.altitud} msnm</span>}
              </div>
              <button onClick={() => navigate(`/fincas/${f.id}`)}
                className="flex items-center gap-1 text-campo-600 text-xs font-medium hover:underline">
                Ver lotes <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal crear/editar - mas ancho */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar finca' : 'Nueva finca'} maxWidth="max-w-2xl">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="label">Nombre de la finca *</label>
            <input name="nombre" value={values.nombre} onChange={handleChange} className="input-field" placeholder="Ej: Finca El Porvenir" />
          </div>

          {/* Ubicacion con selects cascading */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Departamento</label>
              <select value={values.departamento} onChange={handleDepartamentoChange} className="input-field">
                <option value="">Seleccionar departamento</option>
                {departamentos.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Municipio</label>
              <select name="municipio" value={values.municipio} onChange={handleChange} className="input-field" disabled={!values.departamento}>
                <option value="">Seleccionar municipio</option>
                {municipios.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="label">Vereda / Ubicacion</label>
            <input name="ubicacion" value={values.ubicacion} onChange={handleChange} className="input-field" placeholder="Ej: Vereda La Esperanza" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Area total (ha)</label>
              <input name="area_total" type="number" step="0.01" value={values.area_total} onChange={handleChange} className="input-field" placeholder="Ej: 5.5" />
            </div>
            <div>
              <label className="label">Altitud (msnm)</label>
              <input name="altitud" type="number" value={values.altitud} onChange={handleChange} className="input-field" placeholder="Ej: 2800" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Latitud</label>
              <input name="latitud" type="number" step="0.0000001" value={values.latitud} onChange={handleChange} className="input-field" placeholder="Ej: 5.070" />
            </div>
            <div>
              <label className="label">Longitud</label>
              <input name="longitud" type="number" step="0.0000001" value={values.longitud} onChange={handleChange} className="input-field" placeholder="Ej: -73.851" />
            </div>
          </div>

          {modalOpen && (
            <div>
              <label className="label">Ubicacion en mapa (click para marcar)</label>
              <MapView
                height="200px"
                markers={values.latitud && values.longitud ? [{ id: 'sel', lat: values.latitud, lng: values.longitud, name: 'Ubicacion seleccionada' }] : []}
                onMapClick={(latlng) => {
                  setValues(p => ({ ...p, latitud: latlng.lat.toFixed(7), longitud: latlng.lng.toFixed(7) }));
                }}
              />
            </div>
          )}

          <div>
            <label className="label">Notas</label>
            <textarea name="notas" value={values.notas} onChange={handleChange} className="input-field" rows={2} placeholder="Observaciones adicionales..." />
          </div>

          <button type="submit" disabled={saving} className="btn-primary w-full text-center">
            {saving ? 'Guardando...' : editing ? 'Actualizar finca' : 'Crear finca'}
          </button>
        </form>
      </Modal>

      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title="Eliminar finca" message={`¿Eliminar "${deleteTarget?.nombre}"? Se eliminaran sus lotes y cosechas.`} />
    </div>
  );
}
