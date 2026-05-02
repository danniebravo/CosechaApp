import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoadingPage } from '../components/ui';

/**
 * Rutas protegidas normales (dashboard, fincas, cosechas, etc.)
 * - No autenticado → /login
 * - Email no verificado → /verify-email
 * - Autenticado sin onboarding → /onboarding
 * - Autenticado con onboarding → renderiza children
 */
export function ProtectedRoute({ children }) {
  const { isAuth, cargando, emailVerified, onboardingCompleted } = useAuth();
  if (cargando) return <LoadingPage />;
  if (!isAuth) return <Navigate to="/login" replace />;
  if (!emailVerified) return <Navigate to="/verify-email" replace />;
  if (!onboardingCompleted) return <Navigate to="/onboarding" replace />;
  return children;
}

/**
 * Ruta pública (login, registro)
 * - Autenticado → redirige según estado
 * - No autenticado → renderiza children
 */
export function PublicRoute({ children }) {
  const { isAuth, cargando, emailVerified, onboardingCompleted } = useAuth();
  if (cargando) return <LoadingPage />;
  if (isAuth) {
    if (!emailVerified) return <Navigate to="/verify-email" replace />;
    return <Navigate to={onboardingCompleted ? '/' : '/onboarding'} replace />;
  }
  return children;
}

/**
 * Ruta exclusiva de verificación de email
 * - No autenticado → /login
 * - Ya verificado → redirige según onboarding
 * - Sin verificar → renderiza children
 */
export function VerifyEmailRoute({ children }) {
  const { isAuth, cargando, emailVerified, onboardingCompleted } = useAuth();
  if (cargando) return <LoadingPage />;
  if (!isAuth) return <Navigate to="/login" replace />;
  if (emailVerified) {
    return <Navigate to={onboardingCompleted ? '/' : '/onboarding'} replace />;
  }
  return children;
}

/**
 * Ruta exclusiva de onboarding
 * - No autenticado → /login
 * - Email no verificado → /verify-email
 * - Ya completó onboarding → /
 * - Sin completar → renderiza children
 */
export function OnboardingRoute({ children }) {
  const { isAuth, cargando, emailVerified, onboardingCompleted } = useAuth();
  if (cargando) return <LoadingPage />;
  if (!isAuth) return <Navigate to="/login" replace />;
  if (!emailVerified) return <Navigate to="/verify-email" replace />;
  if (onboardingCompleted) return <Navigate to="/" replace />;
  return children;
}
