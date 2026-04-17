import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Mail, Phone, ArrowLeft, ChevronRight, ChevronDown,
  AlertTriangle, MailCheck,
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

import { authAPI } from '../services/api';
import { PREFIJOS_TELEFONICOS, validarEmail } from '../utils/helpers';
import { useCountdown } from '../hooks/useCountdown';
import AuthShell    from '../components/auth/AuthShell';
import ResendButton from '../components/auth/ResendButton';
import ErrorAlert   from '../components/auth/ErrorAlert';

const PHONE_OTP_FALLBACK_COOLDOWN = 30;
const EMAIL_FALLBACK_COOLDOWN     = 60;

// ─── Card interactiva (selector de método) ────────────────
function MethodCard({ icon: Icon, accent, title, description, onClick }) {
  const accents = {
    campo:   { bg: 'bg-campo-50',   bgHover: 'group-hover:bg-campo-100',   icon: 'text-campo-700' },
    cosecha: { bg: 'bg-cosecha-50', bgHover: 'group-hover:bg-cosecha-100', icon: 'text-cosecha-700' },
  };
  const a = accents[accent] || accents.campo;

  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full flex items-center gap-4 p-5 rounded-2xl border border-tierra-200 bg-white text-left transition-all hover:border-campo-300 hover:shadow-lg hover:shadow-campo-900/[0.06] hover:-translate-y-0.5 active:scale-[0.99] active:translate-y-0"
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${a.bg} ${a.bgHover}`}>
        <Icon className={`w-6 h-6 ${a.icon}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-display font-semibold text-base text-tierra-900">{title}</p>
        <p className="text-sm text-tierra-500 mt-0.5 leading-snug">{description}</p>
      </div>
      <ChevronRight className="w-5 h-5 text-tierra-300 shrink-0 transition-all group-hover:text-campo-600 group-hover:translate-x-0.5" />
    </button>
  );
}

// ─── Link "back" ghost (visible y consistente) ────────────
function BackAction({ to, onClick, label = 'Volver al inicio de sesión' }) {
  const cls =
    'inline-flex items-center justify-center gap-1.5 w-full h-11 rounded-xl text-sm font-semibold text-tierra-600 hover:text-tierra-900 hover:bg-tierra-100/70 transition-colors';
  if (to) return <Link to={to} className={cls}><ArrowLeft className="w-4 h-4" />{label}</Link>;
  return (
    <button type="button" onClick={onClick} className={cls}>
      <ArrowLeft className="w-4 h-4" />{label}
    </button>
  );
}

// ─── Selector de método ───────────────────────────────────
function MethodSelector({ onSelect }) {
  return (
    <div className="space-y-3">
      <MethodCard
        icon={Mail}
        accent="campo"
        title="Correo electrónico"
        description="Recibe un enlace para restablecer tu contraseña"
        onClick={() => onSelect('email')}
      />
      <MethodCard
        icon={Phone}
        accent="cosecha"
        title="Número de teléfono"
        description="Recibe un código de verificación por SMS"
        onClick={() => onSelect('phone')}
      />
    </div>
  );
}

// ─── Form: ingresar email ─────────────────────────────────
function EmailForm({ onSent }) {
  const [email, setEmail]     = useState('');
  const [error, setError]     = useState(null);
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setEmail(e.target.value);
    if (error) setError(null);
  };

  const handleBlur = () => {
    setTouched(true);
    const err = validarEmail(email);
    if (err) setError(err);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched(true);
    const validationErr = validarEmail(email);
    if (validationErr) { setError(validationErr); return; }

    setLoading(true);
    setError(null);
    let retryAfter = EMAIL_FALLBACK_COOLDOWN;
    const cleanEmail = email.trim();
    try {
      const res = await authAPI.forgotPassword({ email: cleanEmail });
      retryAfter = Number(res?.retry_after_seconds) || EMAIL_FALLBACK_COOLDOWN;
    } catch (err) {
      // El backend solo deberia rechazar por formato (validator) — no por existencia.
      const detalle = err?.data?.detalles?.find((d) => d.campo === 'email');
      setError(detalle?.mensaje || 'No pudimos procesar tu solicitud. Intenta de nuevo.');
      setLoading(false);
      return;
    }
    setLoading(false);
    onSent({ email: cleanEmail, cooldown: retryAfter });
  };

  const inputInvalid = touched && !!error;

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <ErrorAlert message={error} />

      <div>
        <label htmlFor="forgot-email" className="label">Correo electrónico</label>
        <div className="relative">
          <input
            id="forgot-email"
            type="email"
            value={email}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`input-field h-12 pl-11 ${inputInvalid ? '!border-red-300 !ring-red-100 focus:!border-red-400' : ''}`}
            placeholder="tu@correo.com"
            autoComplete="email"
            autoFocus
            aria-invalid={inputInvalid || undefined}
            aria-describedby={inputInvalid ? 'forgot-email-error' : undefined}
          />
          <Mail className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 ${inputInvalid ? 'text-red-400' : 'text-tierra-400'}`} />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="btn-primary w-full h-12 flex items-center justify-center gap-2"
      >
        {loading && <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
        {loading ? 'Enviando…' : 'Enviar enlace de recuperación'}
      </button>
    </form>
  );
}

// ─── Confirmación: email enviado (con resend + cooldown) ──
function EmailSent({ email, initialCooldown }) {
  const cooldown = useCountdown(initialCooldown || EMAIL_FALLBACK_COOLDOWN);
  const [resending, setResending] = useState(false);

  const handleResend = async () => {
    if (cooldown.active || resending) return;
    setResending(true);
    let retryAfter = EMAIL_FALLBACK_COOLDOWN;
    try {
      const res = await authAPI.forgotPassword({ email });
      retryAfter = Number(res?.retry_after_seconds) || EMAIL_FALLBACK_COOLDOWN;
      toast.success('Enlace reenviado');
    } catch {
      toast.error('No se pudo reenviar');
    }
    cooldown.start(retryAfter);
    setResending(false);
  };

  return (
    <div className="space-y-5">
      <div className="text-center py-2">
        <div className="w-16 h-16 bg-campo-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <MailCheck className="w-8 h-8 text-campo-600" strokeWidth={2} />
        </div>
        <p className="text-sm text-tierra-700">
          Si tu cuenta existe, te enviamos un enlace a
        </p>
        <p className="font-semibold text-tierra-900 break-all mt-0.5">{email}</p>
        <p className="text-xs text-tierra-400 mt-3 leading-relaxed">
          El enlace expira en 1 hora. Revisa la carpeta de spam o promociones si no lo ves.
        </p>
      </div>

      <ResendButton
        variant="button"
        active={cooldown.active}
        formatted={cooldown.formatted}
        loading={resending}
        label="Reenviar enlace"
        onClick={handleResend}
      />
    </div>
  );
}

// ─── Form: ingresar teléfono ──────────────────────────────
function PhoneForm({ onOtpSent }) {
  const [prefijo, setPrefijo] = useState('+57');
  const [numero, setNumero]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const soloDigitos = numero.replace(/\D/g, '');
    if (!soloDigitos) { toast.error('Ingresa tu número de celular'); return; }
    const fullPhone = `${prefijo}${soloDigitos}`;
    setLoading(true);
    let retryAfter = PHONE_OTP_FALLBACK_COOLDOWN;
    try {
      const res = await authAPI.forgotByPhone({ phone: fullPhone });
      retryAfter = Number(res?.retry_after_seconds) || PHONE_OTP_FALLBACK_COOLDOWN;
    } catch { /* generico */ }
    setLoading(false);
    onOtpSent({ phone: fullPhone, cooldown: retryAfter });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div>
        <label htmlFor="forgot-phone" className="label">Número de celular</label>
        <div className="flex gap-2">
          <div className="relative shrink-0">
            <select
              value={prefijo}
              onChange={(e) => setPrefijo(e.target.value)}
              className="input-field h-12 !w-[120px] appearance-none pr-7 cursor-pointer"
              aria-label="Prefijo de país"
            >
              {PREFIJOS_TELEFONICOS.map((p) => (
                <option key={p.codigo} value={p.codigo}>{p.bandera} {p.codigo}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-tierra-400 pointer-events-none" />
          </div>
          <input
            id="forgot-phone"
            type="tel"
            value={numero}
            onChange={(e) => setNumero(e.target.value.replace(/[^\d]/g, ''))}
            className="input-field h-12 flex-1"
            placeholder="300 123 4567"
            inputMode="numeric"
            autoFocus
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="btn-primary w-full h-12 flex items-center justify-center gap-2"
      >
        {loading && <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
        {loading ? 'Enviando…' : 'Enviar código por SMS'}
      </button>
    </form>
  );
}

// ─── Form: ingresar OTP (paso 2) ──────────────────────────
function OtpForm({ phone, initialCooldown, onVerified }) {
  const [otp, setOtp]         = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError]     = useState(null);
  const cooldown = useCountdown(initialCooldown || PHONE_OTP_FALLBACK_COOLDOWN);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) { setError('El código debe tener 6 dígitos'); return; }
    setLoading(true);
    setError(null);
    try {
      const result = await authAPI.verifyOtp({ phone, otp });
      onVerified(result.reset_token);
    } catch (err) {
      setError(err.message || 'Código inválido');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown.active || resending) return;
    setOtp('');
    setError(null);
    setResending(true);
    let retryAfter = PHONE_OTP_FALLBACK_COOLDOWN;
    try {
      const res = await authAPI.forgotByPhone({ phone });
      retryAfter = Number(res?.retry_after_seconds) || PHONE_OTP_FALLBACK_COOLDOWN;
      toast.success('Nuevo código enviado');
    } catch {
      toast.error('Error al reenviar');
    }
    cooldown.start(retryAfter);
    setResending(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="text-center">
        <p className="text-sm text-tierra-500">Enviamos un código a</p>
        <p className="font-semibold text-tierra-900 text-sm">{phone}</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-sm text-red-700 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <input
        type="text"
        value={otp}
        maxLength={6}
        inputMode="numeric"
        onChange={(e) => { setOtp(e.target.value.replace(/\D/g, '')); setError(null); }}
        className="input-field h-14 text-center text-2xl font-mono tracking-[0.5em] placeholder:tracking-normal placeholder:text-base"
        placeholder="000000"
        autoFocus
        autoComplete="one-time-code"
        aria-label="Código de verificación de 6 dígitos"
      />

      <button
        type="submit"
        disabled={loading || otp.length !== 6}
        className="btn-primary w-full h-12 flex items-center justify-center gap-2"
      >
        {loading && <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
        {loading ? 'Verificando…' : 'Verificar código'}
      </button>

      <p className="text-center text-xs text-tierra-400 leading-relaxed">
        Verifica que tu número sea correcto y revisa los SMS recibidos.
      </p>

      <div className="text-center pt-1">
        <ResendButton
          active={cooldown.active}
          formatted={cooldown.formatted}
          loading={resending}
          label="Reenviar código"
          onClick={handleResend}
        />
      </div>
    </form>
  );
}

// ═══════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ═══════════════════════════════════════════════════════════

export default function ForgotPasswordPage() {
  const navigate = useNavigate();

  const [method, setMethod]         = useState(null);   // null | 'email' | 'phone'
  const [emailState, setEmailState] = useState(null);   // { email, cooldown }
  const [phoneState, setPhoneState] = useState(null);   // { phone, cooldown }

  const handleOtpVerified = (resetToken) => {
    navigate(`/reset-password?token=${resetToken}`);
  };

  // ── Estado actual + título/subtítulo ──
  let step;
  if (method === 'email' && emailState) step = 'email-sent';
  else if (method === 'email')          step = 'email-form';
  else if (method === 'phone' && phoneState) step = 'otp-form';
  else if (method === 'phone')          step = 'phone-form';
  else                                  step = 'selector';

  const titles = {
    'selector':    { t: 'Recuperar cuenta',     s: 'Elige cómo quieres continuar' },
    'email-form':  { t: 'Por correo',            s: 'Te enviaremos un enlace para restablecer tu contraseña' },
    'email-sent':  { t: 'Revisa tu correo',      s: 'Te hemos enviado un enlace de recuperación' },
    'phone-form':  { t: 'Por SMS',               s: 'Te enviaremos un código de verificación' },
    'otp-form':    { t: 'Verifica tu identidad', s: 'Ingresa el código que recibiste' },
  };
  const { t: title, s: subtitle } = titles[step];

  // ── Acción back contextual ──
  const backToSelector = () => { setMethod(null); setEmailState(null); setPhoneState(null); };
  const backToPhoneForm = () => setPhoneState(null);

  let backAction;
  switch (step) {
    case 'email-form':
    case 'phone-form':
      backAction = <BackAction onClick={backToSelector} label="Elegir otro método" />;
      break;
    case 'otp-form':
      backAction = <BackAction onClick={backToPhoneForm} label="Cambiar número" />;
      break;
    case 'selector':
    case 'email-sent':
    default:
      backAction = <BackAction to="/login" label="Volver al inicio de sesión" />;
  }

  return (
    <AuthShell>
      <Toaster position="top-center" />

      <header className="mb-7">
        <h1 className="font-display font-bold text-3xl sm:text-[2rem] text-tierra-900 tracking-tight leading-tight">
          {title}
        </h1>
        <p className="text-tierra-500 text-[15px] mt-1.5">{subtitle}</p>
      </header>

      <div className="space-y-6">
        {/* Contenido por paso */}
        {step === 'selector'   && <MethodSelector onSelect={setMethod} />}
        {step === 'email-form' && <EmailForm onSent={setEmailState} />}
        {step === 'email-sent' && <EmailSent email={emailState.email} initialCooldown={emailState.cooldown} />}
        {step === 'phone-form' && <PhoneForm onOtpSent={setPhoneState} />}
        {step === 'otp-form'   && (
          <OtpForm
            phone={phoneState.phone}
            initialCooldown={phoneState.cooldown}
            onVerified={handleOtpVerified}
          />
        )}

        {/* Back action */}
        <div className="pt-2">{backAction}</div>
      </div>

      {/* Footer cuando no es el selector inicial: ofrecer link directo al login */}
      {step !== 'selector' && step !== 'email-sent' && (
        <p className="text-center text-tierra-500 text-sm mt-6">
          ¿Recordaste tu contraseña?{' '}
          <Link to="/login" className="font-semibold text-campo-700 hover:text-campo-800">
            Inicia sesión
          </Link>
        </p>
      )}
    </AuthShell>
  );
}
