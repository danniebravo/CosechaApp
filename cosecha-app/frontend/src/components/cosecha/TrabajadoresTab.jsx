import { useState, useEffect } from 'react';
import { trabajadoresAPI, jornadasAPI } from '../../services/api';
import { Modal } from '../ui';
import { formatCOP, formatDate, formatDateInput } from '../../utils/helpers';
import {
  Users, UserPlus, Plus, Trash2, Edit2, Calendar,
  DollarSign, UtensilsCrossed, ClipboardList,
} from 'lucide-react';
import toast from 'react-hot-toast';

const MODALIDADES = [
  { value: 'dia', label: 'Por dia' },
  { value: 'hora', label: 'Por hora' },
  { value: 'bulto', label: 'Por bulto' },
];

export default function TrabajadoresTab({ cosechaId, onCostChange }) {
  const [view, setView] = useState('equipo'); // 'equipo' | 'jornadas' | 'resumen'
  const [trabajadoresPool, setTrabajadoresPool] = useState([]);
  const [asignados, setAsignados] = useState([]);
  const [jornadas, setJornadas] = useState([]);
  const [resumen, setResumen] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modales
  const [modalNuevo, setModalNuevo] = useState(false);
  const [modalAsignar, setModalAsignar] = useState(false);
  const [modalJornada, setModalJornada] = useState(false);
  const [editingJornada, setEditingJornada] = useState(null);
  const [saving, setSaving] = useState(false);

  // Forms
  const [nuevoForm, setNuevoForm] = useState({ nombre: '', telefono: '', documento: '' });
  const [asignarForm, setAsignarForm] = useState({ trabajador_id: '', modalidad: 'dia', valor_dia: '', valor_hora: '', valor_bulto: '' });
  const [jornadaForm, setJornadaForm] = useState({
    cosecha_id: cosechaId, trabajador_id: '', fecha: '', horas_trabajadas: 8,
    bultos_cosechados: 0, valor_dia: '', valor_comida: 0, subtotal_pago: 0,
  });

  // Cargar datos
  const fetchAll = async () => {
    setLoading(true);
    try {
      const [pool, assigned, jorns, resum] = await Promise.all([
        trabajadoresAPI.listar(),
        trabajadoresAPI.listarPorCosecha(cosechaId),
        jornadasAPI.listar(cosechaId),
        trabajadoresAPI.resumenPorCosecha(cosechaId),
      ]);
      setTrabajadoresPool(pool);
      setAsignados(assigned);
      setJornadas(jorns);
      setResumen(resum);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, [cosechaId]);

  // ── Crear trabajador nuevo ──
  const handleCrearTrabajador = async (e) => {
    e.preventDefault();
    if (!nuevoForm.nombre.trim()) { toast.error('Nombre requerido'); return; }
    setSaving(true);
    try {
      await trabajadoresAPI.crear(nuevoForm);
      toast.success('Trabajador creado');
      setModalNuevo(false);
      setNuevoForm({ nombre: '', telefono: '', documento: '' });
      fetchAll();
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  // ── Asignar trabajador a cosecha ──
  const handleAsignar = async (e) => {
    e.preventDefault();
    if (!asignarForm.trabajador_id) { toast.error('Selecciona un trabajador'); return; }
    setSaving(true);
    try {
      await trabajadoresAPI.asignar({ cosecha_id: cosechaId, ...asignarForm });
      toast.success('Trabajador asignado');
      setModalAsignar(false);
      setAsignarForm({ trabajador_id: '', modalidad: 'dia', valor_dia: '', valor_hora: '', valor_bulto: '' });
      fetchAll();
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  // ── Desasignar ──
  const handleDesasignar = async (trabajadorId) => {
    try {
      await trabajadoresAPI.desasignar(cosechaId, trabajadorId);
      toast.success('Trabajador desasignado');
      fetchAll();
      onCostChange?.();
    } catch (err) { toast.error(err.message); }
  };

  // ── Registrar/editar jornada ──
  const openJornada = (item = null) => {
    if (item) {
      setJornadaForm({
        cosecha_id: cosechaId, trabajador_id: item.trabajador_id,
        fecha: formatDateInput(item.fecha), horas_trabajadas: item.horas_trabajadas || 8,
        bultos_cosechados: item.bultos_cosechados || 0,
        valor_dia: item.valor_dia || 0, valor_comida: item.valor_comida || 0,
        subtotal_pago: item.subtotal_pago || 0,
      });
      setEditingJornada(item);
    } else {
      setJornadaForm({
        cosecha_id: cosechaId, trabajador_id: asignados[0]?.id || '',
        fecha: new Date().toISOString().split('T')[0], horas_trabajadas: 8,
        bultos_cosechados: 0, valor_dia: 0, valor_comida: 0, subtotal_pago: 0,
      });
      setEditingJornada(null);
    }
    setModalJornada(true);
  };

  const handleJornadaChange = (e) => {
    const { name, value, type } = e.target;
    const val = type === 'number' ? (value === '' ? 0 : parseFloat(value)) : value;
    setJornadaForm((p) => {
      const next = { ...p, [name]: val };
      // Auto-calcular subtotal
      if (['valor_dia', 'horas_trabajadas', 'bultos_cosechados'].includes(name)) {
        // El subtotal es el valor del día de trabajo (la comida se suma aparte)
        next.subtotal_pago = parseFloat(next.valor_dia) || 0;
      }
      // Al seleccionar trabajador, precargar su tarifa
      if (name === 'trabajador_id') {
        const worker = asignados.find((w) => w.id === value);
        if (worker) {
          next.valor_dia = worker.valor_dia || 0;
          next.subtotal_pago = worker.valor_dia || 0;
        }
      }
      return next;
    });
  };

  const handleSaveJornada = async (e) => {
    e.preventDefault();
    if (!jornadaForm.trabajador_id || !jornadaForm.fecha) { toast.error('Trabajador y fecha requeridos'); return; }
    setSaving(true);
    try {
      if (editingJornada) {
        await jornadasAPI.actualizar(editingJornada.id, jornadaForm);
      } else {
        await jornadasAPI.crear(jornadaForm);
      }
      toast.success(editingJornada ? 'Jornada actualizada' : 'Jornada registrada');
      setModalJornada(false);
      fetchAll();
      onCostChange?.();
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const handleEliminarJornada = async (jornadaId) => {
    try {
      await jornadasAPI.eliminar(jornadaId);
      toast.success('Jornada eliminada');
      fetchAll();
      onCostChange?.();
    } catch (err) { toast.error(err.message); }
  };

  // No asignados todavía
  const disponibles = trabajadoresPool.filter(
    (t) => !asignados.some((a) => a.id === t.id)
  );

  const totalPagos = resumen.reduce((s, r) => s + parseFloat(r.total_pago || 0), 0);
  const totalComida = resumen.reduce((s, r) => s + parseFloat(r.total_comida || 0), 0);
  const totalCosto = resumen.reduce((s, r) => s + parseFloat(r.total_costo || 0), 0);

  if (loading) return <div className="text-center py-10 text-tierra-400 text-sm">Cargando...</div>;

  return (
    <div>
      {/* Sub-nav */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-1">
          {[
            { id: 'equipo', label: 'Equipo', icon: Users },
            { id: 'jornadas', label: 'Jornadas', icon: Calendar },
            { id: 'resumen', label: 'Resumen', icon: ClipboardList },
          ].map((v) => (
            <button key={v.id} onClick={() => setView(v.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                view === v.id ? 'bg-campo-100 text-campo-700' : 'text-tierra-500 hover:bg-tierra-50'
              }`}>
              <v.icon className="w-3.5 h-3.5" /> {v.label}
            </button>
          ))}
        </div>
        {view === 'equipo' && (
          <div className="flex gap-1.5">
            <button onClick={() => setModalNuevo(true)} className="btn-secondary text-xs flex items-center gap-1">
              <UserPlus className="w-3.5 h-3.5" /> Nuevo
            </button>
            {disponibles.length > 0 && (
              <button onClick={() => setModalAsignar(true)} className="btn-primary text-xs flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" /> Asignar
              </button>
            )}
          </div>
        )}
        {view === 'jornadas' && (
          <button onClick={() => openJornada()} className="btn-primary text-xs flex items-center gap-1"
            disabled={asignados.length === 0}>
            <Plus className="w-3.5 h-3.5" /> Jornada
          </button>
        )}
      </div>

      {/* ═══ EQUIPO ═══ */}
      {view === 'equipo' && (
        asignados.length === 0 ? (
          <div className="text-center py-10">
            <Users className="w-12 h-12 text-tierra-300 mx-auto mb-3" />
            <p className="text-tierra-500 text-sm mb-1">Sin trabajadores asignados</p>
            <p className="text-tierra-400 text-xs mb-4">Crea trabajadores y asignalos a esta cosecha</p>
            <button onClick={() => setModalNuevo(true)} className="btn-primary text-sm">Crear trabajador</button>
          </div>
        ) : (
          <div className="space-y-2">
            {asignados.map((t) => (
              <div key={t.id} className="card p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-campo-50 rounded-full flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-campo-700">
                    {t.nombre.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{t.nombre}</p>
                  <p className="text-xs text-tierra-400">
                    {t.modalidad === 'dia' && `${formatCOP(t.valor_dia)}/dia`}
                    {t.modalidad === 'hora' && `${formatCOP(t.valor_hora)}/hora`}
                    {t.modalidad === 'bulto' && `${formatCOP(t.valor_bulto)}/bulto`}
                    {t.telefono && ` · ${t.telefono}`}
                  </p>
                </div>
                <button onClick={() => handleDesasignar(t.id)}
                  className="p-1.5 hover:bg-red-50 rounded-lg" title="Desasignar">
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
            ))}
          </div>
        )
      )}

      {/* ═══ JORNADAS ═══ */}
      {view === 'jornadas' && (
        jornadas.length === 0 ? (
          <div className="text-center py-10">
            <Calendar className="w-12 h-12 text-tierra-300 mx-auto mb-3" />
            <p className="text-tierra-500 text-sm">Sin jornadas registradas</p>
            <p className="text-tierra-400 text-xs">Registra el trabajo diario de cada trabajador</p>
          </div>
        ) : (
          <div className="space-y-2">
            {jornadas.map((j) => (
              <div key={j.id} className="card p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-cosecha-50 rounded-xl flex items-center justify-center shrink-0">
                  <Calendar className="w-4 h-4 text-cosecha-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{j.trabajador_nombre}</p>
                  <p className="text-xs text-tierra-400">
                    {formatDate(j.fecha)}
                    {parseFloat(j.horas_trabajadas) > 0 && ` · ${j.horas_trabajadas}h`}
                    {parseFloat(j.bultos_cosechados) > 0 && ` · ${j.bultos_cosechados} bultos`}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-tierra-800">{formatCOP(j.subtotal_pago)}</p>
                  {parseFloat(j.valor_comida) > 0 && (
                    <p className="text-[10px] text-tierra-400 flex items-center gap-0.5 justify-end">
                      <UtensilsCrossed className="w-3 h-3" /> {formatCOP(j.valor_comida)}
                    </p>
                  )}
                </div>
                <button onClick={() => openJornada(j)} className="p-1.5 hover:bg-tierra-100 rounded-lg">
                  <Edit2 className="w-3.5 h-3.5 text-tierra-400" />
                </button>
                <button onClick={() => handleEliminarJornada(j.id)} className="p-1.5 hover:bg-red-50 rounded-lg">
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                </button>
              </div>
            ))}
          </div>
        )
      )}

      {/* ═══ RESUMEN ═══ */}
      {view === 'resumen' && (
        <div className="space-y-4">
          {/* Totales */}
          <div className="grid grid-cols-1 xs:grid-cols-3 gap-3">
            <div className="card p-4 text-center">
              <p className="text-xs text-tierra-500 mb-1">Total pagos</p>
              <p className="font-bold text-lg text-tierra-900">{formatCOP(totalPagos)}</p>
            </div>
            <div className="card p-4 text-center">
              <p className="text-xs text-tierra-500 mb-1">Total comida</p>
              <p className="font-bold text-lg text-cosecha-700">{formatCOP(totalComida)}</p>
            </div>
            <div className="card p-4 text-center">
              <p className="text-xs text-tierra-500 mb-1">Costo total</p>
              <p className="font-bold text-lg text-red-600">{formatCOP(totalCosto)}</p>
            </div>
          </div>

          {/* Por trabajador */}
          {resumen.length > 0 && (
            <div className="card p-4">
              <h4 className="font-semibold text-sm mb-3">Por trabajador</h4>
              <div className="space-y-3">
                {resumen.map((r) => (
                  <div key={r.id} className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-campo-50 rounded-full flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-campo-700">{r.nombre.charAt(0)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{r.nombre}</p>
                      <p className="text-[11px] text-tierra-400">
                        {r.dias_trabajados} dias · {parseFloat(r.total_bultos) > 0 ? `${r.total_bultos} bultos` : `${r.total_horas}h`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">{formatCOP(r.total_costo)}</p>
                      <p className="text-[10px] text-tierra-400">
                        Pago: {formatCOP(r.total_pago)} + Comida: {formatCOP(r.total_comida)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ MODALES ═══ */}

      {/* Modal: Crear trabajador */}
      <Modal isOpen={modalNuevo} onClose={() => setModalNuevo(false)} title="Nuevo trabajador" maxWidth="max-w-sm">
        <form onSubmit={handleCrearTrabajador} className="space-y-4">
          <div>
            <label className="label">Nombre completo *</label>
            <input value={nuevoForm.nombre} onChange={(e) => setNuevoForm(p => ({ ...p, nombre: e.target.value }))}
              className="input-field" placeholder="Nombre del trabajador" autoFocus />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Telefono</label>
              <input value={nuevoForm.telefono} onChange={(e) => setNuevoForm(p => ({ ...p, telefono: e.target.value }))}
                className="input-field" placeholder="Opcional" />
            </div>
            <div>
              <label className="label">Documento</label>
              <input value={nuevoForm.documento} onChange={(e) => setNuevoForm(p => ({ ...p, documento: e.target.value }))}
                className="input-field" placeholder="Opcional" />
            </div>
          </div>
          <button type="submit" disabled={saving} className="btn-primary w-full text-center">
            {saving ? 'Guardando...' : 'Crear trabajador'}
          </button>
        </form>
      </Modal>

      {/* Modal: Asignar trabajador */}
      <Modal isOpen={modalAsignar} onClose={() => setModalAsignar(false)} title="Asignar trabajador" maxWidth="max-w-sm">
        <form onSubmit={handleAsignar} className="space-y-4">
          <div>
            <label className="label">Trabajador *</label>
            <select value={asignarForm.trabajador_id}
              onChange={(e) => setAsignarForm(p => ({ ...p, trabajador_id: e.target.value }))}
              className="input-field appearance-none cursor-pointer">
              <option value="">Seleccionar...</option>
              {disponibles.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Modalidad de pago *</label>
            <select value={asignarForm.modalidad}
              onChange={(e) => setAsignarForm(p => ({ ...p, modalidad: e.target.value }))}
              className="input-field appearance-none cursor-pointer">
              {MODALIDADES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
          {asignarForm.modalidad === 'dia' && (
            <div>
              <label className="label">Valor por dia ($)</label>
              <input type="number" step="1000" value={asignarForm.valor_dia}
                onChange={(e) => setAsignarForm(p => ({ ...p, valor_dia: e.target.value }))}
                className="input-field" placeholder="Ej: 50000" />
            </div>
          )}
          {asignarForm.modalidad === 'hora' && (
            <div>
              <label className="label">Valor por hora ($)</label>
              <input type="number" step="500" value={asignarForm.valor_hora}
                onChange={(e) => setAsignarForm(p => ({ ...p, valor_hora: e.target.value }))}
                className="input-field" placeholder="Ej: 7000" />
            </div>
          )}
          {asignarForm.modalidad === 'bulto' && (
            <div>
              <label className="label">Valor por bulto ($)</label>
              <input type="number" step="100" value={asignarForm.valor_bulto}
                onChange={(e) => setAsignarForm(p => ({ ...p, valor_bulto: e.target.value }))}
                className="input-field" placeholder="Ej: 3000" />
            </div>
          )}
          <button type="submit" disabled={saving} className="btn-primary w-full text-center">
            {saving ? 'Asignando...' : 'Asignar a esta cosecha'}
          </button>
        </form>
      </Modal>

      {/* Modal: Registrar jornada */}
      <Modal isOpen={modalJornada} onClose={() => setModalJornada(false)}
        title={editingJornada ? 'Editar jornada' : 'Registrar jornada'}>
        <form onSubmit={handleSaveJornada} className="space-y-4">
          <div>
            <label className="label">Trabajador *</label>
            <select name="trabajador_id" value={jornadaForm.trabajador_id} onChange={handleJornadaChange}
              className="input-field appearance-none cursor-pointer">
              <option value="">Seleccionar...</option>
              {asignados.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Fecha *</label>
            <input name="fecha" type="date" value={jornadaForm.fecha} onChange={handleJornadaChange} className="input-field" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Horas trabajadas</label>
              <input name="horas_trabajadas" type="number" step="0.5" min="0" max="24"
                value={jornadaForm.horas_trabajadas} onChange={handleJornadaChange} className="input-field" />
            </div>
            <div>
              <label className="label">Bultos cosechados</label>
              <input name="bultos_cosechados" type="number" step="1" min="0"
                value={jornadaForm.bultos_cosechados} onChange={handleJornadaChange} className="input-field" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Pago del dia ($) *</label>
              <input name="valor_dia" type="number" step="1000" min="0"
                value={jornadaForm.valor_dia} onChange={handleJornadaChange} className="input-field" />
            </div>
            <div>
              <label className="label">Comida ($)</label>
              <input name="valor_comida" type="number" step="1000" min="0"
                value={jornadaForm.valor_comida} onChange={handleJornadaChange} className="input-field"
                placeholder="Ej: 15000" />
            </div>
          </div>
          {/* Subtotal calculado */}
          <div className="bg-tierra-50 rounded-xl px-4 py-3 flex items-center justify-between">
            <span className="text-sm text-tierra-600">Subtotal pago:</span>
            <span className="font-bold text-tierra-900">{formatCOP(jornadaForm.subtotal_pago)}</span>
          </div>
          <div className="bg-campo-50 rounded-xl px-4 py-3 flex items-center justify-between">
            <span className="text-sm text-campo-700">Total dia (pago + comida):</span>
            <span className="font-bold text-campo-800">
              {formatCOP(parseFloat(jornadaForm.subtotal_pago || 0) + parseFloat(jornadaForm.valor_comida || 0))}
            </span>
          </div>
          <button type="submit" disabled={saving} className="btn-primary w-full text-center">
            {saving ? 'Guardando...' : editingJornada ? 'Actualizar' : 'Registrar jornada'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
