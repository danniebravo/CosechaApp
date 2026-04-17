import { useEffect, useRef, useState } from 'react';
import { GoogleIcon, AppleIcon } from './icons';

const GIS_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

function loadGoogleScript() {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) return resolve();
    const existing = document.querySelector(`script[src="${GIS_SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', reject, { once: true });
      return;
    }
    const script = document.createElement('script');
    script.src   = GIS_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload  = () => resolve();
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

/**
 * Botón social genérico. Soporta variante "light" (Google placeholder) y
 * "dark" (Apple) para diferenciar visualmente los dos proveedores.
 */
function SocialButton({ icon, label, onClick, disabled, hint, variant = 'light' }) {
  const base =
    'group relative w-full h-11 inline-flex items-center justify-center gap-2.5 rounded-xl ' +
    'text-[13.5px] font-semibold transition-all duration-200 active:scale-[0.99] ' +
    'disabled:opacity-60 disabled:cursor-not-allowed';

  const theme =
    variant === 'dark'
      ? 'bg-tierra-900 text-white border border-tierra-900 hover:bg-tierra-800 ' +
        'disabled:hover:bg-tierra-900 shadow-sm hover:shadow-md hover:shadow-tierra-900/20'
      : 'bg-white text-tierra-800 border border-tierra-200 hover:border-tierra-300 ' +
        'hover:bg-tierra-50/70 disabled:hover:bg-white disabled:hover:border-tierra-200';

  const hintColor = variant === 'dark' ? 'text-white/50' : 'text-tierra-400';

  return (
    <button type="button" onClick={onClick} disabled={disabled} className={`${base} ${theme}`}>
      <span className="shrink-0">{icon}</span>
      <span>{label}</span>
      {hint && (
        <span
          className={`absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold uppercase tracking-wider ${hintColor}`}
        >
          {hint}
        </span>
      )}
    </button>
  );
}

/**
 * Wrapper del botón oficial de Google (Google Identity Services).
 * Usamos `renderButton` (botón oficial Google) en vez de One Tap porque
 * es más confiable: funciona en Safari, Brave, modo privado y no depende
 * de cookies de terceros.
 */
function GoogleSignInButton({ clientId, onCredential, disabled }) {
  const containerRef = useRef(null);
  const callbackRef  = useRef(onCredential);
  const [ready, setReady]   = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => { callbackRef.current = onCredential; }, [onCredential]);

  useEffect(() => {
    let cancelled = false;
    let observer;

    loadGoogleScript()
      .then(() => {
        if (cancelled || !window.google?.accounts?.id) return;

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            if (response?.credential) callbackRef.current?.(response.credential);
          },
          auto_select: false,
          itp_support: true,
        });

        const renderButton = () => {
          const el = containerRef.current;
          if (!el || !window.google?.accounts?.id) return;
          el.innerHTML = '';
          const width = Math.min(400, Math.max(220, el.offsetWidth || 320));
          window.google.accounts.id.renderButton(el, {
            type: 'standard',
            theme: 'outline',
            size: 'large',
            text: 'continue_with',
            shape: 'rectangular',
            logo_alignment: 'left',
            locale: 'es',
            width,
          });
        };

        renderButton();
        setReady(true);

        if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
          observer = new ResizeObserver(renderButton);
          observer.observe(containerRef.current);
        }
      })
      .catch(() => setFailed(true));

    return () => {
      cancelled = true;
      if (observer) observer.disconnect();
    };
  }, [clientId]);

  if (failed) {
    return (
      <SocialButton
        icon={<GoogleIcon />}
        label="Continuar con Google"
        disabled
        hint="No disponible"
      />
    );
  }

  return (
    <div className={`relative w-full ${disabled ? 'pointer-events-none opacity-60' : ''}`}>
      {!ready && (
        <div className="h-11 rounded-xl border border-tierra-200 bg-tierra-50/50 animate-pulse" />
      )}
      <div
        ref={containerRef}
        className="flex justify-center [&>div]:!w-full [&_iframe]:!w-full"
      />
    </div>
  );
}

/**
 * Botones sociales del login: Google funcional + Apple preparado.
 * Google conserva su branding blanco oficial; Apple usa estilo oscuro.
 */
export default function SocialAuthButtons({ onGoogleCredential, disabled }) {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  return (
    <div className="space-y-2.5">
      {googleClientId ? (
        <GoogleSignInButton
          clientId={googleClientId}
          onCredential={onGoogleCredential}
          disabled={disabled}
        />
      ) : (
        <SocialButton
          icon={<GoogleIcon />}
          label="Continuar con Google"
          disabled
          hint="Próximamente"
        />
      )}

      <SocialButton
        icon={<AppleIcon className="w-[18px] h-[18px] text-white" />}
        label="Continuar con Apple"
        disabled
        hint="Próximamente"
        variant="dark"
      />
    </div>
  );
}
