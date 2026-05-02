/**
 * Boton de reenvio con cuenta regresiva integrada y estado de quota agotada.
 *
 * - active=true  → "{label} en mm:ss" deshabilitado
 * - active=false → "{label}" habilitado
 * - blocked=true → "Demasiados intentos" deshabilitado permanentemente
 *
 * Variantes:
 *   variant="link"   → estilo enlace pequeno (uso secundario, dentro de form)
 *   variant="button" → boton outline ancho (uso primario, p.ej. EmailSent)
 */
export default function ResendButton({
  active,
  formatted,
  label = 'Reenviar',
  loading = false,
  onClick,
  variant = 'link',
  blocked = false,
}) {
  const disabled = active || loading || blocked;

  let text;
  if (blocked) {
    text = 'Demasiados intentos. Intenta mas tarde.';
  } else if (loading) {
    text = 'Enviando...';
  } else if (active) {
    text = `${label} en ${formatted}`;
  } else {
    text = label;
  }

  if (variant === 'button') {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={`w-full h-12 inline-flex items-center justify-center gap-2 rounded-xl border text-sm font-semibold transition-all active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed ${
          blocked
            ? 'border-red-200 bg-red-50 text-red-600 disabled:hover:bg-red-50'
            : 'border-tierra-200 bg-white text-tierra-800 hover:border-campo-300 hover:bg-campo-50/60 disabled:hover:bg-white disabled:hover:border-tierra-200'
        }`}
      >
        {loading && <span className="w-4 h-4 border-2 border-tierra-300 border-t-tierra-700 rounded-full animate-spin" />}
        {text}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`text-sm font-semibold transition-colors ${
        blocked
          ? 'text-red-500 cursor-not-allowed'
          : 'text-campo-700 hover:text-campo-800 disabled:text-tierra-400 disabled:cursor-not-allowed'
      }`}
    >
      {text}
    </button>
  );
}
