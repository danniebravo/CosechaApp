import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fincasAPI, lotesAPI } from '../services/api';
import { Sprout, MapPin, Layers, ChevronRight, ChevronLeft, Check } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const STEPS = [
  { num: 1, title: 'Crea tu finca', desc: 'Registra la ubicacion de tu finca', icon: MapPin },
  { num: 2, title: 'Agrega un lote', desc: 'Divide tu finca en lotes de cultivo', icon: Layers },
  { num: 3, title: 'Listo', desc: 'Ya puedes gestionar tus cosechas', icon: Check },
];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [fincaId, setFincaId] = useState(null);

  const [fincaForm, setFincaForm] = useState({
    nombre: '', ubicacion: '', municipio: '', departamento: '', area_total: '', altitud: '', notas: '',
  });
  const [loteForm, setLoteForm] = useState({
    nombre: '', area: '', tipo_suelo: '', altitud: '', notas: '',
  });

  const onFincaChange = (e) => setFincaForm(p => ({ ...p, [e.target.name]: e.target.value }));
  const onLoteChange = (e) => setLoteForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const saveFinca = async (e) => {
    e.preventDefault();
    if (!fincaForm.nombre.trim()) { toast.error('Nombre de finca requerido'); return; }
    setSaving(true);
    try {
      const finca = await fincasAPI.crear(fincaForm);
      setFincaId(finca.id);
      toast.success('Finca creada');
      setStep(2);
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const saveLote = async (e) => {
    e.preventDefault();
    if (!loteForm.nombre.trim()) { toast.error('Nombre de lote requerido'); return; }
    setSaving(true);
    try {
      await lotesAPI.crear({ ...loteForm, finca_id: fincaId });
      toast.success('Lote creado');
      setStep(3);
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

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

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {STEPS.map((s) => (
            <div key={s.num} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                step >= s.num ? 'bg-white text-campo-700' : 'bg-white/20 text-white/60'
              }`}>
                {step > s.num ? <Check className="w-4 h-4" /> : s.num}
              </div>
              {s.num < 3 && <div className={`w-8 h-0.5 ${step > s.num ? 'bg-white' : 'bg-white/20'}`} />}
            </div>
          ))}
        </div>

        {/* Step 1: Finca */}
        {step === 1 && (
          <form onSubmit={saveFinca} className="card p-6 space-y-4 animate-slide-up">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-campo-50 rounded-xl flex items-center justify-center">
                <MapPin className="w-5 h-5 text-campo-600" />
              </div>
              <div>
                <h2 className="font-display font-bold text-lg">Tu primera finca</h2>
                <p className="text-xs text-tierra-400">Registra donde cultivas</p>
              </div>
            </div>

            <div>
              <label className="label">Nombre de la finca *</label>
              <input name="nombre" value={fincaForm.nombre} onChange={onFincaChange}
                className="input-field" placeholder="Ej: Finca El Porvenir" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Municipio</label>
                <input name="municipio" value={fincaForm.municipio} onChange={onFincaChange} className="input-field" /></div>
              <div><label className="label">Departamento</label>
                <input name="departamento" value={fincaForm.departamento} onChange={onFincaChange} className="input-field" /></div>
            </div>
            <div>
              <label className="label">Ubicacion / Vereda</label>
              <input name="ubicacion" value={fincaForm.ubicacion} onChange={onFincaChange} className="input-field" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Area total (ha)</label>
                <input name="area_total" type="number" step="0.01" value={fincaForm.area_total} onChange={onFincaChange} className="input-field" /></div>
              <div><label className="label">Altitud (msnm)</label>
                <input name="altitud" type="number" value={fincaForm.altitud} onChange={onFincaChange} className="input-field" /></div>
            </div>

            <button type="submit" disabled={saving}
              className="btn-primary w-full flex items-center justify-center gap-2">
              {saving ? 'Guardando...' : <><span>Siguiente</span><ChevronRight className="w-4 h-4" /></>}
            </button>
          </form>
        )}

        {/* Step 2: Lote */}
        {step === 2 && (
          <form onSubmit={saveLote} className="card p-6 space-y-4 animate-slide-up">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-cosecha-50 rounded-xl flex items-center justify-center">
                <Layers className="w-5 h-5 text-cosecha-600" />
              </div>
              <div>
                <h2 className="font-display font-bold text-lg">Agrega un lote</h2>
                <p className="text-xs text-tierra-400">Un lote es un area de cultivo dentro de tu finca</p>
              </div>
            </div>

            <div>
              <label className="label">Nombre del lote *</label>
              <input name="nombre" value={loteForm.nombre} onChange={onLoteChange}
                className="input-field" placeholder="Ej: Lote Norte, Lote 1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Area (ha)</label>
                <input name="area" type="number" step="0.01" value={loteForm.area} onChange={onLoteChange} className="input-field" /></div>
              <div><label className="label">Altitud (msnm)</label>
                <input name="altitud" type="number" value={loteForm.altitud} onChange={onLoteChange} className="input-field" /></div>
            </div>
            <div>
              <label className="label">Tipo de suelo</label>
              <input name="tipo_suelo" value={loteForm.tipo_suelo} onChange={onLoteChange}
                className="input-field" placeholder="Ej: Franco arcilloso" />
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(1)}
                className="btn-secondary flex items-center gap-1 text-sm">
                <ChevronLeft className="w-4 h-4" /> Atras
              </button>
              <button type="submit" disabled={saving}
                className="btn-primary flex-1 flex items-center justify-center gap-2">
                {saving ? 'Guardando...' : <><span>Finalizar</span><Check className="w-4 h-4" /></>}
              </button>
            </div>
          </form>
        )}

        {/* Step 3: Done */}
        {step === 3 && (
          <div className="card p-8 text-center animate-slide-up">
            <div className="w-16 h-16 bg-campo-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-campo-600" />
            </div>
            <h2 className="font-display font-bold text-xl mb-2">Todo listo</h2>
            <p className="text-tierra-500 text-sm mb-6">Tu finca y lote estan configurados. Ya puedes crear tu primera cosecha.</p>
            <button onClick={() => navigate('/')} className="btn-primary w-full">
              Ir al dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
