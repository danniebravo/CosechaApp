import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { alertasAPI } from '../services/api';
import { PageHeader, LoadingPage, ErrorMsg, EmptyState } from '../components/ui';
import { Bell, Check, X, Droplets, Bug, Flower2, Scissors } from 'lucide-react';
import { formatDate } from '../utils/helpers';
import toast, { Toaster } from 'react-hot-toast';

const TIPO_CONFIG = {
  fertilizacion: { icon: Flower2, color: 'bg-campo-50 text-campo-600', label: 'Fertilizacion' },
  fumigacion: { icon: Bug, color: 'bg-red-50 text-red-600', label: 'Fumigacion' },
  riego: { icon: Droplets, color: 'bg-blue-50 text-blue-600', label: 'Riego' },
  cosecha_estimada: { icon: Scissors, color: 'bg-cosecha-50 text-cosecha-700', label: 'Cosecha' },
  general: { icon: Bell, color: 'bg-tierra-50 text-tierra-600', label: 'General' },
};

export default function AlertasPage() {
  const navigate = useNavigate();
  const { data: alertas, loading, error, refetch } = useApi(() => alertasAPI.listarPendientes(), []);
  const [actionLoading, setActionLoading] = useState(null);

  const handleAction = async (id, action) => {
    setActionLoading(id);
    try {
      if (action === 'completar') {
        await alertasAPI.completar(id);
        toast.success('Alerta completada');
      } else {
        await alertasAPI.descartar(id);
        toast.success('Alerta descartada');
      }
      refetch();
    } catch (err) { toast.error(err.message); }
    finally { setActionLoading(null); }
  };

  if (loading) return <LoadingPage />;
  if (error) return <ErrorMsg message={error} onRetry={refetch} />;

  // Agrupar por cosecha
  const grouped = {};
  (alertas || []).forEach(a => {
    const key = a.cosecha_id;
    if (!grouped[key]) {
      grouped[key] = { cosecha_id: key, variedad: a.variedad_papa, finca: a.finca_nombre, lote: a.lote_nombre, alertas: [] };
    }
    grouped[key].alertas.push(a);
  });
  const groups = Object.values(grouped);

  return (
    <div className="animate-fade-in">
      <Toaster position="top-center" />
      <PageHeader title="Alertas" subtitle={`${alertas?.length || 0} pendientes`} />

      {groups.length === 0 ? (
        <EmptyState icon={Bell} title="Sin alertas" description="No tienes alertas pendientes. Las alertas se generan automaticamente al crear cosechas." />
      ) : (
        <div className="space-y-5">
          {groups.map(g => (
            <div key={g.cosecha_id}>
              <button
                onClick={() => navigate(`/cosechas/${g.cosecha_id}`)}
                className="text-sm font-semibold text-tierra-700 mb-2 hover:text-campo-600 transition-colors"
              >
                {g.variedad} — {g.finca} / {g.lote}
              </button>
              <div className="space-y-2">
                {g.alertas.map(a => {
                  const config = TIPO_CONFIG[a.tipo] || TIPO_CONFIG.general;
                  const Icon = config.icon;
                  const isPast = new Date(a.fecha_programada) < new Date();
                  return (
                    <div key={a.id} className={`card p-4 flex items-center gap-3 ${isPast ? 'border-l-4 border-l-cosecha-500' : ''}`}>
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${config.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold">{a.titulo}</p>
                        <p className="text-xs text-tierra-400">
                          {formatDate(a.fecha_programada)}
                          {isPast && <span className="ml-2 text-cosecha-600 font-semibold">Vencida</span>}
                        </p>
                        {a.descripcion && <p className="text-xs text-tierra-500 mt-0.5">{a.descripcion}</p>}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button
                          onClick={() => handleAction(a.id, 'completar')}
                          disabled={actionLoading === a.id}
                          className="p-1.5 hover:bg-campo-50 rounded-lg transition-colors"
                          title="Completar"
                        >
                          <Check className="w-4 h-4 text-campo-600" />
                        </button>
                        <button
                          onClick={() => handleAction(a.id, 'descartar')}
                          disabled={actionLoading === a.id}
                          className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                          title="Descartar"
                        >
                          <X className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
