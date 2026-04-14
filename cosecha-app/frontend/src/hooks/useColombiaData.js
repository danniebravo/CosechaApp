import { useMemo } from 'react';
import colombiaData from '../data/co.json';

/**
 * Hook para manejar datos geográficos de Colombia.
 * Devuelve departamentos y municipios filtrados por departamento seleccionado.
 *
 * @param {string} departamento - Nombre del departamento seleccionado
 * @returns {{ departamentos: string[], municipios: string[] }}
 */
export function useColombiaData(departamento) {
  const departamentos = useMemo(
    () => colombiaData.map((d) => d.nombre),
    []
  );

  const municipios = useMemo(() => {
    if (!departamento) return [];
    const dep = colombiaData.find((d) => d.nombre === departamento);
    return dep ? dep.municipios : [];
  }, [departamento]);

  return { departamentos, municipios };
}
