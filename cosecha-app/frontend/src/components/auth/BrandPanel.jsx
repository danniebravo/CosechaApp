import { Sprout, Leaf, BarChart3, ShieldCheck } from 'lucide-react';

const FEATURES = [
  { icon: Leaf,        text: 'Gestiona fincas y lotes en un solo lugar' },
  { icon: BarChart3,   text: 'Mide el rendimiento real de tus cosechas' },
  { icon: ShieldCheck, text: 'Tus datos protegidos y siempre disponibles' },
];

export default function BrandPanel() {
  return (
    <div className="hidden lg:flex flex-col justify-between p-12 xl:p-16 bg-gradient-to-br from-campo-700 via-campo-800 to-campo-900 text-white relative overflow-hidden">
      {/* Decoración */}
      <div className="absolute -top-32 -right-32 w-[28rem] h-[28rem] bg-campo-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-24 w-[28rem] h-[28rem] bg-cosecha-400/10 rounded-full blur-3xl pointer-events-none" />

      {/* Logo */}
      <div className="relative flex items-center gap-3">
        <div className="w-11 h-11 bg-white/10 backdrop-blur rounded-xl flex items-center justify-center">
          <Sprout className="w-6 h-6" />
        </div>
        <div>
          <p className="font-display font-bold text-lg leading-none">CosechaApp</p>
          <p className="text-[11px] text-campo-200 uppercase tracking-[0.2em] mt-1">Gestión agrícola</p>
        </div>
      </div>

      {/* Mensaje principal */}
      <div className="relative max-w-md">
        <h2 className="font-display font-bold text-4xl xl:text-[2.75rem] leading-[1.1] tracking-tight mb-5">
          Cultiva mejor.<br/>Decide con datos.
        </h2>
        <p className="text-campo-100/85 text-base leading-relaxed mb-9">
          Toda la información de tu campo en una sola plataforma, diseñada para
          productores que quieren crecer.
        </p>
        <ul className="space-y-3.5">
          {FEATURES.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-3 text-campo-50/95">
              <span className="w-9 h-9 rounded-lg bg-white/10 backdrop-blur flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4" />
              </span>
              <span className="text-sm">{text}</span>
            </li>
          ))}
        </ul>
      </div>

      <p className="relative text-xs text-campo-200/60">
        © {new Date().getFullYear()} CosechaApp · Hecho para el campo
      </p>
    </div>
  );
}
