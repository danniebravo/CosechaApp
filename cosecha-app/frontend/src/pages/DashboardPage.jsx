import { useAuth } from '../context/AuthContext';
import { useApi } from '../hooks/useApi';
import { cosechasAPI } from '../services/api';
import { LoadingPage, ErrorMsg, StatCard, EmptyState } from '../components/ui';
import { formatCOP, formatKg, ESTADOS, getGreeting } from '../utils/helpers';
import { TrendingUp, DollarSign, Package, AlertTriangle, Sprout, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function DashboardPage() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const { data, loading, error, refetch } = useApi(() => cosechasAPI.dashboard(), []);

  if (loading) return <LoadingPage />;
  if (error) return <ErrorMsg message={error} onRetry={refetch} />;

  const stats = data?.estadisticas;
  const activas = data?.cosechasActivas || [];
  const historico = data?.historico || [];

  const utilidad = parseFloat(stats?.total_utilidad || 0);
  const chartData = historico.map(h => ({
    name: `${h.mes}/${h.anio}`,
    produccion: parseFloat(h.produccion),
    utilidad: parseFloat(h.utilidad),
  })).reverse();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Saludo */}
      <div>
        <h1 className="page-title">{getGreeting(usuario?.nombre)} 👋</h1>
        <p className="text-tierra-500 text-sm mt-1">Resumen de tus cosechas</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Cosechas" value={stats?.total_cosechas || 0} icon={Sprout} color="campo" />
        <StatCard label="Producción" value={formatKg(stats?.total_produccion)} icon={Package} color="cosecha" />
        <StatCard label="Ingresos" value={formatCOP(stats?.total_ingresos)} icon={DollarSign} color="campo" />
        <StatCard
          label="Utilidad"
          value={formatCOP(utilidad)}
          icon={TrendingUp}
          color={utilidad >= 0 ? 'campo' : 'red'}
        />
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="card p-5">
          <h2 className="font-display font-bold text-base mb-4">Producción mensual (kg)</h2>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => formatKg(v)} />
                <Bar dataKey="produccion" radius={[6, 6, 0, 0]}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={i === chartData.length - 1 ? '#3d9641' : '#b9e1ba'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Cosechas activas */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display font-bold text-base">Cosechas activas</h2>
          <button onClick={() => navigate('/cosechas')}
            className="text-campo-600 text-sm font-medium flex items-center gap-1 hover:underline">
            Ver todas <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {activas.length === 0 ? (
          <EmptyState
            icon={Sprout}
            title="Sin cosechas activas"
            description="Crea tu primera cosecha para empezar a registrar actividades, gastos y ventas."
            action={<button onClick={() => navigate('/cosechas')} className="btn-primary text-sm">Crear cosecha</button>}
          />
        ) : (
          <div className="space-y-3">
            {activas.map(c => {
              const estado = ESTADOS[c.estado] || ESTADOS.planificada;
              return (
                <button key={c.id} onClick={() => navigate(`/cosechas/${c.id}`)}
                  className="card p-4 w-full text-left hover:shadow-md transition-shadow flex items-center gap-4">
                  <div className="w-10 h-10 bg-campo-50 rounded-xl flex items-center justify-center shrink-0">
                    <Sprout className="w-5 h-5 text-campo-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{c.variedad_papa}</p>
                    <p className="text-xs text-tierra-400 truncate">{c.finca_nombre} · {c.lote_nombre}</p>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${estado.color}`}>
                    {estado.label}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
