import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApi, useForm } from '../hooks/useApi';
import { fincasAPI, lotesAPI } from '../services/api';
import { TIPOS_SUELO } from '../utils/helpers';
import { PageHeader, LoadingPage, ErrorMsg, EmptyState, Modal, ConfirmDialog } from '../components/ui';
import { Layers, Plus, Edit2, Trash2 } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const emptyLote = { nombre: '', area: '', tipo_suelo: '', altitud: '', notas: '' };

export default function LotesPage() {
  const { fincaId } = useParams();
  const navigate = useNavigate();
  const { data: finca, loading, error, refetch } = useApi(
    () => fincaId ? fincasAPI.obtener(fincaId) : Promise.resolve(null), [fincaId]
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const { values, handleChange, reset, setValues } = useForm(emptyLote);
  const [saving, setSaving] = useState(false);

  const lotes = finca?.lotes || [];

  const openNew = () => { reset(); setEditing(null); setModalOpen(true); };
  const openEdit = (l) => {
    setValues({
      nombre: l.nombre, area: l.area || '',
      tipo_suelo: l.tipo_suelo || '', altitud: l.altitud || '', notas: l.notas || '',
    });
    setEditing(l); setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!values.nombre.trim()) { toast.error('Nombre requerido'); return; }
    setSaving(true);
    try {
      if (editing) {
        await lotesAPI.actualizar(editing.id, values);
        toast.success('Lote actualizado');
      } else {
        await lotesAPI.crear({ ...values, finca_id: fincaId });
        toast.success('Lote creado');
      }
      setModalOpen(false); refetch();
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try {
      await lotesAPI.eliminar(deleteTarget.id);
      toast.success('Lote eliminado'); setDeleteTarget(null); refetch();
    } catch (err) { toast.error(err.message); }
  };

  if (loading) return <LoadingPage />;
  if (error) return <ErrorMsg message={error} onRetry={refetch} />;
  if (!finca) return <ErrorMsg message="Finca no encontrada" />;

  return (
    <div className="animate-fade-in">
      <Toaster position="top-center" />
      <PageHeader title={finca.nombre} subtitle={`${lotes.length} lotes · ${[finca.municipio, finca.departamento].filter(Boolean).join(', ')}`}
        onBack={() => navigate('/fincas')}
        action={<button onClick={openNew} className="btn-primary text-sm flex items-center gap-1.5"><Plus className="w-4 h-4" /> Nuevo lote</button>} />

      {lotes.length === 0 ? (
        <EmptyState icon={Layers} title="Sin lotes" description="Divide tu finca en lotes para organizar las cosechas."
          action={<button onClick={openNew} className="btn-primary text-sm">Crear lote</button>} />
      ) : (
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
          {lotes.map(l => (
            <div key={l.id} className="card p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-cosecha-50 rounded-xl flex items-center justify-center shrink-0">
                    <Layers className="w-5 h-5 text-cosecha-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{l.nombre}</h3>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-tierra-400 mt-0.5">
                      {l.area && <span>{l.area} ha</span>}
                      {l.tipo_suelo && <span>{l.tipo_suelo}</span>}
                      {l.altitud && <span>{l.altitud} msnm</span>}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(l)} className="p-1.5 hover:bg-tierra-100 rounded-lg"><Edit2 className="w-4 h-4 text-tierra-500" /></button>
                  <button onClick={() => setDeleteTarget(l)} className="p-1.5 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4 text-red-400" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar lote' : 'Nuevo lote'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="label">Nombre *</label>
            <input name="nombre" value={values.nombre} onChange={handleChange}
              className="input-field" placeholder="Ej: Lote Norte, Lote 1" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Area (ha)</label>
              <input name="area" type="number" step="0.01" value={values.area}
                onChange={handleChange} className="input-field" placeholder="Ej: 1.5" />
            </div>
            <div>
              <label className="label">Altitud (msnm)</label>
              <input name="altitud" type="number" value={values.altitud}
                onChange={handleChange} className="input-field" placeholder="Ej: 2800" />
            </div>
          </div>

          <div>
            <label className="label">Tipo de suelo</label>
            <select name="tipo_suelo" value={values.tipo_suelo} onChange={handleChange}
              className="input-field appearance-none cursor-pointer">
              <option value="">Seleccionar tipo de suelo...</option>
              {TIPOS_SUELO.map((t) => (
                <option key={t.value} value={t.label}>{t.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Notas</label>
            <textarea name="notas" value={values.notas} onChange={handleChange}
              className="input-field" rows={2} placeholder="Notas adicionales..." />
          </div>

          <button type="submit" disabled={saving} className="btn-primary w-full text-center">
            {saving ? 'Guardando...' : editing ? 'Actualizar' : 'Crear lote'}
          </button>
        </form>
      </Modal>

      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title="Eliminar lote" message={`Eliminar "${deleteTarget?.nombre}"? Se eliminaran sus cosechas.`} />
    </div>
  );
}
