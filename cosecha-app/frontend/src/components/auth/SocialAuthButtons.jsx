import { useEffect, useRef, useState, useCallback } from 'react';
import { GoogleIcon, AppleIcon } from './icons';

const GIS_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';
const APPLE_SCRIPT_SRC = 'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js';

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      if (existing.dataset.loaded) return resolve();
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', reject, { once: true });
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.defer = true;
    script.onload = () => { script.dataset.loaded = 'true'; resolve(); };
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

/**
 * Botón social estilizado.
 */
function SocialButton({ icon, label, onClick, disabled, variant = 'light', loading }) {
  const base =
    'group relative w-full h-12 inline-flex items-center justify-center gap-3 rounded-xl ' +
    'text-sm font-semibold transition-all duration-200 active:scale-[0.99] ' +
    'disabled:opacity-50 disabled:cursor-not-allowed';

  const theme =
    variant === 'dark'
      ? 'bg-[#000000] text-white border border-[#000000] hover:bg-[#1a1a1a] shadow-sm hover:shadow-md'
      : 'bg-white text-tierra-800 border border-tierra-200 hover:border-tierra-300 hover:bg-tierra-50/70 shadow-sm hover:shadow-md';

  return (
    <button type="button" onClick={onClick} disabled={disabled || loading} className={`${base} ${theme}`}>
      {loading ? (
        <span className={`w-5 h-5 border-2 rounded-full animate-spin ${
          variant === 'dark' ? 'border-white/30 border-t-white' : 'border-tierra-300 border-t-tierra-700'
        }`} />
      ) : (
        <span className="shrink-0 w-5 h-5 flex items-center justify-center">{icon}</span>
      )}
      <span>{label}</span>
    </button>
  );
}

/**
 * Botones de login social: Google + Apple.
 * Ambos usan botones custom con el mismo estilo.
 * Google: usa GIS popup flow.
 * Apple: usa Apple JS SDK popup flow.
 */
export default function SocialAuthButtons({ onGoogleCredential, onAppleAuth, disabled }) {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const appleClientId = import.meta.env.VITE_APPLE_CLIENT_ID;

  const [googleReady, setGoogleReady] = useState(false);
  const [appleReady, setAppleReady] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);

  const googleCallbackRef = useRef(onGoogleCredential);
  useEffect(() => { googleCallbackRef.current = onGoogleCredential; }, [onGoogleCredential]);

  // ── Inicializar Google ──
  useEffect(() => {
    if (!googleClientId) return;
    loadScript(GIS_SCRIPT_SRC)
      .then(() => {
        if (!window.google?.accounts?.id) return;
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: (response) => {
            if (response?.credential) {
              googleCallbackRef.current?.(response.credential);
            }
          },
          auto_select: false,
          itp_support: true,
        });
        setGoogleReady(true);
      })
      .catch(() => {});
  }, [googleClientId]);

  // ── Inicializar Apple ──
  useEffect(() => {
    if (!appleClientId) return;
    loadScript(APPLE_SCRIPT_SRC)
      .then(() => {
        if (window.AppleID) setAppleReady(true);
      })
      .catch(() => {});
  }, [appleClientId]);

  // ── Handlers ──
  const handleGoogleClick = useCallback(() => {
    if (!googleReady || !window.google?.accounts?.id) return;
    setGoogleLoading(true);
    // GIS popup flow - el callback se maneja en initialize
    window.google.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        // Fallback: usar el botón de login popup
        window.google.accounts.id.prompt();
      }
      setGoogleLoading(false);
    });
  }, [googleReady]);

  const handleAppleClick = useCallback(async () => {
    if (!appleReady || !window.AppleID) return;
    setAppleLoading(true);
    try {
      const response = await window.AppleID.auth.signIn({
        clientId: appleClientId,
        scope: 'name email',
        redirectURI: window.location.origin,
        usePopup: true,
      });

      if (response?.authorization?.id_token) {
        onAppleAuth?.({
          identityToken: response.authorization.id_token,
          fullName: response.user ? {
            givenName: response.user.name?.firstName,
            familyName: response.user.name?.lastName,
          } : null,
        });
      }
    } catch (err) {
      // Usuario cerró el popup - no es un error
      if (err?.error !== 'popup_closed_by_user') {
        console.error('Apple Sign In error:', err);
      }
    } finally {
      setAppleLoading(false);
    }
  }, [appleReady, appleClientId, onAppleAuth]);

  return (
    <div className="space-y-2.5">
      {/* Google */}
      <SocialButton
        icon={<GoogleIcon className="w-5 h-5" />}
        label="Continuar con Google"
        onClick={handleGoogleClick}
        disabled={disabled || !googleReady}
        loading={googleLoading}
        variant="light"
      />

      {/* Apple */}
      <SocialButton
        icon={<AppleIcon className="w-5 h-5 text-white" />}
        label="Continuar con Apple"
        onClick={handleAppleClick}
        disabled={disabled || (!appleReady && !!appleClientId)}
        loading={appleLoading}
        variant="dark"
      />
    </div>
  );
}
