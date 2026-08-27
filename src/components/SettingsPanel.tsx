import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ExercisePace } from '../types';
import { X, Volume2, VolumeX, Eye, Accessibility, Stethoscope, ChevronRight } from 'lucide-react';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  isVoiceEnabled: boolean;
  onToggleVoice: () => void;
  contrastMode: boolean;
  onToggleContrast: () => void;
  voiceGender: 'female' | 'male';
  onVoiceGenderChange: (gender: 'female' | 'male') => void;
  voiceVolume: number;
  onVoiceVolumeChange: (volume: number) => void;
  enableBenefitsExplanation: boolean;
  onToggleExplanation: () => void;
  exercisePace: ExercisePace;
  onExercisePaceChange: (pace: ExercisePace) => void;
  strokeAffectedSide: 'izquierda' | 'derecha' | 'ambos';
  onStrokeAffectedSideChange: (side: 'izquierda' | 'derecha' | 'ambos') => void;
  focusedRehab: boolean;
  onFocusedRehabChange: (on: boolean) => void;
}

const Toggle: React.FC<{ on: boolean; onClick: () => void; label: string }> = ({ on, onClick, label }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex items-center justify-between w-full p-4 rounded-xl border cursor-pointer transition-all ${
      on
        ? 'bg-blue-600/15 border-blue-500/40 text-blue-300 font-bold'
        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
    }`}
    style={{ minHeight: '56px' }}
  >
    <span className="text-sm">{label}</span>
    <div className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-300 relative ${on ? 'bg-blue-500' : 'bg-slate-700'}`}>
      <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${on ? 'translate-x-5' : 'translate-x-0'}`} />
    </div>
  </button>
);

const SegmentedControl: React.FC<{
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: any) => void;
  accentColor?: string;
}> = ({ options, value, onChange, accentColor = 'bg-blue-600' }) => (
  <div className="flex gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
    {options.map((opt) => (
      <button
        key={opt.value}
        type="button"
        onClick={() => onChange(opt.value)}
        className={`flex-1 py-2.5 rounded-lg font-bold text-center cursor-pointer transition-all text-sm ${
          value === opt.value
            ? `${accentColor} text-white shadow font-extrabold`
            : 'text-slate-400 hover:text-slate-200'
        }`}
        style={{ minHeight: '44px' }}
      >
        {opt.label}
      </button>
    ))}
  </div>
);

const SectionLabel: React.FC<{ icon: React.ReactNode; children: React.ReactNode }> = ({ icon, children }) => (
  <div className="flex items-center gap-2 mb-3">
    <span className="text-slate-500">{icon}</span>
    <h4 className="text-xs uppercase tracking-wider text-slate-400 font-mono font-bold">{children}</h4>
  </div>
);

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  isOpen,
  onClose,
  isVoiceEnabled,
  onToggleVoice,
  contrastMode,
  onToggleContrast,
  voiceGender,
  onVoiceGenderChange,
  voiceVolume,
  onVoiceVolumeChange,
  enableBenefitsExplanation,
  onToggleExplanation,
  exercisePace,
  onExercisePaceChange,
  strokeAffectedSide,
  onStrokeAffectedSideChange,
  focusedRehab,
  onFocusedRehabChange,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-50"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}
            className={`fixed right-0 top-0 bottom-0 w-full max-w-sm z-50 overflow-y-auto pb-[env(safe-area-inset-bottom)] ${
              contrastMode ? 'bg-black border-l border-zinc-700' : 'bg-[#0F172A] border-l border-slate-800'
            }`}
          >
            {/* Header */}
            <div className={`sticky top-0 z-10 flex items-center justify-between p-4 pt-[calc(1rem+env(safe-area-inset-top))] border-b ${
              contrastMode ? 'bg-black border-zinc-700' : 'bg-[#0F172A] border-slate-800'
            }`}>
              <h3 className="font-display font-black text-lg text-white">Ajustes</h3>
              <button
                onClick={onClose}
                className="p-2.5 rounded-full cursor-pointer border border-slate-700 bg-slate-800 text-slate-300 hover:text-white transition-all"
                style={{ minHeight: '44px', minWidth: '44px' }}
                aria-label="Cerrar ajustes"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 flex flex-col gap-6">
              {/* Accesibilidad rápida */}
              <section>
                <SectionLabel icon={<Accessibility size={14} />}>Accesibilidad</SectionLabel>
                <div className="flex flex-col gap-2.5">
                  <Toggle on={isVoiceEnabled} onClick={onToggleVoice} label="Voz de asistencia" />
                  <Toggle on={contrastMode} onClick={onToggleContrast} label="Alto contraste" />
                </div>
              </section>

              {/* Voz */}
              {isVoiceEnabled && (
                <section>
                  <SectionLabel icon={<Volume2 size={14} />}>Configuración de voz</SectionLabel>
                  <div className="flex flex-col gap-3">
                    <div>
                      <span className="text-xs text-slate-400 font-bold mb-2 block">Voz de guía</span>
                      <SegmentedControl
                        options={[
                          { value: 'female', label: '♀️ Femenina' },
                          { value: 'male', label: '♂️ Masculina' },
                        ]}
                        value={voiceGender}
                        onChange={onVoiceGenderChange}
                      />
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 font-bold mb-2 block">Volumen</span>
                      <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-xl p-3">
                        {voiceVolume === 0 ? <VolumeX size={18} className="text-slate-500" /> : <Volume2 size={18} className="text-blue-400" />}
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={voiceVolume}
                          aria-label="Ajustar volumen"
                          onChange={(e) => onVoiceVolumeChange(parseFloat(e.target.value))}
                          className="flex-1 h-1.5 accent-blue-500 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                        />
                        <span className="font-mono text-xs text-slate-300 w-10 text-right">{Math.round(voiceVolume * 100)}%</span>
                      </div>
                    </div>
                    <Toggle on={enableBenefitsExplanation} onClick={onToggleExplanation} label="Explicar ejercicio al iniciar" />
                  </div>
                </section>
              )}

              {/* Ritmo */}
              <section>
                <SectionLabel icon={<ChevronRight size={14} />}>Ritmo del ejercicio</SectionLabel>
                <SegmentedControl
                  options={[
                    { value: 'lento', label: '🐢 Lento' },
                    { value: 'normal', label: '👣 Normal' },
                    { value: 'rapido', label: '⚡ Rápido' },
                  ]}
                  value={exercisePace}
                  onChange={onExercisePaceChange}
                />
              </section>

              {/* Terapia post-derrame */}
              <section>
                <SectionLabel icon={<Stethoscope size={14} />}>Terapia post-derrame</SectionLabel>
                <div className="flex flex-col gap-3">
                  <div>
                    <span className="text-xs text-slate-400 font-bold mb-2 block">Lado afectado</span>
                    <SegmentedControl
                      options={[
                        { value: 'izquierda', label: '👈 Izq.' },
                        { value: 'derecha', label: 'Der. 👉' },
                        { value: 'ambos', label: '🔄 Ambos' },
                      ]}
                      value={strokeAffectedSide}
                      onChange={onStrokeAffectedSideChange}
                      accentColor="bg-amber-600"
                    />
                  </div>
                  <Toggle on={focusedRehab} onClick={() => onFocusedRehabChange(!focusedRehab)} label="Rehabilitación focalizada" />
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Calcula el progreso basándose en el lado sano que asiste. Recomendado si hay movilidad limitada.
                  </p>
                </div>
              </section>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
