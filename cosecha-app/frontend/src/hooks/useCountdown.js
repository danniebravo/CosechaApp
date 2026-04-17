import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Cuenta regresiva en segundos.
 *
 * @param {number} initial  segundos iniciales (0 = inactivo)
 * @returns {{
 *   secondsLeft: number,
 *   formatted: string,    // 'mm:ss'
 *   active: boolean,
 *   start: (s: number) => void,
 *   reset: () => void,
 * }}
 */
export function useCountdown(initial = 0) {
  const [secondsLeft, setSecondsLeft] = useState(Math.max(0, Math.floor(initial)));
  const intervalRef = useRef(null);

  const stop = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    if (secondsLeft <= 0) { stop(); return; }
    if (intervalRef.current) return;

    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) { stop(); return 0; }
        return s - 1;
      });
    }, 1000);

    return stop;
  }, [secondsLeft]);

  // Cleanup al desmontar
  useEffect(() => stop, []);

  const start = useCallback((s) => {
    const n = Math.max(0, Math.floor(Number(s) || 0));
    setSecondsLeft(n);
  }, []);

  const reset = useCallback(() => setSecondsLeft(0), []);

  return {
    secondsLeft,
    formatted: formatMMSS(secondsLeft),
    active: secondsLeft > 0,
    start,
    reset,
  };
}

function formatMMSS(total) {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
