import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { PREFIJOS_TELEFONICOS } from '../utils/helpers';
import {
  Sprout, Eye, EyeOff, AlertTriangle, Phone, Mail,
  ChevronDown, ArrowLeft,
} from 'lucide-react';

// ── Icono de Google SVG inline ──
function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

// ═══════════════════════════════════════════
// LOGIN POR EMAIL
// ═══════════════════════════════════════════

function EmailLoginForm({ onSuccess }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isLocked, setIsLocked] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) { setErrorMsg('Completa todos los campos'); return; }

    setLoading(true);
    // NO limpiamos errorMsg aqui — se limpia solo al escribir

    try {
      const usr = await login(email, password);
      onSuccess(usr);
    } catch (err) {
      // NUNCA borrar email — solo limpiar password
      setPassword('');

      if (err.status === 423 || err.data?.locked) {
        setIsLocked(true);
        setErrorMsg(err.message);
      } else {
        setIsLocked(false);
        setErrorMsg(err.message || 'El correo o la contrasena no coinciden');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {/* Error persistente */}
      {errorMsg && (
        <div className={`rounded-xl px-4 py-3 text-sm flex items-start gap-2 ${
          isLocked
            ? 'bg-cosecha-50 border border-cosecha-200 text-cosecha-800'
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${isLocked ? 'text-cosecha-600' : 'text-red-500'}`} />
          <div>
            <p>{errorMsg}</p>
            {isLocked && (
              <Link to="/forgot-password" className="font-semibold underline underline-offset-2 mt-1 inline-block">
                Recuperar contrasena
              </Link>
            )}
          </div>
        </div>
      )}

      <div>
        <label className="label">Correo electronico</label>
        <input
          type="email" value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input-field" placeholder="tu@correo.com" autoComplete="email"
        />
      </div>

      <div>
        <label className="label">Contrasena</label>
        <div className="relative">
          <input
            type={showPass ? 'text' : 'password'} value={password}
            onChange={(e) => { setPassword(e.target.value); if (errorMsg) setErrorMsg(null); }}
            className="input-field pr-11" placeholder="Tu contrasena" autoComplete="current-password"
          />
          <button type="button" onClick={() => setShowPass(!showPass)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-tierra-400 hover:text-tierra-600 transition-colors">
            {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <div className="flex justify-end">
        <Link to="/forgot-password" className="text-sm text-campo-600 hover:text-campo-700 font-medium">
          Olvidaste tu contrasena?
        </Link>
      </div>

      <button type="submit" disabled={loading}
        className="btn-primary w-full flex items-center justify-center gap-2">
        {loading && <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
        {loading ? 'Ingresando...' : 'Iniciar sesion'}
      </button>
    </form>
  );
}

// ═══════════════════════════════════════════
// LOGIN POR TELEFONO (OTP)
// ═══════════════════════════════════════════

function PhoneLoginForm({ onSuccess, onBack }) {
  const { loginByOtp } = useAuth();

  const [step, setStep] = useState('phone'); // 'phone' | 'otp'
  const [prefijo, setPrefijo] = useState('+57');
  const [numero, setNumero] = useState('');
  const [fullPhone, setFullPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    const soloDigitos = numero.replace(/\D/g, '');
    if (!soloDigitos) { setErrorMsg('Ingresa tu numero de celular'); return; }

    const phone = `${prefijo}${soloDigitos}`;
    setLoading(true);
    setErrorMsg(null);
    try {
      await authAPI.sendLoginOtp({ phone });
      setFullPhone(phone);
      setStep('otp');
    } catch (err) {
      // Generico — siempre ir a paso OTP (no revelar si existe)
      setFullPhone(phone);
      setStep('otp');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) { setErrorMsg('Ingresa el codigo de 6 digitos'); return; }

    setLoading(true);
    setErrorMsg(null);
    try {
      const usr = await loginByOtp(fullPhone, otp);
      onSuccess(usr);
    } catch (err) {
      setErrorMsg(err.message || 'Codigo incorrecto');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setErrorMsg(null);
    setOtp('');
    try {
      await authAPI.sendLoginOtp({ phone: fullPhone });
    } catch {}
  };

  if (step === 'otp') {
    return (
      <form onSubmit={handleVerifyOtp} className="space-y-4" noValidate>
        <div className="text-center mb-1">
          <p className="text-sm text-tierra-600">Codigo enviado a</p>
          <p className="font-semibold text-tierra-900 text-sm">{fullPhone}</p>
        </div>

        {errorMsg && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-sm text-red-700 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" /><span>{errorMsg}</span>
          </div>
        )}

        <input
          type="text" value={otp} maxLength={6} inputMode="numeric"
          onChange={(e) => { setOtp(e.target.value.replace(/\D/g, '')); setErrorMsg(null); }}
          className="input-field text-center text-2xl font-mono tracking-[0.5em] placeholder:tracking-normal placeholder:text-base"
          placeholder="000000" autoFocus autoComplete="one-time-code"
        />

        <button type="submit" disabled={loading || otp.length !== 6}
          className="btn-primary w-full flex items-center justify-center gap-2">
          {loading && <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
          {loading ? 'Verificando...' : 'Verificar e ingresar'}
        </button>

        <p className="text-center text-xs text-tierra-400">
          No recibiste el codigo?{' '}
          <button type="button" onClick={handleResend} className="text-campo-600 font-semibold hover:underline">Reenviar</button>
        </p>

        <button type="button" onClick={() => { setStep('phone'); setOtp(''); setErrorMsg(null); }}
          className="w-full text-sm text-tierra-500 hover:text-tierra-700 flex items-center justify-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Cambiar numero
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSendOtp} className="space-y-4" noValidate>
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-sm text-red-700 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" /><span>{errorMsg}</span>
        </div>
      )}

      <div>
        <label className="label">Numero de celular</label>
        <div className="flex gap-2">
          <div className="relative shrink-0">
            <select value={prefijo} onChange={(e) => setPrefijo(e.target.value)}
              className="input-field !w-[120px] appearance-none pr-7 cursor-pointer">
              {PREFIJOS_TELEFONICOS.map((p) => (
                <option key={p.codigo} value={p.codigo}>{p.bandera} {p.codigo}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-tierra-400 pointer-events-none" />
          </div>
          <input
            type="tel" value={numero}
            onChange={(e) => { setNumero(e.target.value.replace(/[^\d]/g, '')); setErrorMsg(null); }}
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

      <button type="button" onClick={onBack}
        className="w-full text-sm text-tierra-500 hover:text-tierra-700 flex items-center justify-center gap-1">
        <ArrowLeft className="w-4 h-4" /> Volver
      </button>
    </form>
  );
}

// ═══════════════════════════════════════════
// PAGINA PRINCIPAL DE LOGIN
// ═══════════════════════════════════════════

export default function LoginPage() {
  const { loginGoogle } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('email'); // 'email' | 'phone'
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState(null);

  const handleSuccess = (usr) => {
    navigate(usr.onboarding_completed ? '/' : '/onboarding');
  };

  // ── Google Sign-In callback ──
  const handleGoogleCallback = useCallback(async (response) => {
    setGoogleLoading(true);
    setGoogleError(null);
    try {
      const usr = await loginGoogle(response.credential);
      navigate(usr.onboarding_completed ? '/' : '/onboarding');
    } catch (err) {
      setGoogleError(err.message || 'Error al iniciar con Google');
    } finally {
      setGoogleLoading(false);
    }
  }, [loginGoogle, navigate]);

  // ── Inicializar Google Identity Services ──
  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) return;

    const initGoogle = () => {
      if (!window.google?.accounts?.id) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleCallback,
      });
      window.google.accounts.id.renderButton(
        document.getElementById('google-signin-btn'),
        {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'pill',
          width: '100%',
          locale: 'es',
        }
      );
    };

    // Si el script ya esta cargado
    if (window.google?.accounts?.id) {
      initGoogle();
      return;
    }

    // Cargar script de Google
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = initGoogle;
    document.head.appendChild(script);

    return () => {
      // Cleanup: no remover el script para evitar re-cargas
    };
  }, [handleGoogleCallback]);

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  return (
    <div className="min-h-screen bg-gradient-to-br from-campo-800 via-campo-700 to-campo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="w-16 h-16 bg-white/10 backdrop-blur rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Sprout className="w-9 h-9 text-white" />
          </div>
          <h1 className="font-display font-bold text-3xl text-white">CosechaApp</h1>
          <p className="text-campo-200 text-sm mt-1">Gestion inteligente de cosechas</p>
        </div>

        {/* Card de login */}
        <div className="card p-6 animate-slide-up">
          {/* Google Sign-In */}
          {googleClientId && mode === 'email' && (
            <>
              {googleError && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-sm text-red-700 flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-4 h-4 shrink-0" /><span>{googleError}</span>
                </div>
              )}
              <div id="google-signin-btn" className="flex justify-center mb-3" />
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-tierra-200" />
                <span className="text-xs text-tierra-400 font-medium">o</span>
                <div className="flex-1 h-px bg-tierra-200" />
              </div>
            </>
          )}

          {/* Sin Google Client ID — boton manual */}
          {!googleClientId && mode === 'email' && (
            <>
              <button
                disabled
                className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl border border-tierra-200 text-tierra-400 text-sm mb-3 cursor-not-allowed opacity-60"
              >
                <GoogleIcon />
                Continuar con Google (configurar VITE_GOOGLE_CLIENT_ID)
              </button>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-tierra-200" />
                <span className="text-xs text-tierra-400 font-medium">o</span>
                <div className="flex-1 h-px bg-tierra-200" />
              </div>
            </>
          )}

          {/* Formularios */}
          {mode === 'email' && <EmailLoginForm onSuccess={handleSuccess} />}
          {mode === 'phone' && <PhoneLoginForm onSuccess={handleSuccess} onBack={() => setMode('email')} />}

          {/* Toggle modo */}
          {mode === 'email' && (
            <button onClick={() => setMode('phone')}
              className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-tierra-200 hover:border-campo-400 hover:bg-campo-50 transition-all text-sm text-tierra-700 font-medium">
              <Phone className="w-4 h-4" /> Iniciar con telefono
            </button>
          )}
        </div>

        <p className="text-center text-campo-200 text-sm mt-5">
          No tienes cuenta?{' '}
          <Link to="/registro" className="font-semibold text-white underline underline-offset-2">Registrate</Link>
        </p>
      </div>
    </div>
  );
}
