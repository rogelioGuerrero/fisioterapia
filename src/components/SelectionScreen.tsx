/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EXERCISES } from '../data';
import { ExerciseType, ExercisePace } from '../types';
import { Accessibility, Award, Flame, PersonStanding, Shield, Volume2, Eye } from 'lucide-react';

interface SelectionScreenProps {
  onSelectExercise: (type: ExerciseType) => void;
  isVoiceEnabled: boolean;
  onToggleVoice: () => void;
  contrastMode: boolean;
  onToggleContrast: () => void;
  voiceGender: 'female' | 'male';
  onVoiceGenderChange: (gender: 'female' | 'male') => void;
  enableBenefitsExplanation: boolean;
  onToggleExplanation: () => void;
  exercisePace: ExercisePace;
  onExercisePaceChange: (pace: ExercisePace) => void;
  strokeAffectedSide: 'izquierda' | 'derecha' | 'ambos';
  onStrokeAffectedSideChange: (side: 'izquierda' | 'derecha' | 'ambos') => void;
  focusedRehab: boolean;
  onFocusedRehabChange: (on: boolean) => void;
}

export const SelectionScreen: React.FC<SelectionScreenProps> = ({
  onSelectExercise,
  isVoiceEnabled,
  onToggleVoice,
  contrastMode,
  onToggleContrast,
  voiceGender,
  onVoiceGenderChange,
  enableBenefitsExplanation,
  onToggleExplanation,
  exercisePace,
  onExercisePaceChange,
  strokeAffectedSide,
  onStrokeAffectedSideChange,
  focusedRehab,
  onFocusedRehabChange,
}) => {
  const isDarkTheme = !contrastMode;

  return (
    <div
      id="selection-screen"
      className={`flex flex-col min-h-screen p-6 max-w-lg mx-auto border-x transition-colors duration-300 ${
        contrastMode
          ? 'bg-black text-white border-zinc-700'
          : 'medical-grid text-white border-slate-700'
      }`}
    >
      
      {/* Visual Contrast/Audio Settings Header bar */}
      <div className={`flex justify-between items-center mb-6 pb-4 border-b ${contrastMode ? 'border-zinc-700' : 'border-slate-800'}`}>
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white">
            <span className="font-extrabold text-lg text-white font-sans">+</span>
          </div>
          <div>
            <h1 className="font-display font-black text-xl tracking-tight leading-tight">
              FisioAsistente<span className="text-blue-400 ml-0.5">AI</span>
            </h1>
            <p className="text-[10px] uppercase tracking-widest text-slate-400">PoC Tele-Rehabilitación PWA</p>
          </div>
        </div>
        <div className="flex gap-2">
          {/* Voice toggle with huge accessible touch zone */}
          <button
            id="toggle-voice-btn"
            onClick={onToggleVoice}
            className={`p-3 rounded-full cursor-pointer border transition-all ${
              isVoiceEnabled 
                ? 'bg-blue-600/20 text-blue-400 border-blue-500/40 shadow-lg shadow-blue-500/10' 
                : 'bg-slate-800 text-slate-500 border-slate-700'
            }`}
            title={isVoiceEnabled ? 'Desactivar voz' : 'Activar voz'}
            aria-label="Alternar voz de asistencia"
            style={{ minHeight: '48px', minWidth: '48px' }}
          >
            <Volume2 size={22} className={isVoiceEnabled ? 'animate-pulse' : ''} />
          </button>
          
          {/* Contrast toggle */}
          <button
            id="toggle-contrast-btn"
            onClick={onToggleContrast}
            className={`p-3 rounded-full cursor-pointer border transition-all ${
              contrastMode 
                ? 'bg-amber-100 text-amber-900 border-amber-400' 
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
            }`}
            title={contrastMode ? 'Modo normal' : 'Modo alto contraste'}
            aria-label="Alternar alto contraste"
            style={{ minHeight: '48px', minWidth: '48px' }}
          >
            <Eye size={22} />
          </button>
        </div>
      </div>

      {/* Hero Welcome banner with Glass effect */}
      <div className={`p-6 rounded-2xl shadow-xl mb-6 flex flex-col gap-3 border ${
        contrastMode 
          ? 'bg-zinc-900 border-zinc-700 text-white' 
          : 'glass-card text-white bg-gradient-to-br from-slate-900/90 to-blue-950/20'
      }`}>
        <div className="flex items-center gap-2">
          <span className="bg-emerald-500/20 text-emerald-400 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider w-fit border border-emerald-500/30">
            100% Local y Privado
          </span>
          <span className="bg-blue-500/20 text-blue-400 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider w-fit border border-blue-500/30">
            PWA Core
          </span>
        </div>
        <h2 className="font-display font-black text-2xl leading-snug">
          ¡Hola! Bienvenido a su rehabilitación casera médica.
        </h2>
        <p className="text-slate-300 text-sm leading-relaxed">
          Este asistente lee sus movimientos mediante la cámara de su celular y le ayuda a contar sus repeticiones con indicaciones por voz en tiempo real. No requiere internet una vez iniciado.
        </p>
        <div className={`flex items-center gap-2 mt-2 pt-3 border-t text-xs text-amber-300 font-medium ${contrastMode ? 'border-zinc-700' : 'border-slate-800'}`}>
          <Shield size={16} />
          <span>Su video nunca se enviará a ningún servidor. Resguardamos totalmente su privacidad.</span>
        </div>
      </div>

      {/* Configuración de Accesibilidad y Voz */}
      <div className={`p-5 rounded-2xl mb-6 border shadow-sm ${
        contrastMode 
          ? 'bg-zinc-950 border-zinc-700 text-white' 
          : 'glass-card text-white border-slate-800 bg-gradient-to-br from-slate-900 to-blue-950/10'
      }`}>
        <h4 className="text-[10px] uppercase tracking-wider text-slate-400 font-mono font-bold mb-3 flex items-center gap-1.5">
          <Accessibility size={14} className="text-blue-400" />
          Configuración Personalizada de Voz
        </h4>
        <div className="flex flex-col sm:flex-row gap-4 text-xs">
          {/* Selector de Genero de Voz */}
          <div className="flex-1 flex flex-col gap-1.5">
            <span className="text-slate-300 font-bold">Voz de Guía Médica:</span>
            <div className="flex gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800/80">
              <button
                id="voice-female-btn"
                type="button"
                onClick={() => onVoiceGenderChange('female')}
                className={`flex-1 py-1.5 rounded-lg font-bold text-center cursor-pointer transition-all ${
                  voiceGender === 'female'
                    ? 'bg-blue-600 text-white shadow font-extrabold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                ♀️ Femenina
              </button>
              <button
                id="voice-male-btn"
                type="button"
                onClick={() => onVoiceGenderChange('male')}
                className={`flex-1 py-1.5 rounded-lg font-bold text-center cursor-pointer transition-all ${
                  voiceGender === 'male'
                    ? 'bg-blue-600 text-white shadow font-extrabold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                ♂️ Masculina
              </button>
            </div>
          </div>

          {/* Toggle de Explicación de Beneficios */}
          <div className="flex-1 flex flex-col gap-1.5 justify-end">
            <span className="text-slate-300 font-bold">Introducción por Voz:</span>
            <button
              id="toggle-explanation-btn"
              type="button"
              onClick={onToggleExplanation}
              className={`flex items-center justify-between p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                enableBenefitsExplanation
                  ? 'bg-teal-950/30 border-teal-500/40 text-teal-300 font-bold'
                  : 'bg-slate-950 border-slate-850 text-slate-500 hover:text-slate-300'
              }`}
              style={{ minHeight: '38px' }}
            >
              <span>Explicar ejercicio al iniciar</span>
              <div className={`w-8 h-4 rounded-full p-0.5 transition-colors relative duration-300 ${
                enableBenefitsExplanation ? 'bg-teal-500' : 'bg-slate-700'
              }`}>
                <div className={`w-3 h-3 bg-white rounded-full shadow-sm transition-transform duration-300 ${
                  enableBenefitsExplanation ? 'translate-x-4' : 'translate-x-0'
                }`} />
              </div>
            </button>
          </div>
        </div>

        {/* Ritmo y Velocidad de Ejercicio */}
        <div className={`mt-4 pt-3 border-t flex flex-col gap-1.5 w-full text-xs ${
          contrastMode ? 'border-zinc-800' : 'border-slate-800/80'
        }`}>
          <span className="text-slate-300 font-bold">Ritmo del Ejercicio y Voz:</span>
          <p className="text-[11px] text-slate-400 mb-1 leading-normal">
            Ajuste el compás de las instrucciones de voz para realizar su rutina a su propio tiempo, cómodo y sin prisas.
          </p>
          <div className="flex gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800/80">
            <button
              id="pace-lento-btn"
              type="button"
              onClick={() => onExercisePaceChange('lento')}
              className={`flex-1 py-1.5 rounded-lg font-bold text-center cursor-pointer transition-all ${
                exercisePace === 'lento'
                  ? 'bg-blue-600 text-white shadow font-extrabold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🐢 Lento
            </button>
            <button
              id="pace-normal-btn"
              type="button"
              onClick={() => onExercisePaceChange('normal')}
              className={`flex-1 py-1.5 rounded-lg font-bold text-center cursor-pointer transition-all ${
                exercisePace === 'normal'
                  ? 'bg-blue-600 text-white shadow font-extrabold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              👣 Normal
            </button>
            <button
              id="pace-rapido-btn"
              type="button"
              onClick={() => onExercisePaceChange('rapido')}
              className={`flex-1 py-1.5 rounded-lg font-bold text-center cursor-pointer transition-all ${
                exercisePace === 'rapido'
                  ? 'bg-blue-600 text-white shadow font-extrabold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ⚡ Rápido
            </button>
          </div>
        </div>
      </div>

      {/* Configuración de Rehabilitación de Derrame (Hemiplejia) */}
      <div className={`p-4 sm:p-5 rounded-2xl mb-6 border shadow-sm ${
        contrastMode 
          ? 'bg-zinc-950 border-zinc-700 text-white shadow-none' 
          : 'glass-card text-white border-slate-800 bg-gradient-to-br from-slate-900 to-blue-950/15'
      }`}>
        <h4 className="text-[10px] uppercase tracking-wider text-slate-400 font-mono font-bold mb-3 flex items-center gap-1.5">
          <span className="text-sm">🩺</span>
          Configuración de Terapia post-Derrame (Hemiplejia)
        </h4>
        
        {/* Lado afectado selector */}
        <div className="flex flex-col gap-1.5 mb-4 text-xs">
          <span className="text-slate-300 font-bold">¿Qué lado de su cuerpo desea rehabilitar hoy?</span>
          <p className="text-[11px] text-slate-400 leading-normal">
            El asistente adaptará las cámaras y el cálculo de ángulos al lado indicado para dar soporte personalizado.
          </p>
          <div className="flex gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800/80">
            <button
              id="affected-left-presel"
              type="button"
              onClick={() => onStrokeAffectedSideChange('izquierda')}
              className={`flex-1 py-1.5 rounded-lg font-bold text-center cursor-pointer transition-all ${
                strokeAffectedSide === 'izquierda'
                  ? 'bg-amber-600 text-white shadow font-extrabold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              👈 Izquierdo
            </button>
            <button
              id="affected-right-presel"
              type="button"
              onClick={() => onStrokeAffectedSideChange('derecha')}
              className={`flex-1 py-1.5 rounded-lg font-bold text-center cursor-pointer transition-all ${
                strokeAffectedSide === 'derecha'
                  ? 'bg-amber-600 text-white shadow font-extrabold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Derecho 👉
            </button>
            <button
              id="affected-both-presel"
              type="button"
              onClick={() => onStrokeAffectedSideChange('ambos')}
              className={`flex-1 py-1.5 rounded-lg font-bold text-center cursor-pointer transition-all ${
                strokeAffectedSide === 'ambos'
                  ? 'bg-amber-600 text-white shadow font-extrabold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🔄 Ambos
            </button>
          </div>
        </div>

        {/* Modo de Rehabilitación Focalizada */}
        <div className="text-xs">
          <span className="text-slate-300 font-bold">Modo de Rehabilitación Focalizada:</span>
          <p className="text-[11px] text-slate-400 leading-normal mb-2.5">
            Ideal si su lado afectado posee movilidad limitada o rigidez extrema. Desactiva alertas de visibilidad del miembro afectado y calcula el progreso basándose en el hemisferio sano que le asiste, evitando frustraciones.
          </p>
          <button
            id="toggle-focused-rehab"
            type="button"
            onClick={() => onFocusedRehabChange(!focusedRehab)}
            className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
              focusedRehab
                ? 'bg-amber-950/30 border-amber-500/40 text-amber-300 font-bold'
                : 'bg-slate-950 border-slate-850 text-slate-500 hover:text-slate-300'
            }`}
            style={{ minHeight: '38px' }}
          >
            <span>Activar Rehabilitación Focalizada (Recomendado)</span>
            <div className={`w-8 h-4 rounded-full p-0.5 transition-colors relative duration-300 ${
              focusedRehab ? 'bg-amber-500' : 'bg-slate-700'
            }`}>
              <div className={`w-3 h-3 bg-white rounded-full shadow-sm transition-transform duration-350 ${
                focusedRehab ? 'translate-x-4' : 'translate-x-0'
              }`} />
            </div>
          </button>
        </div>
      </div>

      {/* Core instructions block */}
      <div className={`rounded-xl p-4 border mb-8 flex gap-3 ${
        contrastMode 
          ? 'bg-zinc-950 border-yellow-400 text-white' 
          : 'bg-blue-500/5 text-slate-300 border-blue-500/20'
      }`}>
        <div className="text-amber-500 shrink-0">
          <PersonStanding size={32} />
        </div>
        <div>
          <h3 className="font-bold text-sm text-white mb-1">Para mejores resultados de alineación:</h3>
          <p className="text-xs leading-relaxed text-slate-300">
            Asegúrese de estar en un lugar bien iluminado, tenga una silla firme a la mano y prepárese para pararse/sentarse aproximadamente a 2 metros frente a la cámara.
          </p>
        </div>
      </div>

      {/* Action Title */}
      <h3 className="font-display font-black text-lg text-slate-200 mb-4 uppercase tracking-widest text-xs">
        Seleccione su ejercicio de hoy:
      </h3>

      {/* Exercises Selection Cards: Huge and high contrast */}
      <div className="flex flex-col gap-4 mb-8">
        {EXERCISES.map((exe) => {
          const isLeg = exe.id === 'stroke_unilateral_leg_rehab';
          const isSymmetry = exe.id === 'stroke_bilateral_symmetry';
          
          let badgeText = "Hombro";
          let badgeColor = "bg-blue-500/10 text-blue-400 border-blue-500/30";
          let iconColor = "bg-blue-600";
          if (isLeg) {
            badgeText = "Pierna / Rodilla";
            badgeColor = "bg-amber-500/10 text-amber-500 border-amber-500/30";
            iconColor = "bg-amber-600";
          } else if (isSymmetry) {
            badgeText = "Sincronía Cortex";
            badgeColor = "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
            iconColor = "bg-emerald-600";
          }

          return (
            <button
              id={`select-btn-${exe.id}`}
              key={exe.id}
              onClick={() => onSelectExercise(exe.id)}
              className={`text-left w-full rounded-2xl border-2 transition-all cursor-pointer flex flex-col gap-3 p-5 shadow-sm hover:shadow-lg ${
                contrastMode
                  ? 'bg-zinc-950 border-zinc-700 text-white hover:border-yellow-400'
                  : 'glass-card text-white border-slate-800 hover:border-blue-500/80 hover:bg-slate-800/80'
              }`}
              style={{ minHeight: '120px' }}
            >
              <div className="flex justify-between items-start w-full">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl text-white ${iconColor}`}>
                    <Award size={24} />
                  </div>
                  <div>
                    <h4 className="font-display font-extrabold text-xl text-white">
                      {exe.title}
                    </h4>
                    <span className="text-[10px] font-black font-mono uppercase bg-slate-900/60 text-slate-300 px-2 py-0.5 rounded border border-slate-700/60">
                      Articulación: {exe.primaryJointName}
                    </span>
                  </div>
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-md border font-mono uppercase ${badgeColor}`}>
                  {badgeText}
                </span>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed">
                {exe.description}
              </p>
              <div className="flex items-center gap-1.5 text-xs text-slate-400 border-t border-slate-800/50 pt-3 mt-1 font-mono">
                <Flame size={14} className="text-amber-500" />
                <span>Ruta: {exe.targetJoints}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Safety warning */}
      <p className="text-center text-xs text-slate-500 mt-auto pt-6 leading-relaxed">
        * Si siente dolor agudo o molestias físicas persistentes durante algún ejercicio, suspenda inmediatamente y comuníquese con su médico de confianza.
      </p>
    </div>
  );
};
