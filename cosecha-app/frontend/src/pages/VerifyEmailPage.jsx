import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { useCountdown } from '../hooks/useCountdown';
import ResendButton from '../components/auth/ResendButton';
import { Mail, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

export default function VerifyEmailPage() {
  const { usuario, setEmailVerified } = useAuth();
  const navigate = useNavigate();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [quotaBlocked, setQuotaBlocked] = useState(false);
  const inputsRef = useRef([]);
  const countdown = useCountdown(15);

  // Focus primer input al montar
  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  const handleChange = (index, value) => {
    // Solo dígitos
    const digit = value.replace(/[^\d]/g, '');
    if (!digit && value !== '') return;

    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);
    setError('');

    // Auto-focus siguiente
    if (digit && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }

    // Auto-submit cuando se llena
    if (digit && index === 5) {
      const fullCode = newCode.join('');
      if (fullCode.length === 6) {
        handleVerify(fullCode);
      }
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/[^\d]/g, '').slice(0, 6);
    if (!pasted) return;

    const newCode = [...code];
    for (let i = 0; i < 6; i++) {
      newCode[i] = pasted[i] || '';
    }
    setCode(newCode);

    if (pasted.length === 6) {
      handleVerify(pasted);
    } else {
      inputsRef.current[pasted.length]?.focus();
    }
  };

  const handleVerify = async (otp) => {
    if (loading) return;
    setLoading(true);
    setError('');

    try {
      await authAPI.verifyEmail({ otp });
      toast.success('Correo verificado');
      setEmailVerified();
      navigate('/onboarding');
    } catch (err) {
      const msg = err.data?.error || err.message || 'Error al verificar';
      setError(msg);
      setCode(['', '', '', '', '', '']);
      inputsRef.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError('');
    try {
      const result = await authAPI.sendEmailVerification();
      if (result.quota_exhausted) {
        setQuotaBlocked(true);
        countdown.start(result.retry_after_seconds || 3600);
      } else {
        countdown.start(result.retry_after_seconds || 15);
        toast.success('Codigo reenviado');
      }
    } catch (err) {
      toast.error(err.data?.error || 'Error al reenviar');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-campo-800 via-campo-700 to-campo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="w-16 h-16 bg-white/10 backdrop-blur rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Mail className="w-9 h-9 text-white" />
          </div>
          <h1 className="font-display font-bold text-3xl text-white">Verifica tu correo</h1>
          <p className="text-campo-200 text-sm mt-2">
            Enviamos un codigo de 6 digitos a
          </p>
          <p className="text-white font-semibold text-sm mt-1">
            {usuario?.email || 'tu correo'}
          </p>
        </div>

        {/* Card */}
        <div className="card p-6 animate-slide-up">
          {/* OTP Inputs */}
          <div className="flex justify-center gap-2 mb-6" onPaste={handlePaste}>
            {code.map((digit, i) => (
              <input
                key={i}
                ref={(el) => (inputsRef.current[i] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className={`w-12 h-14 text-center text-xl font-bold rounded-xl border-2 transition-all outline-none
                  ${error
                    ? 'border-red-400 bg-red-50 text-red-600'
                    : digit
                      ? 'border-campo-500 bg-campo-50 text-campo-800'
                      : 'border-tierra-200 bg-white text-tierra-800 focus:border-campo-500 focus:ring-2 focus:ring-campo-100'
                  }`}
                disabled={loading}
              />
            ))}
          </div>

          {/* Error */}
          {error && (
            <p className="text-red-500 text-sm text-center mb-4 animate-fade-in">{error}</p>
          )}

          {/* Verificar button */}
          <button
            onClick={() => handleVerify(code.join(''))}
            disabled={loading || code.join('').length < 6}
            className="btn-primary w-full text-center mb-4 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <ShieldCheck className="w-5 h-5" />
            )}
            {loading ? 'Verificando...' : 'Verificar correo'}
          </button>

          {/* Resend */}
          <div className="text-center">
            <p className="text-tierra-500 text-xs mb-2">
              No recibiste el codigo?
            </p>
            <ResendButton
              active={countdown.active}
              formatted={countdown.formatted}
              label="Reenviar codigo"
              loading={resending}
              onClick={handleResend}
              variant="link"
              blocked={quotaBlocked}
            />
          </div>
        </div>

        {/* Nota */}
        <p className="text-campo-300 text-xs text-center mt-4">
          Revisa la carpeta de spam si no lo encuentras
        </p>
      </div>
    </div>
  );
}
