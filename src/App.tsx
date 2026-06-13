/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { ExerciseType, ExercisePace } from './types';
import { SelectionScreen } from './components/SelectionScreen';
import { ExerciseWorkspace } from './components/ExerciseWorkspace';
import { ReportScreen } from './components/ReportScreen';
import { CameraPermissionModal } from './components/CameraPermissionModal';
import { voiceService } from './services/voice';
import { ShieldAlert, Accessibility, Heart, RotateCcw, Volume2, VolumeX, Eye } from 'lucide-react';

export default function App() {
  // Navigation State
  const [screen, setScreen] = useState<'selection' | 'exercise' | 'report'>('selection');
  const [selectedExercise, setSelectedExercise] = useState<ExerciseType | null>(null);

  // Accessibility States
  const [isVoiceEnabled, setIsVoiceEnabled] = useState<boolean>(true);
  const [voiceVolume, setVoiceVolume] = useState<number>(0.8);
  const [contrastMode, setContrastMode] = useState<boolean>(false);
  const [voiceGender, setVoiceGender] = useState<'female' | 'male'>('female');
  const [enableBenefitsExplanation, setEnableBenefitsExplanation] = useState<boolean>(true);
  const [exercisePace, setExercisePace] = useState<ExercisePace>('normal');
  
  // Stroke Rehabilitation Settings
  const [strokeAffectedSide, setStrokeAffectedSide] = useState<'izquierda' | 'derecha' | 'ambos'>('derecha');
  const [focusedRehab, setFocusedRehab] = useState<boolean>(true);
  
  // Results Telemetry
  const [sessionReps, setSessionReps] = useState<number>(0);
  const [sessionStats, setSessionStats] = useState<{ angles: number[] }>({ angles: [] });

  // Camera Permission States
  const [pendingExercise, setPendingExercise] = useState<ExerciseType | null>(null);
  const [showPermissionModal, setShowPermissionModal] = useState<boolean>(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [isRequestingCamera, setIsRequestingCamera] = useState<boolean>(false);

  // Sync Voice Service configurations
  useEffect(() => {
    voiceService.setEnabled(isVoiceEnabled && voiceVolume > 0);
    voiceService.setVolume(voiceVolume);
    voiceService.setVoiceGender(voiceGender);
    voiceService.setExercisePace(exercisePace);
  }, [isVoiceEnabled, voiceVolume, voiceGender, exercisePace]);

  const handleSelectExercise = (type: ExerciseType) => {
    setPendingExercise(type);
    setPermissionError(null);
    setShowPermissionModal(true);
  };

  const handleGrantPermission = async () => {
    setIsRequestingCamera(true);
    setPermissionError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      });
      stream.getTracks().forEach((track) => track.stop());
      
      if (pendingExercise) {
        setSelectedExercise(pendingExercise);
        setScreen('exercise');
      }
      setShowPermissionModal(false);
      setPendingExercise(null);
    } catch (err: any) {
      console.warn('Camera permission request denied/error:', err);
      setPermissionError(
        'El acceso a la cámara no fue concedido o no se encontró una cámara web. Por favor, asegúrese de hacer clic en el candado de la barra de direcciones de su navegador, autorice el acceso e intente nuevamente.'
      );
    } finally {
      setIsRequestingCamera(false);
    }
  };

  const handleClosePermissionModal = () => {
    setShowPermissionModal(false);
    setPendingExercise(null);
    setPermissionError(null);
  };

  const handleCompleteSession = (repsCount: number, stats: { angles: number[] }) => {
    setSessionReps(repsCount);
    setSessionStats(stats);
    setScreen('report');
  };

  const handleRestart = () => {
    setScreen('selection');
    setSelectedExercise(null);
    setSessionReps(0);
    setSessionStats({ angles: [] });
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 w-full flex justify-center ${
      contrastMode ? 'bg-black text-white' : 'bg-slate-905 bg-[#0F172A]'
    }`}>
      
      {/* Container simulating viewport framing to enforce mobile-first fidelity but extending for live exercise maps */}
      <div className={`w-full ${screen === 'exercise' ? 'max-w-5xl' : 'max-w-md'} min-h-screen flex flex-col relative shadow-2xl transition-all duration-300 ${
        contrastMode ? 'bg-black border-zinc-900' : 'bg-[#0F172A] border-slate-800'
      }`}>
        
        {/* Active render view switcher */}
        {screen === 'selection' && (
          <SelectionScreen
            onSelectExercise={handleSelectExercise}
            isVoiceEnabled={isVoiceEnabled}
            onToggleVoice={() => setIsVoiceEnabled(!isVoiceEnabled)}
            contrastMode={contrastMode}
            onToggleContrast={() => setContrastMode(!contrastMode)}
            voiceGender={voiceGender}
            onVoiceGenderChange={(gender) => setVoiceGender(gender)}
            enableBenefitsExplanation={enableBenefitsExplanation}
            onToggleExplanation={() => setEnableBenefitsExplanation(!enableBenefitsExplanation)}
            exercisePace={exercisePace}
            onExercisePaceChange={(pace) => setExercisePace(pace)}
            strokeAffectedSide={strokeAffectedSide}
            onStrokeAffectedSideChange={setStrokeAffectedSide}
            focusedRehab={focusedRehab}
            onFocusedRehabChange={setFocusedRehab}
          />
        )}

        {screen === 'exercise' && selectedExercise && (
          <ExerciseWorkspace
            exerciseId={selectedExercise}
            onBack={() => setScreen('selection')}
            onCompleteSession={handleCompleteSession}
            isVoiceEnabled={isVoiceEnabled}
            contrastMode={contrastMode}
            voiceVolume={voiceVolume}
            onVoiceVolumeChange={(volume) => {
              setVoiceVolume(volume);
              if (volume > 0) {
                setIsVoiceEnabled(true);
              }
            }}
            voiceGender={voiceGender}
            onVoiceGenderChange={(gender) => setVoiceGender(gender)}
            enableBenefitsExplanation={enableBenefitsExplanation}
            onToggleExplanation={() => setEnableBenefitsExplanation(!enableBenefitsExplanation)}
            exercisePace={exercisePace}
            onExercisePaceChange={(pace) => setExercisePace(pace)}
            strokeAffectedSide={strokeAffectedSide}
            onStrokeAffectedSideChange={setStrokeAffectedSide}
            focusedRehab={focusedRehab}
            onFocusedRehabChange={setFocusedRehab}
          />
        )}

        {screen === 'report' && selectedExercise && (
          <ReportScreen
            exerciseId={selectedExercise}
            repetitions={sessionReps}
            progressStats={sessionStats}
            onRestart={handleRestart}
            contrastMode={contrastMode}
          />
        )}

        <CameraPermissionModal
          isOpen={showPermissionModal}
          onClose={handleClosePermissionModal}
          onGrant={handleGrantPermission}
          isRequesting={isRequestingCamera}
          error={permissionError}
          contrastMode={contrastMode}
        />

        {/* Floating Quick Accessibility control bar for active rehab workspace */}
        {screen === 'exercise' && (
          <div className={`py-3 px-4 flex justify-between items-center text-xs z-40 border-t ${
            contrastMode ? 'bg-zinc-950 border-stone-800 text-white' : 'bg-slate-900 border-slate-950 text-slate-100'
          }`}>
            <div className="flex items-center gap-1.5 font-mono text-slate-400">
              <Accessibility size={14} className="text-emerald-400" />
              <span>Accesibilidad Activa</span>
            </div>
            <div className="flex gap-4 items-center">
              <div className="flex items-center gap-2">
                <button
                  id="workspace-voice-toggle"
                  onClick={() => {
                    if (voiceVolume > 0) {
                      setVoiceVolume(0);
                    } else {
                      setVoiceVolume(0.8);
                      setIsVoiceEnabled(true);
                    }
                  }}
                  className={`flex items-center gap-1 cursor-pointer font-bold transition font-mono ${
                    voiceVolume > 0 ? 'text-emerald-400' : 'text-slate-500'
                  }`}
                  title={voiceVolume > 0 ? "Silenciar voz" : "Activar voz"}
                >
                  {voiceVolume === 0 ? <VolumeX size={14} /> : <Volume2 size={14} />}
                  <span>Voz</span>
                </button>
                <div className="flex items-center gap-1 bg-slate-950/60 border border-slate-800 px-2 py-0.5 rounded-lg">
                  <input
                    id="footer-voice-volume-slider"
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={voiceVolume}
                    aria-label="Ajustar volumen"
                    onChange={(e) => {
                      const newVolume = parseFloat(e.target.value);
                      setVoiceVolume(newVolume);
                      if (newVolume > 0) {
                        setIsVoiceEnabled(true);
                      }
                    }}
                    className="w-14 sm:w-16 h-1 accent-emerald-400 bg-slate-700/80 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="font-mono text-[9px] text-slate-300 w-6 text-right">
                    {Math.round(voiceVolume * 100)}%
                  </span>
                </div>
              </div>
              <button
                id="workspace-contrast-toggle"
                onClick={() => setContrastMode(!contrastMode)}
                className={`flex items-center gap-1 cursor-pointer font-bold transition font-mono ${
                  contrastMode ? 'text-amber-400' : 'text-slate-500'
                }`}
              >
                <Eye size={14} />
                <span>Contraste</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
