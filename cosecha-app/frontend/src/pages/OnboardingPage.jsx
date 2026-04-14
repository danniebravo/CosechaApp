import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { onboardingAPI } from '../services/api';
import { useColombiaData } from '../hooks/useColombiaData';
import { Sprout, MapPin, Layers, ChevronRight, ChevronLeft, Check, LogOut } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const STEPS = [
  { num: 1, title: 'Crea tu finca', icon: MapPin },
  { num: 2, title: 'Agrega un lote', icon: Layers },
];

function FieldError({ error }) {
  if (!error) return null;
  return <p className="text-red-500 text-xs mt-1">{error}</p>;
}

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { setOnboardingCompleted, logout } = useAuth();

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  // ── Formulario finca ──
  const [fincaForm, setFincaForm] = useState({
    nombre: '',
    departamento: '',
    municipio: '',
    ubicacion: '',
    area_total: '',
    altitud: '',
  });

  // ── Formulario lote ──
  const [loteForm, setLoteForm] = useState({
    nombre: '',
    area: '',
    tipo_suelo: '',
  });

  // ── Errores ──
  const [fincaErrors, setFincaErrors] = useState({});
  const [loteErrors, setLoteErrors] = useState({});

  // ── Datos de Colombia (selects encadenados) ──
  const { departamentos, municipios } = useColombiaData(fincaForm.departamento);

  // ═══════════════════════════════════════════
  // HANDLERS
  // ═══════════════════════════════════════════

  const onFincaChange = (e) => {
    const { name, value } = e.target;

    if (name === 'departamento') {
      // Cambiar departamento → limpiar municipio
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

  // ═══════════════════════════════════════════
  // VALIDACIONES
  // ═══════════════════════════════════════════

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

  // ═══════════════════════════════════════════
  // NAVEGACION
  // ═══════════════════════════════════════════

  const goToStep2 = (e) => {
    e.preventDefault();
    if (!validateFinca()) return;
    setStep(2);
  };

  const goToStep1 = () => setStep(1);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleFinish = async (e) => {
    e.preventDefault();
    if (!validateLote()) return;

    setSaving(true);
    try {
      const result = await onboardingAPI.completar({
        finca: fincaForm,
        lote: loteForm,
      });

      if (result.onboarding_completed) {
        setOnboardingCompleted();
        setDone(true);
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
        toast.error(err.message || 'Error al completar onboarding');
      }
    } finally {
      setSaving(false);
    }
  };

  // ── Clases de input ──
  const inputClass = (errorsObj, field) =>
    `input-field ${errorsObj[field] ? '!border-red-400 !ring-red-100' : ''}`;

  const selectClass = (errorsObj, field) =>
    `input-field appearance-none cursor-pointer ${errorsObj[field] ? '!border-red-400 !ring-red-100' : ''}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-campo-800 via-campo-700 to-campo-900 flex items-center justify-center p-4">
      <Toaster position="top-center" />
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-6 animate-fade-in">
          <div className="w-14 h-14 bg-white/10 backdrop-blur rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Sprout className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-display font-bold text-2xl text-white">Configura tu cuenta</h1>
          <p className="text-campo-200 text-sm mt-1">Solo toma un minuto</p>
        </div>

        {/* Progress bar */}
        {!done && (
          <div className="flex items-center justify-center gap-3 mb-6">
            {STEPS.map((s) => (
              <div key={s.num} className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    step >= s.num ? 'bg-white text-campo-700' : 'bg-white/20 text-white/60'
                  }`}>
                    {step > s.num ? <Check className="w-4 h-4" /> : s.num}
                  </div>
                  <span className={`text-sm hidden sm:inline ${
                    step >= s.num ? 'text-white font-medium' : 'text-white/50'
                  }`}>
                    {s.title}
                  </span>
                </div>
                {s.num < STEPS.length && (
                  <div className={`w-10 h-0.5 ${step > s.num ? 'bg-white' : 'bg-white/20'}`} />
                )}
              </div>
            ))}
          </div>
        )}

        {/* ══════════════════════════════════════════════
            PASO 1: FINCA
            ══════════════════════════════════════════════ */}
        {step === 1 && !done && (
          <form onSubmit={goToStep2} className="card p-6 space-y-4 animate-slide-up" noValidate>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 bg-campo-50 rounded-xl flex items-center justify-center">
                <MapPin className="w-5 h-5 text-campo-600" />
              </div>
              <div>
                <h2 className="font-display font-bold text-lg text-tierra-900">Tu primera finca</h2>
                <p className="text-xs text-tierra-400">Registra donde cultivas</p>
              </div>
            </div>

            {/* Nombre */}
            <div>
              <label className="label">Nombre de la finca *</label>
              <input
                name="nombre"
                value={fincaForm.nombre}
                onChange={onFincaChange}
                className={inputClass(fincaErrors, 'nombre')}
                placeholder="Ej: Finca El Porvenir"
              />
              <FieldError error={fincaErrors.nombre} />
            </div>

            {/* Departamento */}
            <div>
              <label className="label">Departamento *</label>
              <select
                name="departamento"
                value={fincaForm.departamento}
                onChange={onFincaChange}
                className={selectClass(fincaErrors, 'departamento')}
              >
                <option value="">Seleccionar departamento...</option>
                {departamentos.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <FieldError error={fincaErrors.departamento} />
            </div>

            {/* Municipio */}
            <div>
              <label className="label">Municipio *</label>
              <select
                name="municipio"
                value={fincaForm.municipio}
                onChange={onFincaChange}
                className={`${selectClass(fincaErrors, 'municipio')} ${!fincaForm.departamento ? 'opacity-50' : ''}`}
                disabled={!fincaForm.departamento}
              >
                <option value="">
                  {fincaForm.departamento
                    ? 'Seleccionar municipio...'
                    : 'Primero selecciona un departamento'}
                </option>
                {municipios.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <FieldError error={fincaErrors.municipio} />
            </div>

            {/* Vereda */}
            <div>
              <label className="label">Vereda / Ubicacion detallada</label>
              <input
                name="ubicacion"
                value={fincaForm.ubicacion}
                onChange={onFincaChange}
                className="input-field"
                placeholder="Ej: Vereda El Salitre, Km 5 via a..."
              />
            </div>

            {/* Area + Altitud */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Area total (ha)</label>
                <input
                  name="area_total"
                  type="number"
                  step="0.01"
                  min="0"
                  value={fincaForm.area_total}
                  onChange={onFincaChange}
                  className="input-field"
                  placeholder="Opcional"
                />
              </div>
              <div>
                <label className="label">Altitud (msnm)</label>
                <input
                  name="altitud"
                  type="number"
                  min="0"
                  value={fincaForm.altitud}
                  onChange={onFincaChange}
                  className="input-field"
                  placeholder="Opcional"
                />
              </div>
            </div>

            {/* Boton continuar */}
            <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2">
              Continuar <ChevronRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* ══════════════════════════════════════════════
            PASO 2: LOTE
            ══════════════════════════════════════════════ */}
        {step === 2 && !done && (
          <form onSubmit={handleFinish} className="card p-6 space-y-4 animate-slide-up" noValidate>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 bg-cosecha-50 rounded-xl flex items-center justify-center">
                <Layers className="w-5 h-5 text-cosecha-600" />
              </div>
              <div>
                <h2 className="font-display font-bold text-lg text-tierra-900">Agrega un lote</h2>
                <p className="text-xs text-tierra-400">Un lote es un area de cultivo dentro de tu finca</p>
              </div>
            </div>

            {/* Resumen finca */}
            <div className="bg-campo-50 rounded-xl px-4 py-3 text-sm text-campo-800">
              <span className="font-semibold">Finca:</span> {fincaForm.nombre}
              <span className="text-campo-500 ml-2">({fincaForm.municipio}, {fincaForm.departamento})</span>
            </div>

            <div>
              <label className="label">Nombre del lote *</label>
              <input
                name="nombre"
                value={loteForm.nombre}
                onChange={onLoteChange}
                className={inputClass(loteErrors, 'nombre')}
                placeholder="Ej: Lote Norte, Lote 1"
              />
              <FieldError error={loteErrors.nombre} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Area (ha)</label>
                <input
                  name="area"
                  type="number"
                  step="0.01"
                  min="0"
                  value={loteForm.area}
                  onChange={onLoteChange}
                  className="input-field"
                  placeholder="Opcional"
                />
              </div>
              <div>
                <label className="label">Tipo de suelo</label>
                <input
                  name="tipo_suelo"
                  value={loteForm.tipo_suelo}
                  onChange={onLoteChange}
                  className="input-field"
                  placeholder="Ej: Franco arcilloso"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={goToStep1}
                className="btn-secondary flex items-center gap-1 text-sm"
              >
                <ChevronLeft className="w-4 h-4" /> Atras
              </button>
              <button
                type="submit"
                disabled={saving}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                {saving ? 'Guardando...' : <><span>Finalizar</span><Check className="w-4 h-4" /></>}
              </button>
            </div>
          </form>
        )}

        {/* ══════════════════════════════════════════════
            PASO FINAL: LISTO
            ══════════════════════════════════════════════ */}
        {done && (
          <div className="card p-8 text-center animate-slide-up">
            <div className="w-16 h-16 bg-campo-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-campo-600" />
            </div>
            <h2 className="font-display font-bold text-xl mb-2 text-tierra-900">
              Todo listo
            </h2>
            <p className="text-tierra-500 text-sm mb-6">
              Tu finca y lote estan configurados. Ya puedes crear tu primera cosecha.
            </p>
            <button onClick={() => navigate('/')} className="btn-primary w-full">
              Ir al dashboard
            </button>
          </div>
        )}

        {/* ── Cerrar sesion (visible en pasos 1 y 2) ── */}
        {!done && (
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 mx-auto mt-5 text-campo-300 hover:text-white text-sm transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesion / Usar otra cuenta
          </button>
        )}
      </div>
    </div>
  );
}
