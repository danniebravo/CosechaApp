import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoadingPage } from '../components/ui';

/**
 * Rutas protegidas normales (dashboard, fincas, cosechas, etc.)
 * - No autenticado → /login
 * - Autenticado sin onboarding → /onboarding
 * - Autenticado con onboarding → renderiza children
 */
export function ProtectedRoute({ children }) {
  const { isAuth, cargando, onboardingCompleted } = useAuth();
  if (cargando) return <LoadingPage />;
  if (!isAuth) return <Navigate to="/login" replace />;
  if (!onboardingCompleted) return <Navigate to="/onboarding" replace />;
  return children;
}

/**
 * Ruta pública (login, registro)
 * - Autenticado → redirige según onboarding
 * - No autenticado → renderiza children
 */
export function PublicRoute({ children }) {
  const { isAuth, cargando, onboardingCompleted } = useAuth();
  if (cargando) return <LoadingPage />;
  if (isAuth) {
    return <Navigate to={onboardingCompleted ? '/' : '/onboarding'} replace />;
  }
  return children;
}

/**
 * Ruta exclusiva de onboarding
 * - No autenticado → /login
 * - Ya completó onboarding → /
 * - Sin completar → renderiza children
 */
export function OnboardingRoute({ children }) {
  const { isAuth, cargando, onboardingCompleted } = useAuth();
  if (cargando) return <LoadingPage />;
  if (!isAuth) return <Navigate to="/login" replace />;
  if (onboardingCompleted) return <Navigate to="/" replace />;
  return children;
}
