import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import { validarPassword } from '../utils/helpers';
import { Sprout, Eye, EyeOff, Check, X, Lock, AlertTriangle } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

function PasswordRules({ password }) {
  const reglas = useMemo(() => validarPassword(password), [password]);
  if (!password) return null;
  return (
    <div className="mt-2 space-y-1">
      {reglas.map((r) => (
        <div key={r.key} className="flex items-center gap-1.5 text-xs">
          {r.cumple ? (
            <Check className="w-3.5 h-3.5 text-campo-600 shrink-0" />
          ) : (
            <X className="w-3.5 h-3.5 text-red-400 shrink-0" />
          )}
          <span className={r.cumple ? 'text-campo-700' : 'text-tierra-500'}>
            {r.mensaje}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);

  // Sin token → error
  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-campo-800 via-campo-700 to-campo-900 flex items-center justify-center p-4">
        <div className="card p-8 text-center max-w-sm w-full">
          <AlertTriangle className="w-12 h-12 text-cosecha-500 mx-auto mb-4" />
          <h2 className="font-display font-bold text-lg text-tierra-900 mb-2">Enlace invalido</h2>
          <p className="text-tierra-500 text-sm mb-6">
            Este enlace de recuperacion no es valido. Solicita uno nuevo.
          </p>
          <Link to="/forgot-password" className="btn-primary inline-block w-full text-center">
            Solicitar nuevo enlace
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validar reglas de password
    const reglas = validarPassword(password);
    const falla = reglas.find((r) => !r.cumple);
    if (falla) {
      setError(falla.mensaje);
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contrasenas no coinciden');
      return;
    }

    setLoading(true);
    try {
      await authAPI.resetPassword({ token, password });
      setDone(true);
    } catch (err) {
      setError(err.message || 'Error al restablecer la contrasena');
    } finally {
      setLoading(false);
    }
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
          <h1 className="font-display font-bold text-2xl text-white">Nueva contrasena</h1>
          <p className="text-campo-200 text-sm mt-1">Ingresa tu nueva contrasena segura</p>
        </div>

        {!done ? (
          <form onSubmit={handleSubmit} className="card p-6 space-y-4 animate-slide-up" noValidate>
            {/* Error general */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Nueva contrasena */}
            <div>
              <label className="label">Nueva contrasena</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(null); }}
                  className="input-field pl-11 pr-11"
                  placeholder="Min. 8 caracteres"
                  autoComplete="new-password"
                />
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-tierra-400" />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-tierra-400 hover:text-tierra-600"
                  tabIndex={-1}
                >
                  {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <PasswordRules password={password} />
            </div>

            {/* Confirmar contrasena */}
            <div>
              <label className="label">Confirmar contrasena</label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setError(null); }}
                  className={`input-field pl-11 pr-11 ${
                    confirmPassword && confirmPassword !== password
                      ? '!border-red-400 !ring-red-100'
                      : confirmPassword && confirmPassword === password
                        ? '!border-campo-400 !ring-campo-100'
                        : ''
                  }`}
                  placeholder="Repite tu contrasena"
                  autoComplete="new-password"
                />
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-tierra-400" />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-tierra-400 hover:text-tierra-600"
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {confirmPassword && confirmPassword !== password && (
                <p className="text-red-500 text-xs mt-1">Las contrasenas no coinciden</p>
              )}
              {confirmPassword && confirmPassword === password && (
                <p className="text-campo-600 text-xs mt-1 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Las contrasenas coinciden
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full text-center flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : null}
              {loading ? 'Guardando...' : 'Restablecer contrasena'}
            </button>
          </form>
        ) : (
          /* Exito */
          <div className="card p-8 text-center animate-slide-up">
            <div className="w-16 h-16 bg-campo-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-campo-600" />
            </div>
            <h2 className="font-display font-bold text-xl mb-2 text-tierra-900">
              Contrasena actualizada
            </h2>
            <p className="text-tierra-500 text-sm mb-6">
              Tu contrasena fue cambiada exitosamente. Ya puedes iniciar sesion.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="btn-primary w-full"
            >
              Ir a iniciar sesion
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
