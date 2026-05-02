import { useState } from 'react';
import { ArrowLeft, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';
import { PREFIJOS_TELEFONICOS, getPrefijoConfig } from '../../utils/helpers';
import { useCountdown } from '../../hooks/useCountdown';
import ResendButton from './ResendButton';

const FALLBACK_COOLDOWN = 30;

export default function PhoneLoginForm({ onSuccess, onBack, onAlert }) {
  const { loginByOtp } = useAuth();

  const [step, setStep]           = useState('phone'); // 'phone' | 'otp'
  const [prefijo, setPrefijo]     = useState('+57');
  const [numero, setNumero]       = useState('');
  const prefijoConfig = getPrefijoConfig(prefijo);
  const [fullPhone, setFullPhone] = useState('');
  const [otp, setOtp]             = useState('');
  const [loading, setLoading]     = useState(false);
  const [resending, setResending] = useState(false);

  const cooldown = useCountdown(0);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    const digitos = numero.replace(/\D/g, '');
    if (!digitos) {
      onAlert?.({ message: 'Ingresa tu número de celular.', variant: 'error' });
      return;
    }

    const phone = `${prefijo}${digitos}`;
    setLoading(true);
    onAlert?.(null);
    let retryAfter = FALLBACK_COOLDOWN;
    try {
      const res = await authAPI.sendLoginOtp({ phone });
      retryAfter = Number(res?.retry_after_seconds) || FALLBACK_COOLDOWN;
    } catch {
      // generico — no revelar si existe la cuenta
    }
    setFullPhone(phone);
    setStep('otp');
    cooldown.start(retryAfter);
    setLoading(false);
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      onAlert?.({ message: 'Ingresa el código de 6 dígitos.', variant: 'error' });
      return;
    }

    setLoading(true);
    onAlert?.(null);
    try {
      const usr = await loginByOtp(fullPhone, otp);
      onSuccess(usr);
    } catch (err) {
      onAlert?.({
        message: err.message || 'No encontramos una cuenta con ese número.',
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown.active || resending) return;
    setOtp('');
    onAlert?.(null);
    setResending(true);
    let retryAfter = FALLBACK_COOLDOWN;
    try {
      const res = await authAPI.sendLoginOtp({ phone: fullPhone });
      retryAfter = Number(res?.retry_after_seconds) || FALLBACK_COOLDOWN;
    } catch {}
    cooldown.start(retryAfter);
    setResending(false);
  };

  // ── Paso 2: ingreso de código OTP ──
  if (step === 'otp') {
    return (
      <form onSubmit={handleVerifyOtp} className="space-y-5" noValidate>
        <div className="text-center">
          <p className="text-sm text-tierra-500">Enviamos un código a</p>
          <p className="font-semibold text-tierra-900 text-sm mt-0.5">{fullPhone}</p>
        </div>

        <input
          type="text"
          value={otp}
          maxLength={6}
          inputMode="numeric"
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
          className="input-field h-14 text-center text-2xl font-mono tracking-[0.5em] placeholder:tracking-normal placeholder:text-base"
          placeholder="000000"
          autoFocus
          autoComplete="one-time-code"
          aria-label="Código de verificación de 6 dígitos"
        />

        <button
          type="submit"
          disabled={loading || otp.length !== 6}
          className="btn-primary w-full h-12 flex items-center justify-center gap-2 shadow-lg shadow-campo-600/20 hover:shadow-xl hover:shadow-campo-700/25"
        >
          {loading && (
            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          )}
          {loading ? 'Verificando…' : 'Verificar e ingresar'}
        </button>

        <p className="text-center text-xs text-tierra-400 leading-relaxed">
          Verifica que tu número sea correcto y revisa los SMS recibidos.
        </p>

        <div className="flex items-center justify-between pt-1">
          <button
            type="button"
            onClick={() => { setStep('phone'); setOtp(''); onAlert?.(null); cooldown.reset(); }}
            className="text-sm text-tierra-500 hover:text-tierra-800 inline-flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Cambiar número
          </button>
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

  // ── Paso 1: ingreso de número ──
  return (
    <form onSubmit={handleSendOtp} className="space-y-5" noValidate>
      <div>
        <label htmlFor="login-phone" className="label">Número de celular</label>
        <div className="flex gap-2">
          <div className="relative shrink-0">
            <select
              value={prefijo}
              onChange={(e) => {
                const newPref = e.target.value;
                setPrefijo(newPref);
                const newConfig = getPrefijoConfig(newPref);
                setNumero((prev) => prev.slice(0, newConfig.digitos));
              }}
              className="input-field h-12 !w-[120px] appearance-none pr-7 cursor-pointer"
              aria-label="Prefijo de pais"
            >
              {PREFIJOS_TELEFONICOS.map((p) => (
                <option key={p.codigo} value={p.codigo}>{p.bandera} {p.codigo}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-tierra-400 pointer-events-none" />
          </div>
          <input
            id="login-phone"
            type="tel"
            value={numero}
            onChange={(e) => setNumero(e.target.value.replace(/\D/g, '').slice(0, prefijoConfig.digitos))}
            className="input-field h-12 flex-1"
            placeholder={prefijoConfig.placeholder}
            maxLength={prefijoConfig.digitos}
            inputMode="numeric"
            autoFocus
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="btn-primary w-full h-12 flex items-center justify-center gap-2 shadow-lg shadow-campo-600/20 hover:shadow-xl hover:shadow-campo-700/25"
      >
        {loading && (
          <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        )}
        {loading ? 'Enviando código…' : 'Enviar código por SMS'}
      </button>

      <button
        type="button"
        onClick={onBack}
        className="w-full text-sm text-tierra-500 hover:text-tierra-800 inline-flex items-center justify-center gap-1.5 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Volver al inicio de sesión
      </button>
    </form>
  );
}
