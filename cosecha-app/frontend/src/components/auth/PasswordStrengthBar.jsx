import { useMemo } from 'react';
import { calcularFuerzaPassword } from '../../utils/helpers';

/**
 * Barra visual de fuerza de contraseña.
 * Muestra 4 segmentos que se llenan según la fuerza.
 */
export default function PasswordStrengthBar({ password }) {
  const fuerza = useMemo(() => calcularFuerzaPassword(password), [password]);

  if (!password) return null;

  return (
    <div className="mt-2">
      {/* Barra de 4 segmentos */}
      <div className="flex gap-1.5 mb-1.5">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
              i <= fuerza.nivel ? fuerza.color : 'bg-tierra-200'
            }`}
          />
        ))}
      </div>
      {/* Label */}
      <p className={`text-xs font-medium transition-colors ${
        fuerza.nivel <= 1 ? 'text-red-500'
        : fuerza.nivel === 2 ? 'text-cosecha-600'
        : 'text-campo-600'
      }`}>
        {fuerza.label}
      </p>
    </div>
  );
}
