import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { PREFIJOS_TELEFONICOS } from '../utils/helpers';
import { Sprout, Mail, Phone, ArrowLeft, Check, ChevronDown, AlertTriangle } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

// ── Pantalla de seleccion de metodo ──
function MethodSelector({ onSelect }) {
  return (
    <div className="card p-6 space-y-3 animate-slide-up">
      <p className="text-sm text-tierra-600 text-center mb-2">Elige como recuperar tu cuenta</p>
      <button
        onClick={() => onSelect('email')}
        className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border border-tierra-200 hover:border-campo-400 hover:bg-campo-50 transition-all text-left"
      >
        <div className="w-10 h-10 bg-campo-50 rounded-xl flex items-center justify-center shrink-0">
          <Mail className="w-5 h-5 text-campo-600" />
        </div>
        <div>
          <p className="font-semibold text-sm text-tierra-900">Por correo electronico</p>
          <p className="text-xs text-tierra-400">Recibiras un enlace para restablecer</p>
        </div>
      </button>
      <button
        onClick={() => onSelect('phone')}
        className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border border-tierra-200 hover:border-campo-400 hover:bg-campo-50 transition-all text-left"
      >
        <div className="w-10 h-10 bg-cosecha-50 rounded-xl flex items-center justify-center shrink-0">
          <Phone className="w-5 h-5 text-cosecha-600" />
        </div>
        <div>
          <p className="font-semibold text-sm text-tierra-900">Por celular (SMS)</p>
          <p className="text-xs text-tierra-400">Recibiras un codigo de verificacion</p>
        </div>
      </button>
    </div>
  );
}

// ── Formulario de correo ──
function EmailForm({ onSent }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) { toast.error('Ingresa tu correo'); return; }
    setLoading(true);
    try {
      await authAPI.forgotPassword({ email });
    } catch { /* generico */ }
    setLoading(false);
    onSent();
  };

  return (
    <form onSubmit={handleSubmit} className="card p-6 space-y-4 animate-slide-up" noValidate>
      <div>
        <label className="label">Correo electronico</label>
        <div className="relative">
          <input
            type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            className="input-field pl-11" placeholder="tu@correo.com" autoComplete="email" autoFocus
          />
          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-tierra-400" />
        </div>
      </div>
      <button type="submit" disabled={loading}
        className="btn-primary w-full flex items-center justify-center gap-2">
        {loading && <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
        {loading ? 'Enviando...' : 'Enviar enlace de recuperacion'}
      </button>
    </form>
  );
}

// ── Confirmacion email enviado ──
function EmailSent() {
  return (
    <div className="card p-6 text-center animate-slide-up">
      <div className="w-14 h-14 bg-campo-50 rounded-full flex items-center justify-center mx-auto mb-4">
        <Check className="w-7 h-7 text-campo-600" />
      </div>
      <h2 className="font-display font-bold text-lg text-tierra-900 mb-2">Revisa tu correo</h2>
      <p className="text-tierra-500 text-sm mb-1">
        Si el correo esta registrado, recibiras un enlace para restablecer tu contrasena.
      </p>
      <p className="text-tierra-400 text-xs mb-6">El enlace expira en 1 hora.</p>
      <Link to="/login" className="btn-primary inline-block w-full text-center">
        Volver al inicio de sesion
      </Link>
    </div>
  );
}

// ── Formulario de celular (paso 1: ingresar numero) ──
function PhoneForm({ onOtpSent }) {
  const [prefijo, setPrefijo] = useState('+57');
  const [numero, setNumero] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const soloDigitos = numero.replace(/\D/g, '');
    if (!soloDigitos) { toast.error('Ingresa tu numero de celular'); return; }
    const fullPhone = `${prefijo}${soloDigitos}`;
    setLoading(true);
    try {
      await authAPI.forgotByPhone({ phone: fullPhone });
    } catch { /* generico */ }
    setLoading(false);
    onOtpSent(fullPhone);
  };

  return (
    <form onSubmit={handleSubmit} className="card p-6 space-y-4 animate-slide-up" noValidate>
      <div>
        <label className="label">Numero de celular</label>
        <div className="flex gap-2">
          <div className="relative shrink-0">
            <select
              value={prefijo} onChange={(e) => setPrefijo(e.target.value)}
              className="input-field !w-[120px] appearance-none pr-7 cursor-pointer"
            >
              {PREFIJOS_TELEFONICOS.map((p) => (
                <option key={p.codigo} value={p.codigo}>{p.bandera} {p.codigo}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-tierra-400 pointer-events-none" />
          </div>
          <input
            type="tel" value={numero}
            onChange={(e) => setNumero(e.target.value.replace(/[^\d]/g, ''))}
            className="input-field flex-1" placeholder="300 123 4567"
            inputMode="numeric" autoFocus
          />
        </div>
      </div>
      <button type="submit" disabled={loading}
        className="btn-primary w-full flex items-center justify-center gap-2">
        {loading && <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
        {loading ? 'Enviando...' : 'Enviar codigo SMS'}
      </button>
    </form>
  );
}

// ── Formulario OTP (paso 2: ingresar codigo) ──
function OtpForm({ phone, onVerified }) {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) { setError('El codigo debe tener 6 digitos'); return; }

    setLoading(true);
    setError(null);
    try {
      const result = await authAPI.verifyOtp({ phone, otp });
      onVerified(result.reset_token);
    } catch (err) {
      setError(err.message || 'Codigo invalido');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError(null);
    setOtp('');
    try {
      await authAPI.forgotByPhone({ phone });
      toast.success('Nuevo codigo enviado');
    } catch {
      toast.error('Error al reenviar');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card p-6 space-y-4 animate-slide-up" noValidate>
      <div className="text-center mb-2">
        <p className="text-sm text-tierra-600">
          Ingresa el codigo de 6 digitos enviado a
        </p>
        <p className="font-semibold text-tierra-900 text-sm">{phone}</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-sm text-red-700 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div>
        <input
          type="text" value={otp} maxLength={6} inputMode="numeric"
          onChange={(e) => { setOtp(e.target.value.replace(/\D/g, '')); setError(null); }}
          className="input-field text-center text-2xl font-mono tracking-[0.5em] placeholder:tracking-normal placeholder:text-base"
          placeholder="000000" autoFocus autoComplete="one-time-code"
        />
      </div>

      <button type="submit" disabled={loading || otp.length !== 6}
        className="btn-primary w-full flex items-center justify-center gap-2">
        {loading && <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
        {loading ? 'Verificando...' : 'Verificar codigo'}
      </button>

      <p className="text-center text-xs text-tierra-400">
        No recibiste el codigo?{' '}
        <button type="button" onClick={handleResend}
          className="text-campo-600 font-semibold hover:underline">
          Reenviar
        </button>
      </p>
    </form>
  );
}

// ═══════════════════════════════════════════
// PAGINA PRINCIPAL
// ═══════════════════════════════════════════

export default function ForgotPasswordPage() {
  const navigate = useNavigate();

  // Estados del flujo
  const [method, setMethod] = useState(null);    // null | 'email' | 'phone'
  const [emailSent, setEmailSent] = useState(false);
  const [phone, setPhone] = useState(null);      // numero completo para OTP
  const [otpVerified, setOtpVerified] = useState(false);

  // Cuando OTP es verificado, recibimos reset_token → ir a reset-password
  const handleOtpVerified = (resetToken) => {
    navigate(`/reset-password?token=${resetToken}`);
  };

  // Determinar que mostrar
  const renderContent = () => {
    // 1. Email enviado
    if (method === 'email' && emailSent) return <EmailSent />;
    // 2. Formulario email
    if (method === 'email') return <EmailForm onSent={() => setEmailSent(true)} />;
    // 3. OTP ingreso de codigo
    if (method === 'phone' && phone) return <OtpForm phone={phone} onVerified={handleOtpVerified} />;
    // 4. Formulario celular
    if (method === 'phone') return <PhoneForm onOtpSent={(p) => setPhone(p)} />;
    // 5. Selector de metodo
    return <MethodSelector onSelect={setMethod} />;
  };

  const handleBack = () => {
    if (method === 'phone' && phone) { setPhone(null); return; }
    if (method) { setMethod(null); setEmailSent(false); setPhone(null); return; }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-campo-800 via-campo-700 to-campo-900 flex items-center justify-center p-4">
      <Toaster position="top-center" />
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="w-16 h-16 bg-white/10 backdrop-blur rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Sprout className="w-9 h-9 text-white" />
          </div>
          <h1 className="font-display font-bold text-2xl text-white">Recuperar cuenta</h1>
          <p className="text-campo-200 text-sm mt-1">
            {!method && 'Elige como quieres recuperar tu acceso'}
            {method === 'email' && !emailSent && 'Te enviaremos un enlace por correo'}
            {method === 'email' && emailSent && ''}
            {method === 'phone' && !phone && 'Te enviaremos un codigo por SMS'}
            {method === 'phone' && phone && 'Ingresa el codigo que recibiste'}
          </p>
        </div>

        {renderContent()}

        {/* Navegacion inferior */}
        <div className="flex items-center justify-center gap-4 mt-5">
          {method && !emailSent && (
            <button
              onClick={handleBack}
              className="inline-flex items-center gap-1.5 text-campo-200 hover:text-white text-sm transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Atras
            </button>
          )}
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-campo-200 hover:text-white text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al login
          </Link>
        </div>
      </div>
    </div>
  );
}
