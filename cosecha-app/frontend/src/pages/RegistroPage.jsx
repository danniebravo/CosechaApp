import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sprout } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function RegistroPage() {
  const { registro } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ nombre: '', email: '', password: '', telefono: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nombre || !form.email || !form.password) {
      toast.error('Completa los campos requeridos'); return;
    }
    if (form.password.length < 6) { toast.error('La contraseña debe tener al menos 6 caracteres'); return; }
    setLoading(true);
    try {
      await registro(form);
      toast.success('Cuenta creada');
      navigate('/onboarding');
    } catch (err) {
      toast.error(err.message || 'Error al registrar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-campo-800 via-campo-700 to-campo-900 flex items-center justify-center p-4">
      <Toaster position="top-center" />
      <div className="w-full max-w-sm">
        <div className="text-center mb-8 animate-fade-in">
          <div className="w-16 h-16 bg-white/10 backdrop-blur rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Sprout className="w-9 h-9 text-white" />
          </div>
          <h1 className="font-display font-bold text-3xl text-white">Crear cuenta</h1>
          <p className="text-campo-200 text-sm mt-1">Empieza a gestionar tus cosechas</p>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 space-y-4 animate-slide-up">
          <div>
            <label className="label">Nombre completo *</label>
            <input name="nombre" value={form.nombre} onChange={handleChange}
              className="input-field" placeholder="Tu nombre" />
          </div>
          <div>
            <label className="label">Correo electrónico *</label>
            <input name="email" type="email" value={form.email} onChange={handleChange}
              className="input-field" placeholder="tu@correo.com" />
          </div>
          <div>
            <label className="label">Teléfono</label>
            <input name="telefono" value={form.telefono} onChange={handleChange}
              className="input-field" placeholder="300 123 4567" />
          </div>
          <div>
            <label className="label">Contraseña *</label>
            <input name="password" type="password" value={form.password} onChange={handleChange}
              className="input-field" placeholder="Mínimo 6 caracteres" />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full text-center">
            {loading ? 'Registrando...' : 'Crear cuenta'}
          </button>
        </form>

        <p className="text-center text-campo-200 text-sm mt-5">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="font-semibold text-white underline underline-offset-2">Inicia sesión</Link>
        </p>
      </div>
    </div>
  );
}
