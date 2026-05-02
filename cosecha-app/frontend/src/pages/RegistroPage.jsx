import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sprout, Eye, EyeOff, Check, X, ChevronDown } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import PasswordStrengthBar from '../components/auth/PasswordStrengthBar';
import {
  PREFIJOS_TELEFONICOS,
  getPrefijoConfig,
  validarPassword,
  validarEmail,
  validarTelefono,
  validarNombre,
} from '../utils/helpers';

// ── Componente de error por campo ──
function FieldError({ error }) {
  if (!error) return null;
  return <p className="text-red-500 text-xs mt-1 animate-fade-in">{error}</p>;
}

// ── Indicador de reglas de contraseña ──
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

export default function RegistroPage() {
  const { registro } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nombre: '',
    email: '',
    password: '',
    confirmar_password: '',
    telefono: '',
    telefono_prefijo: '+57',
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // ── Handlers ──
  const handleChange = (e) => {
    const { name, value } = e.target;

    // Solo dígitos para teléfono, respetar máximo del país
    if (name === 'telefono') {
      const soloNumeros = value.replace(/[^\d]/g, '');
      const config = getPrefijoConfig(form.telefono_prefijo);
      const truncado = soloNumeros.slice(0, config.digitos);
      setForm((prev) => ({ ...prev, [name]: truncado }));
    } else if (name === 'telefono_prefijo') {
      // Al cambiar país, limpiar teléfono si excede dígitos del nuevo país
      const newConfig = getPrefijoConfig(value);
      setForm((prev) => ({
        ...prev,
        [name]: value,
        telefono: prev.telefono.slice(0, newConfig.digitos),
      }));
      if (errors.telefono) setErrors((prev) => ({ ...prev, telefono: null }));
      return;
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }

    // Limpiar error al escribir
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    validateField(name);
  };

  const validateField = (name) => {
    let error = null;
    switch (name) {
      case 'nombre':
        error = validarNombre(form.nombre);
        break;
      case 'email':
        error = validarEmail(form.email);
        break;
      case 'password': {
        const reglas = validarPassword(form.password);
        const falla = reglas.find((r) => !r.cumple);
        error = falla ? falla.mensaje : null;
        break;
      }
      case 'confirmar_password':
        if (!form.confirmar_password) error = 'Confirma tu contrasena';
        else if (form.confirmar_password !== form.password) error = 'Las contrasenas no coinciden';
        break;
      case 'telefono':
        error = validarTelefono(form.telefono, form.telefono_prefijo);
        break;
    }
    setErrors((prev) => ({ ...prev, [name]: error }));
    return error;
  };

  const validateAll = () => {
    const campos = ['nombre', 'email', 'password', 'confirmar_password', 'telefono'];
    const nuevosErrors = {};
    let hayError = false;

    campos.forEach((campo) => {
      let error = null;
      switch (campo) {
        case 'nombre':
          error = validarNombre(form.nombre);
          break;
        case 'email':
          error = validarEmail(form.email);
          break;
        case 'password': {
          const reglas = validarPassword(form.password);
          const falla = reglas.find((r) => !r.cumple);
          error = falla ? falla.mensaje : null;
          break;
        }
        case 'confirmar_password':
          if (!form.confirmar_password) error = 'Confirma tu contrasena';
          else if (form.confirmar_password !== form.password) error = 'Las contrasenas no coinciden';
          break;
        case 'telefono':
          error = validarTelefono(form.telefono, form.telefono_prefijo);
          break;
      }
      nuevosErrors[campo] = error;
      if (error) hayError = true;
    });

    setErrors(nuevosErrors);
    setTouched({ nombre: true, email: true, password: true, confirmar_password: true, telefono: true });
    return !hayError;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateAll()) return;

    setLoading(true);
    try {
      const usr = await registro(form);
      toast.success('Cuenta creada. Revisa tu correo para verificar.');
      navigate(usr.email_verified ? (usr.onboarding_completed ? '/' : '/onboarding') : '/verify-email');
    } catch (err) {
      const msg = err.message || 'Error al registrar';
      // Errores específicos del backend
      if (err.data?.detalles) {
        const backendErrors = {};
        err.data.detalles.forEach((d) => {
          backendErrors[d.campo] = d.mensaje;
        });
        setErrors((prev) => ({ ...prev, ...backendErrors }));
      } else if (msg.includes('email')) {
        setErrors((prev) => ({ ...prev, email: msg }));
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  // Prefijo seleccionado con config de dígitos
  const prefijoActual = getPrefijoConfig(form.telefono_prefijo);

  // Función para clase de input con error
  const inputClass = (field) =>
    `input-field ${touched[field] && errors[field] ? '!border-red-400 !ring-red-100' : ''}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-campo-800 via-campo-700 to-campo-900 flex items-center justify-center p-4">
      <Toaster position="top-center" />
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="w-16 h-16 bg-white/10 backdrop-blur rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Sprout className="w-9 h-9 text-white" />
          </div>
          <h1 className="font-display font-bold text-3xl text-white">Crear cuenta</h1>
          <p className="text-campo-200 text-sm mt-1">Empieza a gestionar tus cosechas</p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="card p-6 space-y-4 animate-slide-up" noValidate>
          {/* Nombre */}
          <div>
            <label className="label">Nombre completo *</label>
            <input
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              onBlur={handleBlur}
              className={inputClass('nombre')}
              placeholder="Tu nombre completo"
              autoComplete="name"
            />
            <FieldError error={touched.nombre && errors.nombre} />
          </div>

          {/* Email */}
          <div>
            <label className="label">Correo electr&oacute;nico *</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              onBlur={handleBlur}
              className={inputClass('email')}
              placeholder="tu@correo.com"
              autoComplete="email"
            />
            <FieldError error={touched.email && errors.email} />
          </div>

          {/* Teléfono */}
          <div>
            <label className="label">Tel&eacute;fono</label>
            <div className="flex gap-2">
              {/* Selector de prefijo */}
              <div className="relative shrink-0">
                <select
                  name="telefono_prefijo"
                  value={form.telefono_prefijo}
                  onChange={handleChange}
                  className="input-field !w-[120px] appearance-none pr-7 cursor-pointer"
                >
                  {PREFIJOS_TELEFONICOS.map((p) => (
                    <option key={p.codigo} value={p.codigo}>
                      {p.bandera} {p.codigo}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-tierra-400 pointer-events-none" />
              </div>
              {/* Número */}
              <input
                name="telefono"
                type="tel"
                value={form.telefono}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`${inputClass('telefono')} flex-1`}
                placeholder={prefijoActual.placeholder}
                maxLength={prefijoActual.digitos}
                inputMode="numeric"
                autoComplete="tel-national"
              />
            </div>
            <FieldError error={touched.telefono && errors.telefono} />
          </div>

          {/* Contraseña */}
          <div>
            <label className="label">Contrase&ntilde;a *</label>
            <div className="relative">
              <input
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`${inputClass('password')} pr-11`}
                placeholder="M\u00edn. 8 caracteres"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-tierra-400 hover:text-tierra-600 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <PasswordStrengthBar password={form.password} />
            <PasswordRules password={form.password} />
          </div>

          {/* Confirmar contraseña */}
          <div>
            <label className="label">Confirmar contrasena *</label>
            <div className="relative">
              <input
                name="confirmar_password"
                type={showPassword ? 'text' : 'password'}
                value={form.confirmar_password}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`${inputClass('confirmar_password')} pr-11 ${
                  form.confirmar_password && form.confirmar_password === form.password
                    ? '!border-campo-400 !ring-campo-100' : ''
                }`}
                placeholder="Repite tu contrasena"
                autoComplete="new-password"
              />
              {form.confirmar_password && form.confirmar_password === form.password && (
                <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-campo-500" />
              )}
            </div>
            <FieldError error={touched.confirmar_password && errors.confirmar_password} />
          </div>

          {/* Submit */}
          <button type="submit" disabled={loading} className="btn-primary w-full text-center">
            {loading ? 'Registrando...' : 'Crear cuenta'}
          </button>
        </form>

        <p className="text-center text-campo-200 text-sm mt-5">
          &iquest;Ya tienes cuenta?{' '}
          <Link to="/login" className="font-semibold text-white underline underline-offset-2">
            Inicia sesi&oacute;n
          </Link>
        </p>
      </div>
    </div>
  );
}
