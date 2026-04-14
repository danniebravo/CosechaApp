import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi, useForm } from '../hooks/useApi';
import { cosechasAPI, fincasAPI, lotesAPI } from '../services/api';
import { PageHeader, LoadingPage, ErrorMsg, EmptyState, Modal } from '../components/ui';
import { Sprout, Plus, ChevronRight, Lightbulb } from 'lucide-react';
import { ESTADOS, formatDate, formatCOP, formatKg } from '../utils/helpers';
import { getVariedades, getCicloVariedad } from '../utils/colombia';
import CropTimeline from '../components/CropTimeline';
import toast, { Toaster } from 'react-hot-toast';

const empty = { lote_id: '', variedad_papa: '', fecha_siembra: '', fecha_cosecha_estimada: '', area_sembrada: '', cantidad_semilla: '' };

export default function CosechasPage() {
  const navigate = useNavigate();
  const { data: cosechas, loading, error, refetch } = useApi(() => cosechasAPI.listar(), []);
  const [modalOpen, setModalOpen] = useState(false);
  const { values, handleChange, reset, setValue } = useForm(empty);
  const [saving, setSaving] = useState(false);

  // Fincas y lotes para el formulario
  const [fincas, setFincas] = useState([]);
  const [lotes, setLotes] = useState([]);
  const [fincaSel, setFincaSel] = useState('');
  const [lotesLoading, setLotesLoading] = useState(false);

  // Fecha sugerida
  const [fechaSugerida, setFechaSugerida] = useState('');
  const [cicloInfo, setCicloInfo] = useState(null);

  // Variedades para datalist
  const variedades = getVariedades();

  useEffect(() => {
    fincasAPI.listar().then(setFincas).catch(() => {});
  }, []);

  // Cargar lotes cuando cambia la finca
  useEffect(() => {
    if (fincaSel) {
      setLotesLoading(true);
      lotesAPI.listarPorFinca(fincaSel)
        .then(data => {
          // La API retorna el objeto finca con lotes adentro, o directamente un array
          const lotesData = Array.isArray(data) ? data : (data?.lotes || []);
          setLotes(lotesData);
        })
        .catch(() => setLotes([]))
        .finally(() => setLotesLoading(false));
    } else {
      setLotes([]);
    }
    setValue('lote_id', '');
  }, [fincaSel]);

  // Calcular fecha de cosecha sugerida
  useEffect(() => {
    if (values.fecha_siembra && values.variedad_papa) {
      const ciclo = getCicloVariedad(values.variedad_papa);
      setCicloInfo(ciclo);
      const siembra = new Date(values.fecha_siembra);
      const cosecha = new Date(siembra);
      cosecha.setDate(cosecha.getDate() + ciclo.dias);
      const sugerida = cosecha.toISOString().split('T')[0];
      setFechaSugerida(sugerida);

      // Auto-fill si esta vacio
      if (!values.fecha_cosecha_estimada) {
        setValue('fecha_cosecha_estimada', sugerida);
      }
    } else {
      setFechaSugerida('');
      setCicloInfo(null);
    }
  }, [values.fecha_siembra, values.variedad_papa]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!values.lote_id || !values.variedad_papa || !values.fecha_siembra) {
      toast.error('Completa los campos requeridos'); return;
    }
    setSaving(true);
    try {
      const cosecha = await cosechasAPI.crear(values);
      toast.success('Cosecha creada');
      setModalOpen(false); reset(); setFincaSel('');
      navigate(`/cosechas/${cosecha.id}`);
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  if (loading) return <LoadingPage />;
  if (error) return <ErrorMsg message={error} onRetry={refetch} />;

  return (
    <div className="animate-fade-in">
      <Toaster position="top-center" />
      <PageHeader title="Cosechas" subtitle={`${cosechas?.length || 0} registradas`}
        action={<button onClick={() => { reset(); setFincaSel(''); setModalOpen(true); }} className="btn-primary text-sm flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> Nueva
        </button>} />

      {(!cosechas || cosechas.length === 0) ? (
        <EmptyState icon={Sprout} title="Sin cosechas" description="Registra tu primera cosecha para comenzar a gestionar produccion, gastos y ventas."
          action={<button onClick={() => setModalOpen(true)} className="btn-primary text-sm">Crear cosecha</button>} />
      ) : (
        <div className="space-y-3">
          {cosechas.map(c => {
            const est = ESTADOS[c.estado] || ESTADOS.planificada;
            const util = parseFloat(c.ingreso_total || 0) - parseFloat(c.costo_total || 0);
            return (
              <button key={c.id} onClick={() => navigate(`/cosechas/${c.id}`)}
                className="card p-4 w-full text-left hover:shadow-md transition-all flex items-center gap-4">
                <div className="w-11 h-11 bg-campo-50 rounded-xl flex items-center justify-center shrink-0">
                  <Sprout className="w-5 h-5 text-campo-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-semibold text-sm truncate">{c.variedad_papa}</p>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${est.color}`}>{est.label}</span>
                  </div>
                  <p className="text-xs text-tierra-400">{c.finca_nombre} · {c.lote_nombre}</p>
                  <div className="flex gap-4 mt-1 text-xs text-tierra-500">
                    <span>Siembra: {formatDate(c.fecha_siembra)}</span>
                    {parseFloat(c.produccion_total) > 0 && <span>{formatKg(c.produccion_total)}</span>}
                    {util !== 0 && (
                      <span className={util > 0 ? 'text-campo-600 font-medium' : 'text-red-500 font-medium'}>
                        {util > 0 ? '+' : ''}{formatCOP(util)}
                      </span>
                    )}
                  </div>
                  <div className="mt-1.5">
                    <CropTimeline fechaSiembra={c.fecha_siembra} estado={c.estado} compact />
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-tierra-300 shrink-0" />
              </button>
            );
          })}
        </div>
      )}

      {/* Modal nueva cosecha */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Nueva cosecha" maxWidth="max-w-2xl">
        <form onSubmit={handleSave} className="space-y-4">
          {/* Finca y Lote */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Finca *</label>
              <select value={fincaSel} onChange={e => setFincaSel(e.target.value)} className="input-field">
                <option value="">Seleccionar finca</option>
                {fincas.map(f => <option key={f.id} value={f.id}>{f.nombre}</option>)}
              </select>
              {fincas.length === 0 && (
                <p className="text-xs text-red-500 mt-1">No tienes fincas. Crea una primero.</p>
              )}
            </div>
            <div>
              <label className="label">Lote *</label>
              <select name="lote_id" value={values.lote_id} onChange={handleChange} className="input-field" disabled={!fincaSel || lotesLoading}>
                <option value="">{lotesLoading ? 'Cargando...' : 'Seleccionar lote'}</option>
                {lotes.map(l => <option key={l.id} value={l.id}>{l.nombre}{l.area ? ` (${l.area} ha)` : ''}</option>)}
              </select>
              {fincaSel && !lotesLoading && lotes.length === 0 && (
                <p className="text-xs text-red-500 mt-1">Esta finca no tiene lotes. Crea uno primero.</p>
              )}
            </div>
          </div>

          {/* Variedad con datalist */}
          <div>
            <label className="label">Variedad de papa *</label>
            <input
              name="variedad_papa" value={values.variedad_papa} onChange={handleChange}
              className="input-field" placeholder="Ej: Pastusa Suprema, Diacol Capiro"
              list="variedades-papa"
            />
            <datalist id="variedades-papa">
              {variedades.map(v => <option key={v} value={v} />)}
            </datalist>
            {cicloInfo && (
              <p className="text-xs text-campo-600 mt-1 flex items-center gap-1">
                <Lightbulb className="w-3 h-3" /> {cicloInfo.descripcion} — Ciclo: ~{cicloInfo.dias} dias
              </p>
            )}
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Fecha de siembra *</label>
              <input name="fecha_siembra" type="date" value={values.fecha_siembra} onChange={handleChange} className="input-field" />
            </div>
            <div>
              <label className="label">Cosecha estimada</label>
              <input name="fecha_cosecha_estimada" type="date" value={values.fecha_cosecha_estimada} onChange={handleChange} className="input-field" />
              {fechaSugerida && values.fecha_cosecha_estimada !== fechaSugerida && (
                <button type="button" onClick={() => setValue('fecha_cosecha_estimada', fechaSugerida)}
                  className="text-xs text-campo-600 mt-1 hover:underline flex items-center gap-1">
                  <Lightbulb className="w-3 h-3" /> Sugerida: {formatDate(fechaSugerida)} (usar)
                </button>
              )}
              {fechaSugerida && values.fecha_cosecha_estimada === fechaSugerida && (
                <p className="text-xs text-tierra-400 mt-1">Fecha sugerida segun variedad (puedes modificarla)</p>
              )}
            </div>
          </div>

          {/* Area y semilla */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Area sembrada (ha)</label>
              <input name="area_sembrada" type="number" step="0.01" value={values.area_sembrada} onChange={handleChange} className="input-field" placeholder="Ej: 2.5" />
            </div>
            <div>
              <label className="label">Semilla (kg)</label>
              <input name="cantidad_semilla" type="number" step="0.1" value={values.cantidad_semilla} onChange={handleChange} className="input-field" placeholder="Ej: 1500" />
            </div>
          </div>

          <button type="submit" disabled={saving} className="btn-primary w-full text-center">
            {saving ? 'Guardando...' : 'Crear cosecha'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
