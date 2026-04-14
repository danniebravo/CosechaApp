import { Loader2, AlertCircle, ChevronLeft, X } from 'lucide-react';

export function Spinner({ size = 'md' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };
  return (
    <div className="flex justify-center items-center py-8">
      <Loader2 className={`${sizes[size]} animate-spin text-campo-600`} />
    </div>
  );
}

export function LoadingPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-10 h-10 animate-spin text-campo-600 mx-auto mb-3" />
        <p className="text-tierra-500 text-sm">Cargando...</p>
      </div>
    </div>
  );
}

export function ErrorMsg({ message, onRetry }) {
  return (
    <div className="card p-6 text-center">
      <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
      <p className="text-tierra-700 mb-4">{message}</p>
      {onRetry && <button onClick={onRetry} className="btn-primary text-sm">Reintentar</button>}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="card p-10 text-center animate-fade-in">
      {Icon && <Icon className="w-14 h-14 text-tierra-300 mx-auto mb-4" strokeWidth={1.5} />}
      <h3 className="font-display font-bold text-lg text-tierra-700 mb-2">{title}</h3>
      <p className="text-tierra-500 text-sm mb-5 max-w-md mx-auto">{description}</p>
      {action}
    </div>
  );
}

export function PageHeader({ title, subtitle, backTo, onBack, action }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div className="flex items-center gap-3">
        {onBack && (
          <button onClick={onBack} className="p-2 hover:bg-tierra-100 rounded-xl transition-colors">
            <ChevronLeft className="w-5 h-5 text-tierra-600" />
          </button>
        )}
        <div>
          <h1 className="page-title">{title}</h1>
          {subtitle && <p className="text-tierra-500 text-sm mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

export function Badge({ children, variant = 'default' }) {
  const styles = {
    default: 'bg-tierra-100 text-tierra-700',
    success: 'bg-campo-100 text-campo-800',
    warning: 'bg-cosecha-100 text-cosecha-800',
    danger: 'bg-red-100 text-red-700',
    info: 'bg-blue-100 text-blue-700',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${styles[variant]}`}>
      {children}
    </span>
  );
}

export function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-lg' }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-white w-full ${maxWidth} rounded-t-3xl sm:rounded-2xl shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto`}>
        <div className="sticky top-0 bg-white flex items-center justify-between p-5 border-b border-tierra-100 rounded-t-3xl sm:rounded-t-2xl z-10">
          <h2 className="font-display font-bold text-lg">{title}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-tierra-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function StatCard({ label, value, icon: Icon, color = 'campo', sub }) {
  const colors = {
    campo: 'bg-campo-50 text-campo-700',
    cosecha: 'bg-cosecha-50 text-cosecha-700',
    tierra: 'bg-tierra-50 text-tierra-700',
    red: 'bg-red-50 text-red-600',
    blue: 'bg-blue-50 text-blue-600',
  };
  return (
    <div className="stat-card animate-fade-in">
      <div className="flex items-center gap-2 mb-1">
        {Icon && (
          <div className={`p-1.5 rounded-lg ${colors[color]}`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
        <span className="text-xs font-medium text-tierra-500 uppercase tracking-wide">{label}</span>
      </div>
      <span className="text-xl font-display font-bold text-tierra-900">{value}</span>
      {sub && <span className="text-xs text-tierra-500">{sub}</span>}
    </div>
  );
}

export function ConfirmDialog({ isOpen, onClose, onConfirm, title, message }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full animate-slide-up">
        <h3 className="font-display font-bold text-lg mb-2">{title}</h3>
        <p className="text-tierra-600 text-sm mb-5">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="btn-secondary text-sm">Cancelar</button>
          <button onClick={onConfirm} className="btn-danger text-sm">Eliminar</button>
        </div>
      </div>
    </div>
  );
}
