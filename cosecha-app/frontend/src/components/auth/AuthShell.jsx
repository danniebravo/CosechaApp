import BrandPanel from './BrandPanel';
import MobileLogo from './MobileLogo';

/**
 * Layout compartido de las pantallas de autenticación.
 *
 * Desktop (lg+): split-screen con BrandPanel a la izquierda y formulario
 * a la derecha. Mobile/Tablet: una sola columna con MobileLogo arriba.
 */
export default function AuthShell({ children }) {
  return (
    <div className="min-h-screen bg-tierra-50 lg:grid lg:grid-cols-2">
      <BrandPanel />
      <div className="flex items-center justify-center px-4 sm:px-6 py-10 sm:py-14 lg:py-12">
        <div className="w-full max-w-[420px] animate-fade-in">
          <MobileLogo />
          {children}
        </div>
      </div>
    </div>
  );
}
