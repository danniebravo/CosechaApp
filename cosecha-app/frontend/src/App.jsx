import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ProtectedRoute, PublicRoute } from './routes/Guards';
import AppLayout from './components/layout/AppLayout';
import LoginPage from './pages/LoginPage';
import RegistroPage from './pages/RegistroPage';
import DashboardPage from './pages/DashboardPage';
import FincasPage from './pages/FincasPage';
import LotesPage from './pages/LotesPage';
import CosechasPage from './pages/CosechasPage';
import CosechaDetallePage from './pages/CosechaDetallePage';
import OnboardingPage from './pages/OnboardingPage';
import AlertasPage from './pages/AlertasPage';

export default function App() {
  return (
    <>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: { borderRadius: '12px', padding: '12px 16px', fontSize: '14px' },
          success: { iconTheme: { primary: '#3d9641', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />
      <Routes>
        {/* Rutas públicas */}
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/registro" element={<PublicRoute><RegistroPage /></PublicRoute>} />

        {/* Onboarding (protegida, sin sidebar) */}
        <Route path="/onboarding" element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />

        {/* Rutas protegidas */}
        <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route index element={<DashboardPage />} />
          <Route path="fincas" element={<FincasPage />} />
          <Route path="fincas/:fincaId" element={<LotesPage />} />
          <Route path="cosechas" element={<CosechasPage />} />
          <Route path="cosechas/:id" element={<CosechaDetallePage />} />
          <Route path="alertas" element={<AlertasPage />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={
          <div className="min-h-screen flex items-center justify-center bg-tierra-50">
            <div className="text-center">
              <h1 className="font-display font-bold text-6xl text-tierra-300">404</h1>
              <p className="text-tierra-500 mt-2">Página no encontrada</p>
              <a href="/" className="btn-primary inline-block mt-4 text-sm">Ir al inicio</a>
            </div>
          </div>
        } />
      </Routes>
    </>
  );
}
