import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { cosechasAPI, fincasAPI, lotesAPI } from '../services/api';
import { PageHeader, LoadingPage, ErrorMsg, EmptyState, Modal } from '../components/ui';
import { Sprout, Plus, ChevronRight, Calendar, Info } from 'lucide-react';
import { ESTADOS, VARIEDADES_PAPA, formatDate, formatCOP, formatKg, calcularFechaCosechaEstimada } from '../utils/helpers';
import CropTimeline from '../components/CropTimeline';
import toast, { Toaster } from 'react-hot-toast';

const empty = {
  lote_id: '', variedad_papa: '', fecha_siembra: '',
  fecha_cosecha_estimada: '', area_sembrada: '', cantidad_semilla: '',
  unidad_registro: 'bultos', modalidad_pago: 'dia',
};

export default function CosechasPage() {
  const navigate = useNavigate();
  const { data: cosechas, loading, error, refetch } = useApi(() => cosechasAPI.listar(), []);
  const [modalOpen, setModalOpen] = useState(false);
  const [values, setValues] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [fechaAutoCalculada, setFechaAutoCalculada] = useState(false);

  // Fincas y lotes para el form
  const [fincas, setFincas] = useState([]);
  const [lotes, setLotes] = useState([]);
  const [fincaSel, setFincaSel] = useState('');

  useEffect(() => {
    fincasAPI.listar().then(setFincas).catch(() => {});
  }, []);

  useEffect(() => {
    if (fincaSel) {
      lotesAPI.listarPorFinca(fincaSel).then(setLotes).catch(() => setLotes([]));
    } else {
      setLotes([]);
    }
    setValues((p) => ({ ...p, lote_id: '' }));
  }, [fincaSel]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    const newVal = type === 'number' ? (value === '' ? '' : parseFloat(value)) : value;

    setValues((prev) => {
      const next = { ...prev, [name]: newVal };

      // Auto-calcular fecha de cosecha cuando cambia variedad o fecha de siembra
      if (name === 'variedad_papa' || name === 'fecha_siembra') {
        const variedad = name === 'variedad_papa' ? value : prev.variedad_papa;
        const siembra = name === 'fecha_siembra' ? value : prev.fecha_siembra;

        if (variedad && siembra) {
          const fechaAuto = calcularFechaCosechaEstimada(siembra, variedad);
          if (fechaAuto) {
            next.fecha_cosecha_estimada = fechaAuto;
            setFechaAutoCalculada(true);
          }
        }
      }

      // Si el usuario edita manualmente la fecha, marcar como no auto
      if (name === 'fecha_cosecha_estimada') {
        setFechaAutoCalculada(false);
      }

      return next;
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!values.lote_id || !values.variedad_papa || !values.fecha_siembra) {
      toast.error('Completa los campos requeridos'); return;
    }
    setSaving(true);
    try {
      const cosecha = await cosechasAPI.crear(values);
      toast.success('Cosecha creada');
      setModalOpen(false);
      setValues(empty);
      setFincaSel('');
      navigate(`/cosechas/${cosecha.id}`);
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const variedadConfig = VARIEDADES_PAPA.find((v) => v.value === values.variedad_papa);

  if (loading) return <LoadingPage />;
  if (error) return <ErrorMsg message={error} onRetry={refetch} />;

  return (
    <div className="animate-fade-in">
      <Toaster position="top-center" />
      <PageHeader title="Cosechas" subtitle={`${cosechas?.length || 0} registradas`}
        action={<button onClick={() => { setValues(empty); setFincaSel(''); setModalOpen(true); }} className="btn-primary text-sm flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> Nueva
        </button>} />

      {(!cosechas || cosechas.length === 0) ? (
        <EmptyState icon={Sprout} title="Sin cosechas" description="Registra tu primera cosecha para empezar a gestionar."
          action={<button onClick={() => setModalOpen(true)} className="btn-primary text-sm">Crear cosecha</button>} />
      ) : (
        <div className="space-y-3">
          {cosechas.map(c => {
            const est = ESTADOS[c.estado] || ESTADOS.planificada;
            return (
              <button key={c.id} onClick={() => navigate(`/cosechas/${c.id}`)}
                className="card p-4 w-full text-left hover:shadow-md transition-all">
                <div className="flex items-center gap-4">
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
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-tierra-300 shrink-0" />
                </div>
                {/* Timeline compacto */}
                <div className="mt-3 pl-15">
                  <CropTimeline fechaSiembra={c.fecha_siembra} estado={c.estado} compact />
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Modal nueva cosecha */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Nueva cosecha">
        <form onSubmit={handleSave} className="space-y-4">
          {/* Finca */}
          <div>
            <label className="label">Finca *</label>
            <select value={fincaSel} onChange={e => setFincaSel(e.target.value)}
              className="input-field appearance-none cursor-pointer">
              <option value="">Seleccionar finca...</option>
              {fincas.map(f => <option key={f.id} value={f.id}>{f.nombre}</option>)}
            </select>
          </div>

          {/* Lote */}
          <div>
            <label className="label">Lote *</label>
            <select name="lote_id" value={values.lote_id} onChange={handleChange}
              className={`input-field appearance-none cursor-pointer ${!fincaSel ? 'opacity-50' : ''}`}
              disabled={!fincaSel}>
              <option value="">{fincaSel ? 'Seleccionar lote...' : 'Primero selecciona una finca'}</option>
              {lotes.map(l => <option key={l.id} value={l.id}>{l.nombre}</option>)}
            </select>
          </div>

          {/* Variedad */}
          <div>
            <label className="label">Variedad de papa *</label>
            <select name="variedad_papa" value={values.variedad_papa} onChange={handleChange}
              className="input-field appearance-none cursor-pointer">
              <option value="">Seleccionar variedad...</option>
              {VARIEDADES_PAPA.map(v => (
                <option key={v.value} value={v.value}>
                  {v.label} (~{v.dias} dias)
                </option>
              ))}
            </select>
            {variedadConfig && (
              <p className="text-xs text-campo-600 mt-1 flex items-center gap-1">
                <Info className="w-3 h-3" />
                Ciclo estimado: {variedadConfig.dias} dias (~{Math.round(variedadConfig.dias / 30)} meses)
              </p>
            )}
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Fecha siembra *</label>
              <input name="fecha_siembra" type="date" value={values.fecha_siembra}
                onChange={handleChange} className="input-field" />
            </div>
            <div>
              <label className="label">
                Cosecha estimada
                {fechaAutoCalculada && (
                  <span className="font-normal text-campo-500 ml-1">(auto)</span>
                )}
              </label>
              <input name="fecha_cosecha_estimada" type="date" value={values.fecha_cosecha_estimada}
                onChange={handleChange} className="input-field" />
              {fechaAutoCalculada && (
                <p className="text-[10px] text-tierra-400 mt-1">
                  Calculada automaticamente. Puedes editarla.
                </p>
              )}
            </div>
          </div>

          {/* Área y semilla */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Area sembrada (ha)</label>
              <input name="area_sembrada" type="number" step="0.01" value={values.area_sembrada}
                onChange={handleChange} className="input-field" placeholder="Ej: 1.5" />
            </div>
            <div>
              <label className="label">Semilla (kg)</label>
              <input name="cantidad_semilla" type="number" step="0.1" value={values.cantidad_semilla}
                onChange={handleChange} className="input-field" placeholder="Ej: 2000" />
            </div>
          </div>

          {/* Configuración de la cosecha */}
          <div className="border-t border-tierra-100 pt-4 mt-2">
            <p className="text-xs text-tierra-400 font-semibold uppercase mb-3">Configuracion</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label">Registrar produccion en</label>
                <div className="flex gap-2">
                  {[
                    { value: 'bultos', label: 'Bultos' },
                    { value: 'kilos', label: 'Kilos' },
                  ].map((u) => (
                    <button key={u.value} type="button"
                      onClick={() => handleChange({ target: { name: 'unidad_registro', value: u.value } })}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-all ${
                        values.unidad_registro === u.value
                          ? 'bg-campo-50 border-campo-400 text-campo-700'
                          : 'border-tierra-200 text-tierra-500 hover:bg-tierra-50'
                      }`}>
                      {u.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label">Pago a trabajadores</label>
                <select name="modalidad_pago" value={values.modalidad_pago} onChange={handleChange}
                  className="input-field appearance-none cursor-pointer">
                  <option value="dia">Por dia</option>
                  <option value="hora">Por hora</option>
                  <option value="bulto">Por bulto cosechado</option>
                </select>
              </div>
            </div>
          </div>

          <button type="submit" disabled={saving} className="btn-primary w-full text-center flex items-center justify-center gap-2">
            {saving ? (
              <>
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Sprout className="w-4 h-4" /> Crear cosecha
              </>
            )}
          </button>
        </form>
      </Modal>
    </div>
  );
}
