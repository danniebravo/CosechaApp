import { AlertCircle, AlertTriangle, X } from 'lucide-react';

export default function ErrorAlert({ message, variant = 'error', action, onDismiss }) {
  if (!message) return null;

  const styles = {
    error:   'bg-red-50/70 border-red-200/80 text-red-800',
    warning: 'bg-cosecha-50/70 border-cosecha-200/80 text-cosecha-900',
  };
  const dismissHover = {
    error:   'hover:bg-red-100/70 text-red-500/70 hover:text-red-700',
    warning: 'hover:bg-cosecha-100/70 text-cosecha-700/70 hover:text-cosecha-800',
  };
  const Icon = variant === 'warning' ? AlertTriangle : AlertCircle;
  const iconColor = variant === 'warning' ? 'text-cosecha-600' : 'text-red-500';

  return (
    <div
      role="alert"
      className={`relative flex items-start gap-3 rounded-xl border px-4 py-3 text-sm leading-snug animate-fade-in backdrop-blur-[2px] ${styles[variant]}`}
    >
      <Icon className={`w-[18px] h-[18px] shrink-0 mt-[1px] ${iconColor}`} strokeWidth={2.2} />
      <div className={`flex-1 ${onDismiss ? 'pr-5' : ''}`}>
        <p className="font-medium">{message}</p>
        {action && <div className="mt-1.5">{action}</div>}
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Cerrar alerta"
          className={`absolute right-2 top-2 p-1 rounded-md transition-colors ${dismissHover[variant]}`}
        >
          <X className="w-3.5 h-3.5" strokeWidth={2.4} />
        </button>
      )}
    </div>
  );
}
