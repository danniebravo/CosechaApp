import { useState, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { onboardingAPI } from '../services/api';
import { useColombiaData } from '../hooks/useColombiaData';
import { TIPOS_SUELO } from '../utils/helpers';
import {
  Sprout, MapPin, Layers, ChevronRight, ChevronLeft,
  Check, LogOut, Sparkles, ArrowRight,
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const MapaPicker = lazy(() => import('../components/MapaPicker'));

function FieldError({ error }) {
  if (!error) return null;
  return <p className="text-red-500 text-xs mt-1 animate-fade-in">{error}</p>;
}

function StepIndicator({ current, total }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {Array.from({ length: total }, (_, i) => i + 1).map((num) => (
        <div key={num} className="flex items-center gap-2">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
            current > num
              ? 'bg-white text-campo-700 shadow-sm'
              : current === num
                ? 'bg-white text-campo-700 shadow-md scale-110'
                : 'bg-white/20 text-white/60'
          }`}>
            {current > num ? <Check className="w-4 h-4" /> : num}
          </div>
          {num < total && (
            <div className={`w-8 sm:w-12 h-0.5 rounded transition-all duration-500 ${
              current > num ? 'bg-white' : 'bg-white/20'
            }`} />
          )}
        </div>
      ))}
    </div>
  );
}

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { usuario, setOnboardingCompleted, logout } = useAuth();

  const [step, setStep] = useState(0); // 0=bienvenida, 1=finca, 2=lote, 3=done
  const [saving, setSaving] = useState(false);

  // ── Formulario finca ──
  const [fincaForm, setFincaForm] = useState({
    nombre: '',
    departamento: '',
    municipio: '',
    ubicacion: '',
    area_total: '',
    altitud: '',
    latitud: null,
    longitud: null,
  });

  // ── Formulario lote ──
  const [loteForm, setLoteForm] = useState({
    nombre: '',
    area: '',
    tipo_suelo: '',
  });

  const [fincaErrors, setFincaErrors] = useState({});
  const [loteErrors, setLoteErrors] = useState({});
  const { departamentos, municipios } = useColombiaData(fincaForm.departamento);

  // ── Handlers ──
  const onFincaChange = (e) => {
    const { name, value } = e.target;
    if (name === 'departamento') {
      setFincaForm((p) => ({ ...p, departamento: value, municipio: '' }));
      setFincaErrors((p) => ({ ...p, departamento: null, municipio: null }));
    } else {
      setFincaForm((p) => ({ ...p, [name]: value }));
      if (fincaErrors[name]) setFincaErrors((p) => ({ ...p, [name]: null }));
    }
  };

  const onLoteChange = (e) => {
    const { name, value } = e.target;
    setLoteForm((p) => ({ ...p, [name]: value }));
    if (loteErrors[name]) setLoteErrors((p) => ({ ...p, [name]: null }));
  };

  // ── Validaciones ──
  const validateFinca = () => {
    const errs = {};
    if (!fincaForm.nombre.trim()) errs.nombre = 'Nombre de finca requerido';
    if (!fincaForm.departamento) errs.departamento = 'Selecciona un departamento';
    if (!fincaForm.municipio) errs.municipio = 'Selecciona un municipio';
    setFincaErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateLote = () => {
    const errs = {};
    if (!loteForm.nombre.trim()) errs.nombre = 'Nombre de lote requerido';
    setLoteErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const goToFinca = () => setStep(1);

  const goToLote = (e) => {
    e.preventDefault();
    if (!validateFinca()) return;
    setStep(2);
  };

  const handleFinish = async (e) => {
    e.preventDefault();
    if (!validateLote()) return;

    setSaving(true);
    try {
      const result = await onboardingAPI.completar({ finca: fincaForm, lote: loteForm });
      if (result.onboarding_completed) {
        setOnboardingCompleted();
        setStep(3);
      }
    } catch (err) {
      if (err.data?.campo) {
        const [section, field] = err.data.campo.split('.');
        if (section === 'finca') {
          setFincaErrors((p) => ({ ...p, [field]: err.data.error }));
          setStep(1);
        } else {
          setLoteErrors((p) => ({ ...p, [field]: err.data.error }));
        }
      } else {
        toast.error(err.message || 'Error al completar');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  const inputClass = (errorsObj, field) =>
    `input-field ${errorsObj[field] ? '!border-red-400 !ring-red-100' : ''}`;

  const selectClass = (errorsObj, field) =>
    `input-field appearance-none cursor-pointer ${errorsObj[field] ? '!border-red-400 !ring-red-100' : ''}`;

  const primerNombre = (usuario?.nombre || '').split(/\s+/)[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-campo-800 via-campo-700 to-campo-900 flex items-center justify-center p-4">
      <Toaster position="top-center" />
      <div className="w-full max-w-lg">

        {/* Logo */}
        <div className="text-center mb-5 animate-fade-in">
          <div className="w-14 h-14 bg-white/10 backdrop-blur rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Sprout className="w-8 h-8 text-white" />
          </div>
        </div>

        {/* Step indicator (solo en pasos 1 y 2) */}
        {(step === 1 || step === 2) && <StepIndicator current={step} total={2} />}

        {/* ═══════════════════════════════════════
            PASO 0: BIENVENIDA
            ═══════════════════════════════════════ */}
        {step === 0 && (
          <div className="card p-8 text-center animate-slide-up">
            <div className="w-16 h-16 bg-campo-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <Sparkles className="w-8 h-8 text-campo-600" />
            </div>
            <h2 className="font-display font-bold text-2xl text-tierra-900 mb-2">
              Bienvenido{primerNombre ? `, ${primerNombre}` : ''}
            </h2>
            <p className="text-tierra-500 text-sm leading-relaxed mb-6 max-w-sm mx-auto">
              Vamos a configurar tu cuenta en 2 pasos rapidos.
              Registra tu finca y un lote para empezar a gestionar tus cosechas.
            </p>

            <div className="space-y-3 text-left mb-8">
              {[
                { icon: MapPin, color: 'campo', label: 'Registra tu finca', desc: 'Donde esta ubicada y cuanto mide' },
                { icon: Layers, color: 'cosecha', label: 'Agrega un lote', desc: 'Un area de cultivo dentro de tu finca' },
              ].map(({ icon: Icon, color, label, desc }) => (
                <div key={label} className="flex items-center gap-3 p-3 rounded-xl bg-tierra-50/60">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    color === 'campo' ? 'bg-campo-100' : 'bg-cosecha-100'
                  }`}>
                    <Icon className={`w-5 h-5 ${color === 'campo' ? 'text-campo-700' : 'text-cosecha-700'}`} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-tierra-800">{label}</p>
                    <p className="text-xs text-tierra-500">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <button onClick={goToFinca} className="btn-primary w-full flex items-center justify-center gap-2">
              Comenzar <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ═══════════════════════════════════════
            PASO 1: FINCA
            ═══════════════════════════════════════ */}
        {step === 1 && (
          <form onSubmit={goToLote} className="card p-6 space-y-4 animate-slide-up" noValidate>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 bg-campo-50 rounded-xl flex items-center justify-center">
                <MapPin className="w-5 h-5 text-campo-600" />
              </div>
              <div>
                <h2 className="font-display font-bold text-lg text-tierra-900">Tu primera finca</h2>
                <p className="text-xs text-tierra-400">Registra donde cultivas</p>
              </div>
            </div>

            <div>
              <label className="label">Nombre de la finca *</label>
              <input
                name="nombre" value={fincaForm.nombre} onChange={onFincaChange}
                className={inputClass(fincaErrors, 'nombre')}
                placeholder="Ej: Finca El Porvenir" autoFocus
              />
              <FieldError error={fincaErrors.nombre} />
            </div>

            <div>
              <label className="label">Departamento *</label>
              <select name="departamento" value={fincaForm.departamento} onChange={onFincaChange}
                className={selectClass(fincaErrors, 'departamento')}>
                <option value="">Seleccionar departamento...</option>
                {departamentos.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
              <FieldError error={fincaErrors.departamento} />
            </div>

            <div>
              <label className="label">Municipio *</label>
              <select name="municipio" value={fincaForm.municipio} onChange={onFincaChange}
                className={`${selectClass(fincaErrors, 'municipio')} ${!fincaForm.departamento ? 'opacity-50' : ''}`}
                disabled={!fincaForm.departamento}>
                <option value="">
                  {fincaForm.departamento ? 'Seleccionar municipio...' : 'Primero selecciona un departamento'}
                </option>
                {municipios.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
              <FieldError error={fincaErrors.municipio} />
            </div>

            <div>
              <label className="label">Vereda / Ubicacion detallada</label>
              <input name="ubicacion" value={fincaForm.ubicacion} onChange={onFincaChange}
                className="input-field" placeholder="Ej: Vereda El Salitre, Km 5 via a..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label">Area total (ha)</label>
                <input name="area_total" type="number" step="0.01" min="0"
                  value={fincaForm.area_total} onChange={onFincaChange}
                  className="input-field" placeholder="Ej: 3.5"
                />
              </div>
              <div>
                <label className="label">Altitud (msnm)</label>
                <input name="altitud" type="number" min="0"
                  value={fincaForm.altitud} onChange={onFincaChange}
                  className="input-field" placeholder="Ej: 2800"
                />
              </div>
            </div>

            {/* Mapa de ubicación (opcional) */}
            <div>
              <label className="label">Ubicacion en el mapa <span className="font-normal text-tierra-400">(opcional)</span></label>
              <Suspense fallback={<div className="h-[200px] rounded-xl bg-tierra-100 animate-pulse" />}>
                <MapaPicker
                  lat={fincaForm.latitud ? parseFloat(fincaForm.latitud) : null}
                  lng={fincaForm.longitud ? parseFloat(fincaForm.longitud) : null}
                  onSelect={({ lat, lng }) => setFincaForm((p) => ({ ...p, latitud: lat, longitud: lng }))}
                  height="200px"
                />
              </Suspense>
            </div>

            <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2">
              Continuar <ChevronRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* ═══════════════════════════════════════
            PASO 2: LOTE
            ═══════════════════════════════════════ */}
        {step === 2 && (
          <form onSubmit={handleFinish} className="card p-6 space-y-4 animate-slide-up" noValidate>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 bg-cosecha-50 rounded-xl flex items-center justify-center">
                <Layers className="w-5 h-5 text-cosecha-600" />
              </div>
              <div>
                <h2 className="font-display font-bold text-lg text-tierra-900">Agrega un lote</h2>
                <p className="text-xs text-tierra-400">Un area de cultivo dentro de tu finca</p>
              </div>
            </div>

            {/* Resumen finca */}
            <div className="bg-campo-50 rounded-xl px-4 py-3 text-sm text-campo-800 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-campo-600 shrink-0" />
              <div>
                <span className="font-semibold">{fincaForm.nombre}</span>
                <span className="text-campo-500 ml-1">— {fincaForm.municipio}, {fincaForm.departamento}</span>
              </div>
            </div>

            <div>
              <label className="label">Nombre del lote *</label>
              <input name="nombre" value={loteForm.nombre} onChange={onLoteChange}
                className={inputClass(loteErrors, 'nombre')}
                placeholder="Ej: Lote Norte, Lote 1" autoFocus
              />
              <FieldError error={loteErrors.nombre} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label">Area del lote (ha)</label>
                <input name="area" type="number" step="0.01" min="0"
                  value={loteForm.area} onChange={onLoteChange}
                  className="input-field" placeholder="Ej: 1.5"
                />
              </div>
              <div>
                <label className="label">Tipo de suelo</label>
                <select name="tipo_suelo" value={loteForm.tipo_suelo} onChange={onLoteChange}
                  className="input-field appearance-none cursor-pointer">
                  <option value="">Seleccionar...</option>
                  {TIPOS_SUELO.map((t) => (
                    <option key={t.value} value={t.label}>{t.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => setStep(1)}
                className="btn-secondary flex items-center gap-1 text-sm">
                <ChevronLeft className="w-4 h-4" /> Atras
              </button>
              <button type="submit" disabled={saving}
                className="btn-primary flex-1 flex items-center justify-center gap-2">
                {saving ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>Finalizar <Check className="w-4 h-4" /></>
                )}
              </button>
            </div>
          </form>
        )}

        {/* ═══════════════════════════════════════
            PASO 3: LISTO
            ═══════════════════════════════════════ */}
        {step === 3 && (
          <div className="card p-8 text-center animate-slide-up">
            <div className="w-20 h-20 bg-campo-50 rounded-full flex items-center justify-center mx-auto mb-5">
              <Check className="w-10 h-10 text-campo-600" />
            </div>
            <h2 className="font-display font-bold text-2xl mb-2 text-tierra-900">
              Todo listo, {primerNombre}
            </h2>
            <p className="text-tierra-500 text-sm leading-relaxed mb-2">
              Tu finca <strong className="text-tierra-700">{fincaForm.nombre}</strong> y el lote <strong className="text-tierra-700">{loteForm.nombre}</strong> estan configurados.
            </p>
            <p className="text-tierra-400 text-xs mb-8">
              Ahora puedes crear tu primera cosecha y empezar a registrar todo.
            </p>

            <div className="space-y-3">
              <button onClick={() => navigate('/cosechas')}
                className="btn-primary w-full flex items-center justify-center gap-2">
                <Sprout className="w-5 h-5" /> Crear mi primera cosecha
              </button>
              <button onClick={() => navigate('/')}
                className="w-full text-sm text-tierra-500 hover:text-tierra-700 py-2 transition-colors">
                Ir al dashboard
              </button>
            </div>
          </div>
        )}

        {/* Cerrar sesion (visible en pasos 0, 1 y 2) */}
        {step < 3 && (
          <button onClick={handleLogout}
            className="flex items-center justify-center gap-2 mx-auto mt-5 text-campo-300 hover:text-white text-sm transition-colors">
            <LogOut className="w-4 h-4" /> Cerrar sesion / Usar otra cuenta
          </button>
        )}
      </div>
    </div>
  );
}
