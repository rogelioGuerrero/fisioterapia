import React from 'react';
import { motion } from 'motion/react';
import { EXERCISES } from '../data';
import { ExerciseType, ExerciseCategory } from '../types';
import { Settings, Shield, Dumbbell, Footprints, Brain, ChevronRight, AlignCenter, Activity } from 'lucide-react';

interface SelectionScreenProps {
  onSelectExercise: (type: ExerciseType) => void;
  onOpenSettings: () => void;
  contrastMode: boolean;
  isVoiceEnabled: boolean;
}

const EXERCISE_ICONS: Record<string, React.ReactNode> = {
  shoulder_abduction: <Dumbbell size={22} />,
  assisted_shoulder_abduction: <Dumbbell size={22} />,
  bilateral_arm_abduction: <Brain size={22} />,
  seated_hip_abduction: <Footprints size={22} />,
  trunk_lateral_lean: <AlignCenter size={22} />,
  cervical_lateral_flexion: <Activity size={22} />,
};

const EXERCISE_COLORS: Record<string, { bg: string; border: string }> = {
  shoulder_abduction: { bg: 'bg-cyan-600', border: 'hover:border-cyan-500/80' },
  assisted_shoulder_abduction: { bg: 'bg-blue-600', border: 'hover:border-blue-500/80' },
  bilateral_arm_abduction: { bg: 'bg-emerald-600', border: 'hover:border-emerald-500/80' },
  seated_hip_abduction: { bg: 'bg-amber-600', border: 'hover:border-amber-500/80' },
  trunk_lateral_lean: { bg: 'bg-rose-600', border: 'hover:border-rose-500/80' },
  cervical_lateral_flexion: { bg: 'bg-purple-600', border: 'hover:border-purple-500/80' },
};

const CATEGORY_LABELS: Record<ExerciseCategory, { label: string; icon: React.ReactNode }> = {
  upper_limb: { label: 'Extremidad Superior', icon: <Dumbbell size={14} /> },
  lower_limb: { label: 'Extremidad Inferior', icon: <Footprints size={14} /> },
  trunk: { label: 'Control de Tronco', icon: <AlignCenter size={14} /> },
  neck: { label: 'Cuello', icon: <Activity size={14} /> },
};

export const SelectionScreen: React.FC<SelectionScreenProps> = ({
  onSelectExercise,
  onOpenSettings,
  contrastMode,
  isVoiceEnabled,
}) => {
  const categories = EXERCISES.reduce((acc, exe) => {
    if (!acc[exe.category]) acc[exe.category] = [];
    acc[exe.category].push(exe);
    return acc;
  }, {} as Record<ExerciseCategory, typeof EXERCISES>);

  const categoryOrder: ExerciseCategory[] = ['upper_limb', 'lower_limb', 'trunk', 'neck'];
  let globalIndex = 0;

  return (
    <div
      className={`flex flex-col min-h-screen w-full max-w-md mx-auto transition-colors duration-300 ${
        contrastMode ? 'bg-black text-white' : 'medical-grid text-white'
      }`}
    >
      <header className={`flex items-center justify-between px-5 pt-[calc(1.5rem+env(safe-area-inset-top))] pb-4 ${contrastMode ? 'border-b border-zinc-800' : ''}`}>
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shrink-0">
            <span className="font-extrabold text-lg">+</span>
          </div>
          <div>
            <h1 className="font-display font-black text-lg leading-tight">
              FisioAsistente<span className="text-blue-400">AI</span>
            </h1>
            <p className="text-[10px] text-slate-500">Tele-Rehabilitación</p>
          </div>
        </div>
        <button
          onClick={onOpenSettings}
          className={`p-3 rounded-xl cursor-pointer border transition-all active:scale-95 ${
            contrastMode
              ? 'bg-zinc-900 text-white border-zinc-700'
              : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:text-white'
          }`}
          style={{ minHeight: '48px', minWidth: '48px' }}
          aria-label="Abrir ajustes"
        >
          <Settings size={22} />
        </button>
      </header>

      <div className="px-5 pt-2 pb-4">
        <h2 className="font-display font-black text-2xl leading-tight mb-1.5">
          Elija su ejercicio
        </h2>
        <p className="text-sm text-slate-400 leading-relaxed">
          Seleccione el movimiento que desea practicar hoy.
        </p>
      </div>

      <div className="flex flex-col gap-4 px-5 flex-1 pb-4">
        {categoryOrder.map((cat) => {
          const exercises = categories[cat];
          if (!exercises || exercises.length === 0) return null;
          const catLabel = CATEGORY_LABELS[cat];

          return (
            <div key={cat}>
              <div className={`flex items-center gap-2 mb-2.5 px-1 ${contrastMode ? 'text-zinc-400' : 'text-slate-500'}`}>
                {catLabel.icon}
                <span className="text-[11px] font-bold uppercase tracking-widest">{catLabel.label}</span>
                <div className={`flex-1 h-px ${contrastMode ? 'bg-zinc-800' : 'bg-slate-800'}`} />
              </div>

              <div className="flex flex-col gap-2.5">
                {exercises.map((exe) => {
                  const colors = EXERCISE_COLORS[exe.id] || EXERCISE_COLORS.shoulder_abduction;
                  const idx = globalIndex++;
                  return (
                    <motion.button
                      key={exe.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.06, duration: 0.25, ease: 'easeOut' }}
                      onClick={() => onSelectExercise(exe.id)}
                      className={`text-left w-full rounded-2xl border-2 transition-all cursor-pointer p-3.5 active:scale-[0.98] ${
                        contrastMode
                          ? 'bg-zinc-950 border-zinc-700 hover:border-yellow-400'
                          : `glass-card border-slate-800 ${colors.border} hover:bg-slate-800/60`
                      }`}
                      style={{ minHeight: '76px' }}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl text-white ${colors.bg} shrink-0`}>
                          {EXERCISE_ICONS[exe.id]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-display font-extrabold text-[15px] leading-tight mb-0.5">
                            {exe.title}
                          </h3>
                          <p className="text-[11px] text-slate-400 truncate">
                            {exe.primaryJointName}
                          </p>
                        </div>
                        <ChevronRight size={18} className="text-slate-600 shrink-0" />
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="px-5 py-5 mt-auto pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
        {/* QR para compartir — escanear para abrir esta app en otro dispositivo */}
        <div className={`flex flex-col items-center gap-2 mb-4 p-3 rounded-xl border ${contrastMode ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-900/60 border-slate-800'}`}>
          <img
            src="/qr-mini.png"
            alt="Escanea para abrir FisioAsistente AI"
            className="w-32 h-32 rounded-lg"
          />
          <p className={`text-[10px] text-center font-bold ${contrastMode ? 'text-zinc-400' : 'text-slate-400'}`}>
            Escanea para abrir en tu celular
          </p>
        </div>

        <div className={`flex items-center gap-2 mb-3 text-xs ${contrastMode ? 'text-zinc-400' : 'text-slate-500'}`}>
          <Shield size={14} className="shrink-0 text-emerald-500" />
          <span>Su video nunca sale de su dispositivo.</span>
        </div>
        <p className="text-[11px] text-slate-600 leading-relaxed">
          * Si siente dolor agudo, suspenda y consulte a su médico.
        </p>
      </div>
    </div>
  );
};
