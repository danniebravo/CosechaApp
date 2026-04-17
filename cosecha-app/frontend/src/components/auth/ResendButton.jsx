/**
 * Boton de reenvio con cuenta regresiva integrada.
 *
 * - active=true  → "{label} en mm:ss" deshabilitado
 * - active=false → "{label}" habilitado
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
}) {
  const disabled = active || loading;
  const text = loading
    ? 'Enviando…'
    : active
      ? `${label} en ${formatted}`
      : label;

  if (variant === 'button') {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="w-full h-12 inline-flex items-center justify-center gap-2 rounded-xl border border-tierra-200 bg-white text-tierra-800 text-sm font-semibold transition-all hover:border-campo-300 hover:bg-campo-50/60 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-tierra-200"
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
      className="text-sm font-semibold text-campo-700 hover:text-campo-800 disabled:text-tierra-400 disabled:cursor-not-allowed transition-colors"
    >
      {text}
    </button>
  );
}
