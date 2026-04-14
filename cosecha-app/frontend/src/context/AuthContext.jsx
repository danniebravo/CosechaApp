import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => {
    const saved = localStorage.getItem('usuario');
    return saved ? JSON.parse(saved) : null;
  });
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const verificar = async () => {
      const token = localStorage.getItem('token');
      if (!token) { setCargando(false); return; }
      try {
        const perfil = await authAPI.perfil();
        setUsuario(perfil);
        localStorage.setItem('usuario', JSON.stringify(perfil));
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        setUsuario(null);
      }
      setCargando(false);
    };
    verificar();
  }, []);

  const login = async (email, password) => {
    const { usuario: usr, token } = await authAPI.login({ email, password });
    localStorage.setItem('token', token);
    localStorage.setItem('usuario', JSON.stringify(usr));
    setUsuario(usr);
    return usr;
  };

  const registro = async (datos) => {
    const { usuario: usr, token } = await authAPI.registro(datos);
    localStorage.setItem('token', token);
    localStorage.setItem('usuario', JSON.stringify(usr));
    setUsuario(usr);
    return usr;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    setUsuario(null);
  };

  /**
   * Actualiza onboarding_completed en el estado del usuario.
   * Se llama después de completar el wizard de onboarding.
   */
  const setOnboardingCompleted = useCallback(() => {
    setUsuario((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, onboarding_completed: true };
      localStorage.setItem('usuario', JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider value={{
      usuario, cargando, login, registro, logout,
      isAuth: !!usuario,
      onboardingCompleted: usuario?.onboarding_completed ?? false,
      setOnboardingCompleted,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
};
