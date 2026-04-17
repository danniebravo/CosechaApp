import { Sprout } from 'lucide-react';

export default function MobileLogo() {
  return (
    <div className="lg:hidden flex flex-col items-center mb-7">
      <div className="w-12 h-12 bg-campo-600 rounded-xl flex items-center justify-center shadow-lg shadow-campo-600/25">
        <Sprout className="w-7 h-7 text-white" />
      </div>
      <p className="font-display font-bold text-tierra-900 mt-3 text-lg">CosechaApp</p>
    </div>
  );
}
