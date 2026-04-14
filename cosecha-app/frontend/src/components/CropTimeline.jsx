const STAGES = [
  { name: 'Siembra', start: 0, end: 15, color: 'bg-campo-300' },
  { name: 'Brotacion', start: 15, end: 30, color: 'bg-campo-400' },
  { name: 'Desarrollo', start: 30, end: 60, color: 'bg-campo-500' },
  { name: 'Floracion', start: 60, end: 80, color: 'bg-cosecha-400' },
  { name: 'Tuberizacion', start: 80, end: 110, color: 'bg-cosecha-500' },
  { name: 'Maduracion', start: 110, end: 130, color: 'bg-cosecha-600' },
  { name: 'Cosecha', start: 130, end: 150, color: 'bg-tierra-500' },
];

function getCurrentStage(days) {
  for (let i = STAGES.length - 1; i >= 0; i--) {
    if (days >= STAGES[i].start) return i;
  }
  return 0;
}

export default function CropTimeline({ fechaSiembra, fechaCosechaReal, estado, compact = false }) {
  if (!fechaSiembra) return null;

  const siembra = new Date(fechaSiembra);
  const now = fechaCosechaReal ? new Date(fechaCosechaReal) : new Date();
  const days = Math.max(0, Math.floor((now - siembra) / (1000 * 60 * 60 * 24)));
  const totalDays = 150;
  const progress = Math.min(100, (days / totalDays) * 100);
  const currentStageIdx = getCurrentStage(days);
  const currentStage = STAGES[currentStageIdx];
  const isFinished = estado === 'cosechada' || estado === 'vendida' || estado === 'finalizada';

  if (compact) {
    return (
      <div className="w-full">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-tierra-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${isFinished ? 'bg-campo-600' : 'bg-campo-500'}`}
              style={{ width: `${isFinished ? 100 : progress}%` }}
            />
          </div>
          <span className="text-[10px] text-tierra-500 whitespace-nowrap">
            {isFinished ? 'Cosechado' : `${currentStage.name}`}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display font-bold text-base">Ciclo del cultivo</h3>
        <span className="text-xs text-tierra-500">Dia {days} de ~{totalDays}</span>
      </div>

      {/* Progress bar with stages */}
      <div className="relative mb-4">
        <div className="flex h-3 rounded-full overflow-hidden bg-tierra-100">
          {STAGES.map((stage, i) => {
            const width = ((stage.end - stage.start) / totalDays) * 100;
            const isActive = i <= currentStageIdx;
            const isCurrent = i === currentStageIdx;
            return (
              <div
                key={stage.name}
                className={`h-full transition-all ${isActive ? stage.color : 'bg-tierra-100'} ${isCurrent ? 'animate-pulse' : ''}`}
                style={{ width: `${width}%` }}
                title={stage.name}
              />
            );
          })}
        </div>
        {/* Current position indicator */}
        {!isFinished && (
          <div
            className="absolute top-0 w-0.5 h-3 bg-tierra-900"
            style={{ left: `${progress}%` }}
          />
        )}
      </div>

      {/* Stage labels */}
      <div className="flex flex-wrap gap-2">
        {STAGES.map((stage, i) => {
          const isActive = i <= currentStageIdx;
          const isCurrent = i === currentStageIdx;
          return (
            <span
              key={stage.name}
              className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                isCurrent && !isFinished
                  ? 'bg-campo-100 text-campo-800 ring-1 ring-campo-300'
                  : isActive || isFinished
                  ? 'bg-tierra-100 text-tierra-600'
                  : 'bg-tierra-50 text-tierra-300'
              }`}
            >
              {stage.name}
            </span>
          );
        })}
      </div>

      {/* Current stage info */}
      <div className="mt-3 p-3 bg-campo-50 rounded-xl">
        <p className="text-sm font-semibold text-campo-800">
          {isFinished ? 'Cosecha completada' : `Etapa actual: ${currentStage.name}`}
        </p>
        <p className="text-xs text-campo-600 mt-0.5">
          {isFinished
            ? `Completado en ${days} dias`
            : `${Math.max(0, totalDays - days)} dias restantes aproximadamente`
          }
        </p>
      </div>
    </div>
  );
}
