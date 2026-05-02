import { useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Phone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AuthShell          from '../components/auth/AuthShell';
import EmailLoginForm     from '../components/auth/EmailLoginForm';
import PhoneLoginForm     from '../components/auth/PhoneLoginForm';
import SocialAuthButtons  from '../components/auth/SocialAuthButtons';
import ErrorAlert         from '../components/auth/ErrorAlert';

function Divider({ children }) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex-1 h-px bg-tierra-200/60" />
      <span className="text-[11px] uppercase tracking-[0.18em] text-tierra-400 font-semibold whitespace-nowrap">
        {children}
      </span>
      <div className="flex-1 h-px bg-tierra-200/60" />
    </div>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { loginGoogle, loginApple } = useAuth();

  const [mode, setMode]                   = useState('email'); // 'email' | 'phone'
  const [alert, setAlert]                 = useState(null);    // { message, variant, action }
  const [socialLoading, setSocialLoading] = useState(false);

  const handleSuccess = useCallback((usr) => {
    if (!usr.email_verified) return navigate('/verify-email');
    navigate(usr.onboarding_completed ? '/' : '/onboarding');
  }, [navigate]);

  const handleGoogleCredential = useCallback(async (credential) => {
    setSocialLoading(true);
    setAlert(null);
    try {
      const usr = await loginGoogle(credential);
      handleSuccess(usr);
    } catch (err) {
      setAlert({
        message: err.message || 'No se pudo iniciar sesion con Google.',
        variant: 'error',
      });
    } finally {
      setSocialLoading(false);
    }
  }, [loginGoogle, handleSuccess]);

  const handleAppleAuth = useCallback(async ({ identityToken, fullName }) => {
    setSocialLoading(true);
    setAlert(null);
    try {
      const usr = await loginApple(identityToken, fullName);
      handleSuccess(usr);
    } catch (err) {
      setAlert({
        message: err.message || 'No se pudo iniciar sesion con Apple.',
        variant: 'error',
      });
    } finally {
      setSocialLoading(false);
    }
  }, [loginApple, handleSuccess]);

  const switchMode = (next) => {
    setAlert(null);
    setMode(next);
  };

  return (
    <AuthShell>
      <header className="mb-8">
        <h1 className="font-display font-bold text-[2rem] sm:text-[2.125rem] text-tierra-900 tracking-tight leading-[1.15]">
          {mode === 'email' ? 'Inicia sesión' : 'Ingresa con tu celular'}
        </h1>
        <p className="text-tierra-500 text-[15px] mt-2">
          {mode === 'email'
            ? 'Accede a tu cuenta para continuar'
            : 'Te enviaremos un código por SMS'}
        </p>
      </header>

      {alert && (
        <div className="mb-5">
          <ErrorAlert
            message={alert.message}
            variant={alert.variant}
            action={alert.action}
            onDismiss={() => setAlert(null)}
          />
        </div>
      )}

      {mode === 'email' && (
        <EmailLoginForm onSuccess={handleSuccess} onAlert={setAlert} />
      )}
      {mode === 'phone' && (
        <PhoneLoginForm
          onSuccess={handleSuccess}
          onBack={() => switchMode('email')}
          onAlert={setAlert}
        />
      )}

      {mode === 'email' && (
        <>
          <div className="mt-8">
            <Divider>o continúa con</Divider>
          </div>

          {/* Método secundario: Teléfono — más destacado que los sociales */}
          <button
            type="button"
            onClick={() => switchMode('phone')}
            className="mt-5 group w-full h-12 inline-flex items-center justify-center gap-2.5 rounded-xl border border-tierra-200 bg-white text-tierra-800 text-sm font-semibold shadow-sm hover:border-campo-400 hover:shadow-md hover:shadow-campo-700/10 hover:-translate-y-[1px] active:translate-y-0 active:scale-[0.99] transition-all duration-200"
          >
            <span className="w-7 h-7 rounded-lg bg-campo-50 group-hover:bg-campo-100 flex items-center justify-center transition-colors">
              <Phone className="w-3.5 h-3.5 text-campo-700" strokeWidth={2.4} />
            </span>
            Número de teléfono
          </button>

          {/* Métodos terciarios: Google + Apple */}
          <div className="mt-3">
            <SocialAuthButtons
              onGoogleCredential={handleGoogleCredential}
              onAppleAuth={handleAppleAuth}
              disabled={socialLoading}
            />
          </div>
        </>
      )}

      <p className="text-center text-tierra-500 text-sm mt-9">
        ¿No tienes cuenta?{' '}
        <Link to="/registro" className="font-semibold text-campo-700 hover:text-campo-800 transition-colors">
          Regístrate
        </Link>
      </p>
    </AuthShell>
  );
}
