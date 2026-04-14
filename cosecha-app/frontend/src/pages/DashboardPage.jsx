import { useAuth } from '../context/AuthContext';
import { useApi } from '../hooks/useApi';
import { cosechasAPI } from '../services/api';
import { LoadingPage, ErrorMsg, EmptyState } from '../components/ui';
import { formatCOP, formatKg, ESTADOS } from '../utils/helpers';
import {
  TrendingUp, DollarSign, Package, Sprout, ArrowRight,
  Bell, BarChart3, Percent, ArrowUpRight, ArrowDownRight, Receipt
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  LineChart, Line, CartesianGrid, Legend,
} from 'recharts';
import CropTimeline from '../components/CropTimeline';

export default function DashboardPage() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const { data, loading, error, refetch } = useApi(() => cosechasAPI.dashboard(), []);

  if (loading) return <LoadingPage />;
  if (error) return <ErrorMsg message={error} onRetry={refetch} />;

  const stats = data?.estadisticas;
  const activas = data?.cosechasActivas || [];
  const historico = data?.historico || [];
  const alertasPendientes = data?.alertasPendientes || 0;

  const utilidad = parseFloat(stats?.total_utilidad || 0);
  const totalCostos = parseFloat(stats?.total_costos || 0);
  const totalIngresos = parseFloat(stats?.total_ingresos || 0);
  const totalProduccion = parseFloat(stats?.total_produccion || 0);
  const totalCosechas = parseInt(stats?.total_cosechas || 0);
  const roi = totalCostos > 0 ? ((totalIngresos - totalCostos) / totalCostos) * 100 : 0;
  const costoPorKg = parseFloat(stats?.costo_promedio_kg || 0);

  const chartData = historico.map(h => ({
    name: `${h.mes}/${String(h.anio).slice(2)}`,
    produccion: parseFloat(h.produccion),
    ingresos: parseFloat(h.ingresos || 0),
    gastos: parseFloat(h.gastos || 0),
    utilidad: parseFloat(h.utilidad),
  })).reverse();

  const hasData = totalCosechas > 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Saludo */}
      <div>
        <h1 className="page-title">Hola, {usuario?.nombre?.split(' ')[0]}</h1>
        <p className="text-tierra-500 text-sm mt-1">
          {hasData ? 'Resumen general de tus cosechas' : 'Bienvenido a CosechaApp'}
        </p>
      </div>

      {/* Alerta banner */}
      {alertasPendientes > 0 && (
        <button onClick={() => navigate('/alertas')}
          className="w-full card p-4 flex items-center gap-3 border-l-4 border-l-cosecha-500 hover:shadow-md transition-shadow text-left">
          <div className="w-10 h-10 bg-cosecha-50 rounded-xl flex items-center justify-center shrink-0">
            <Bell className="w-5 h-5 text-cosecha-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-tierra-800">
              {alertasPendientes} {alertasPendientes === 1 ? 'alerta pendiente' : 'alertas pendientes'}
            </p>
            <p className="text-xs text-tierra-500">Tareas agricolas por completar</p>
          </div>
          <ArrowRight className="w-5 h-5 text-tierra-400" />
        </button>
      )}

      {/* ════ NIVEL 1: METRICAS PRINCIPALES ════ */}
      <div className="grid grid-cols-3 gap-3">
        {/* Ingresos */}
        <div className={`card p-5 ${totalIngresos > 0 ? 'border-l-4 border-l-campo-500' : ''}`}>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-campo-50 text-campo-700"><DollarSign className="w-4 h-4" /></div>
            <span className="text-xs font-medium text-tierra-500 uppercase tracking-wide">Ingresos</span>
          </div>
          <p className="text-xl font-display font-bold text-tierra-900">{formatCOP(totalIngresos)}</p>
          {totalIngresos > 0 ? (
            <p className="text-[11px] text-campo-600 flex items-center gap-0.5 mt-1"><ArrowUpRight className="w-3 h-3" /> Total acumulado</p>
          ) : (
            <p className="text-[11px] text-tierra-400 mt-1">Sin ventas registradas aun</p>
          )}
        </div>

        {/* Costos */}
        <div className={`card p-5 ${totalCostos > 0 ? 'border-l-4 border-l-tierra-400' : ''}`}>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-tierra-50 text-tierra-700"><Receipt className="w-4 h-4" /></div>
            <span className="text-xs font-medium text-tierra-500 uppercase tracking-wide">Costos</span>
          </div>
          <p className="text-xl font-display font-bold text-tierra-900">{formatCOP(totalCostos)}</p>
          {totalCostos > 0 ? (
            <p className="text-[11px] text-tierra-500 mt-1">Total invertido en todas las cosechas</p>
          ) : (
            <p className="text-[11px] text-tierra-400 mt-1">Sin gastos registrados aun</p>
          )}
        </div>

        {/* Utilidad */}
        <div className={`card p-5 ${utilidad !== 0 ? (utilidad > 0 ? 'border-l-4 border-l-campo-500 bg-campo-50/30' : 'border-l-4 border-l-red-400 bg-red-50/30') : ''}`}>
          <div className="flex items-center gap-2 mb-2">
            <div className={`p-1.5 rounded-lg ${utilidad >= 0 ? 'bg-campo-50 text-campo-700' : 'bg-red-50 text-red-600'}`}>
              <TrendingUp className="w-4 h-4" />
            </div>
            <span className="text-xs font-medium text-tierra-500 uppercase tracking-wide">Utilidad</span>
          </div>
          <p className={`text-xl font-display font-bold ${utilidad > 0 ? 'text-campo-700' : utilidad < 0 ? 'text-red-600' : 'text-tierra-900'}`}>
            {formatCOP(utilidad)}
          </p>
          {utilidad > 0 ? (
            <p className="text-[11px] text-campo-600 flex items-center gap-0.5 mt-1"><ArrowUpRight className="w-3 h-3" /> Ganancia neta positiva</p>
          ) : utilidad < 0 ? (
            <p className="text-[11px] text-red-500 flex items-center gap-0.5 mt-1"><ArrowDownRight className="w-3 h-3" /> Hay perdida — revisa costos</p>
          ) : hasData ? (
            <p className="text-[11px] text-tierra-400 mt-1">Ingresos = Costos (sin ganancia ni perdida)</p>
          ) : (
            <p className="text-[11px] text-tierra-400 mt-1">Registra ingresos y gastos para calcular</p>
          )}
        </div>
      </div>

      {/* ════ NIVEL 2: METRICAS SECUNDARIAS ════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="card p-3">
          <p className="text-[11px] text-tierra-500 uppercase tracking-wide mb-1">Cosechas</p>
          <p className="text-base font-bold text-tierra-900">{totalCosechas}</p>
          <p className="text-[10px] text-tierra-400">{totalCosechas === 0 ? 'Crea tu primera cosecha' : 'Total registradas'}</p>
        </div>
        <div className="card p-3">
          <p className="text-[11px] text-tierra-500 uppercase tracking-wide mb-1">Produccion</p>
          <p className="text-base font-bold text-tierra-900">{totalProduccion > 0 ? formatKg(totalProduccion) : '—'}</p>
          <p className="text-[10px] text-tierra-400">{totalProduccion > 0 ? 'Total cosechado' : 'Sin produccion registrada'}</p>
        </div>
        <div className="card p-3">
          <p className="text-[11px] text-tierra-500 uppercase tracking-wide mb-1">ROI</p>
          {totalCostos > 0 && totalIngresos > 0 ? (
            <>
              <p className={`text-base font-bold ${roi >= 0 ? 'text-campo-700' : 'text-red-600'}`}>{roi >= 0 ? '+' : ''}{roi.toFixed(1)}%</p>
              <p className="text-[10px] text-tierra-400">Retorno sobre inversion</p>
            </>
          ) : (
            <>
              <p className="text-base font-bold text-tierra-300">—</p>
              <p className="text-[10px] text-tierra-400">Requiere ingresos y costos</p>
            </>
          )}
        </div>
        <div className="card p-3">
          <p className="text-[11px] text-tierra-500 uppercase tracking-wide mb-1">Costo/kg</p>
          {costoPorKg > 0 ? (
            <>
              <p className="text-base font-bold text-tierra-700">{formatCOP(costoPorKg)}</p>
              <p className="text-[10px] text-tierra-400">Promedio por kilogramo</p>
            </>
          ) : (
            <>
              <p className="text-base font-bold text-tierra-300">—</p>
              <p className="text-[10px] text-tierra-400">Requiere costos y produccion</p>
            </>
          )}
        </div>
      </div>

      {/* Charts */}
      {chartData.length > 0 && (
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="card p-5">
            <h2 className="font-display font-bold text-base mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-campo-600" /> Ingresos vs Gastos
            </h2>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0e6d6" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => formatCOP(v)} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="ingresos" name="Ingresos" fill="#3d9641" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="gastos" name="Gastos" fill="#d97706" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card p-5">
            <h2 className="font-display font-bold text-base mb-4 flex items-center gap-2">
              <Percent className="w-4 h-4 text-campo-600" /> Tendencia de utilidad
            </h2>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0e6d6" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => formatCOP(v)} />
                  <Line type="monotone" dataKey="utilidad" name="Utilidad" stroke="#3d9641" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card p-5 lg:col-span-2">
            <h2 className="font-display font-bold text-base mb-4">Produccion mensual (kg)</h2>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0e6d6" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => formatKg(v)} />
                  <Bar dataKey="produccion" name="Produccion" radius={[6, 6, 0, 0]}>
                    {chartData.map((_, i) => (
                      <Cell key={i} fill={i === chartData.length - 1 ? '#3d9641' : '#b9e1ba'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
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
                  className="card p-4 w-full text-left hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-campo-50 rounded-xl flex items-center justify-center shrink-0">
                      <Sprout className="w-5 h-5 text-campo-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-semibold text-sm truncate">{c.variedad_papa}</p>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${estado.color}`}>
                          {estado.label}
                        </span>
                      </div>
                      <p className="text-xs text-tierra-400 truncate">{c.finca_nombre} · {c.lote_nombre}</p>
                    </div>
                  </div>
                  <div className="mt-2 ml-14">
                    <CropTimeline fechaSiembra={c.fecha_siembra} estado={c.estado} compact />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
