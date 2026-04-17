import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function EmailLoginForm({ onSuccess, onAlert }) {
  const { login } = useAuth();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      onAlert?.({ message: 'Ingresa tu correo y contraseña.', variant: 'error' });
      return;
    }

    setLoading(true);
    onAlert?.(null);
    try {
      const usr = await login(email, password);
      onSuccess(usr);
    } catch (err) {
      // Preservamos el correo; solo limpiamos la contraseña
      setPassword('');
      if (err.status === 423 || err.data?.locked) {
        onAlert?.({
          message: err.message || 'Cuenta bloqueada temporalmente.',
          variant: 'warning',
          action: (
            <Link
              to="/forgot-password"
              className="font-semibold underline underline-offset-2 hover:no-underline"
            >
              Recuperar contraseña
            </Link>
          ),
        });
      } else {
        onAlert?.({
          message: err.message || 'El correo o la contraseña no coinciden.',
          variant: 'error',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <div>
        <label htmlFor="login-email" className="label">Correo electrónico</label>
        <input
          id="login-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input-field h-12"
          placeholder="tu@correo.com"
          autoComplete="email"
          autoFocus
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label htmlFor="login-password" className="block text-sm font-semibold text-tierra-700">
            Contraseña
          </label>
          <Link
            to="/forgot-password"
            className="text-[13px] font-semibold text-campo-700 hover:text-campo-800 transition-colors"
          >
            ¿La olvidaste?
          </Link>
        </div>
        <div className="relative">
          <input
            id="login-password"
            type={showPass ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-field h-12 pr-12"
            placeholder="••••••••"
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={() => setShowPass((v) => !v)}
            tabIndex={-1}
            aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-tierra-400 hover:text-tierra-700 transition-colors"
          >
            {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="btn-primary w-full h-12 mt-1 flex items-center justify-center gap-2 shadow-lg shadow-campo-600/20 hover:shadow-xl hover:shadow-campo-700/25"
      >
        {loading && (
          <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        )}
        {loading ? 'Ingresando…' : 'Iniciar sesión'}
      </button>
    </form>
  );
}
