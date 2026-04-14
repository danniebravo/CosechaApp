import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoadingPage } from '../components/ui';

export function ProtectedRoute({ children }) {
  const { isAuth, cargando } = useAuth();
  if (cargando) return <LoadingPage />;
  if (!isAuth) return <Navigate to="/login" replace />;
  return children;
}

export function PublicRoute({ children }) {
  const { isAuth, cargando } = useAuth();
  if (cargando) return <LoadingPage />;
  if (isAuth) return <Navigate to="/" replace />;
  return children;
}
