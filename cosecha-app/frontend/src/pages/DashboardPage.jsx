import { useAuth } from '../context/AuthContext';
import { useApi } from '../hooks/useApi';
import { cosechasAPI, alertasAPI } from '../services/api';
import { LoadingPage, ErrorMsg, StatCard, EmptyState } from '../components/ui';
import { formatCOP, formatKg, formatDate, ESTADOS, getGreeting } from '../utils/helpers';
import CropTimeline from '../components/CropTimeline';
import {
  TrendingUp, TrendingDown, DollarSign, Package, Sprout, ArrowRight,
  Bell, Droplets, Bug, Flower2, Scissors, Check, X, BarChart3,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function DashboardPage() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const { data, loading, error, refetch } = useApi(() => cosechasAPI.dashboard(), []);
  const { data: alertas, refetch: refetchAlertas } = useApi(() => alertasAPI.listarPendientes(), []);

  if (loading) return <LoadingPage />;
  if (error) return <ErrorMsg message={error} onRetry={refetch} />;

  const stats = data?.estadisticas;
  const activas = data?.cosechasActivas || [];
  const historico = data?.historico || [];

  const totalCosechas = parseInt(stats?.total_cosechas || 0);
  const totalProduccion = parseFloat(stats?.total_produccion || 0);
  const totalIngresos = parseFloat(stats?.total_ingresos || 0);
  const totalCostos = parseFloat(stats?.total_costos || 0);
  const utilidad = parseFloat(stats?.total_utilidad || 0);
  const totalPerdidas = parseFloat(stats?.total_perdidas || 0);
  const costoPromedioKg = parseFloat(stats?.costo_promedio_kg || 0);
  const roi = totalCostos > 0 ? ((utilidad / totalCostos) * 100) : 0;

  const chartData = historico.map(h => ({
    name: `${h.mes}/${h.anio}`,
    produccion: parseFloat(h.produccion),
    utilidad: parseFloat(h.utilidad),
  })).reverse();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Saludo */}
      <div>
        <h1 className="page-title">{getGreeting(usuario?.nombre)}</h1>
        <p className="text-tierra-500 text-sm mt-1">
          {totalCosechas > 0
            ? `${totalCosechas} cosechas registradas · ${activas.length} activas`
            : 'Bienvenido a CosechaApp'}
        </p>
      </div>

      {/* Stats con contexto */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Produccion total"
          value={formatKg(totalProduccion)}
          icon={Package}
          color="cosecha"
          sub={totalPerdidas > 0 ? `Perdidas: ${formatKg(totalPerdidas)}` : totalCosechas > 0 ? `${totalCosechas} cosechas` : undefined}
        />
        <StatCard
          label="Inversion total"
          value={formatCOP(totalCostos)}
          icon={BarChart3}
          color="tierra"
          sub={costoPromedioKg > 0 ? `Promedio: ${formatCOP(costoPromedioKg)}/kg` : undefined}
        />
        <StatCard
          label="Ingresos totales"
          value={formatCOP(totalIngresos)}
          icon={DollarSign}
          color="campo"
          sub={totalProduccion > 0 && totalIngresos > 0 ? `Precio prom: ${formatCOP(totalIngresos / totalProduccion)}/kg` : undefined}
        />
        <StatCard
          label={utilidad >= 0 ? 'Utilidad neta' : 'Perdida neta'}
          value={formatCOP(Math.abs(utilidad))}
          icon={utilidad >= 0 ? TrendingUp : TrendingDown}
          color={utilidad >= 0 ? 'campo' : 'red'}
          sub={roi !== 0 ? `ROI: ${roi.toFixed(1)}%` : undefined}
        />
      </div>

      {/* Alertas próximas */}
      {alertas && alertas.length > 0 && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-cosecha-600" />
              <h2 className="font-display font-bold text-base">Alertas pendientes</h2>
              <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                {alertas.length}
              </span>
            </div>
            <button onClick={() => navigate('/alertas')}
              className="text-campo-600 text-sm font-medium flex items-center gap-1 hover:underline">
              Ver todas <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-2">
            {alertas.slice(0, 4).map((a) => {
              const iconMap = {
                fertilizacion: { icon: Flower2, color: 'bg-campo-50 text-campo-600' },
                fumigacion: { icon: Bug, color: 'bg-red-50 text-red-600' },
                riego: { icon: Droplets, color: 'bg-blue-50 text-blue-600' },
                cosecha_estimada: { icon: Scissors, color: 'bg-cosecha-50 text-cosecha-700' },
              };
              const cfg = iconMap[a.tipo] || { icon: Bell, color: 'bg-tierra-50 text-tierra-600' };
              const Icon = cfg.icon;
              const isPast = new Date(a.fecha_programada) < new Date();
              return (
                <div key={a.id} className={`flex items-center gap-3 p-3 rounded-xl bg-tierra-50/60 ${isPast ? 'border-l-3 border-l-cosecha-500' : ''}`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${cfg.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{a.titulo}</p>
                    <p className="text-[11px] text-tierra-400">
                      {formatDate(a.fecha_programada)}
                      {isPast && <span className="ml-1 text-cosecha-600 font-semibold">Vencida</span>}
                      <span className="ml-2">{a.variedad_papa}</span>
                    </p>
                  </div>
                  <div className="flex gap-0.5 shrink-0">
                    <button onClick={async () => { try { await alertasAPI.completar(a.id); refetchAlertas(); } catch {} }}
                      className="p-1.5 hover:bg-campo-100 rounded-lg" title="Completar">
                      <Check className="w-3.5 h-3.5 text-campo-600" />
                    </button>
                    <button onClick={async () => { try { await alertasAPI.descartar(a.id); refetchAlertas(); } catch {} }}
                      className="p-1.5 hover:bg-red-100 rounded-lg" title="Descartar">
                      <X className="w-3.5 h-3.5 text-red-400" />
                    </button>
                  </div>
                </div>
              );
            })}
            {alertas.length > 4 && (
              <button onClick={() => navigate('/alertas')}
                className="text-xs text-campo-600 text-center w-full py-1 hover:underline">
                y {alertas.length - 4} alertas mas...
              </button>
            )}
          </div>
        </div>
      )}

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="card p-5">
          <h2 className="font-display font-bold text-base mb-4">Produccion mensual</h2>
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

      {/* Cosechas activas con timeline */}
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
              const cUtil = parseFloat(c.ingreso_total || 0) - parseFloat(c.costo_total || 0);
              return (
                <button key={c.id} onClick={() => navigate(`/cosechas/${c.id}`)}
                  className="card p-4 w-full text-left hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4 mb-2">
                    <div className="w-10 h-10 bg-campo-50 rounded-xl flex items-center justify-center shrink-0">
                      <Sprout className="w-5 h-5 text-campo-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm truncate">{c.variedad_papa}</p>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${estado.color}`}>
                          {estado.label}
                        </span>
                      </div>
                      <p className="text-xs text-tierra-400 truncate">{c.finca_nombre} · {c.lote_nombre}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-xs font-bold ${cUtil >= 0 ? 'text-campo-600' : 'text-red-500'}`}>
                        {formatCOP(cUtil)}
                      </p>
                      <p className="text-[10px] text-tierra-400">
                        {formatDate(c.fecha_siembra)}
                      </p>
                    </div>
                  </div>
                  <CropTimeline fechaSiembra={c.fecha_siembra} estado={c.estado} compact />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
