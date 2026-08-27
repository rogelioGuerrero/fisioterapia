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
import { SettingsPanel } from './components/SettingsPanel';
import { voiceService } from './services/voice';
import { motion, AnimatePresence } from 'motion/react';

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

  // Settings Panel State
  const [showSettings, setShowSettings] = useState<boolean>(false);

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
        
        {/* Active render view switcher with animated transitions */}
        <AnimatePresence mode="wait">
          {screen === 'selection' && (
            <motion.div
              key="selection"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="flex-1 flex flex-col"
            >
              <SelectionScreen
                onSelectExercise={handleSelectExercise}
                onOpenSettings={() => setShowSettings(true)}
                contrastMode={contrastMode}
                isVoiceEnabled={isVoiceEnabled}
              />
            </motion.div>
          )}

          {screen === 'exercise' && selectedExercise && (
            <motion.div
              key="exercise"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="flex-1 flex flex-col"
            >
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
            </motion.div>
          )}

          {screen === 'report' && selectedExercise && (
            <motion.div
              key="report"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="flex-1 flex flex-col"
            >
              <ReportScreen
                exerciseId={selectedExercise}
                repetitions={sessionReps}
                progressStats={sessionStats}
                onRestart={handleRestart}
                contrastMode={contrastMode}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <CameraPermissionModal
          isOpen={showPermissionModal}
          onClose={handleClosePermissionModal}
          onGrant={handleGrantPermission}
          isRequesting={isRequestingCamera}
          error={permissionError}
          contrastMode={contrastMode}
        />

        <SettingsPanel
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          isVoiceEnabled={isVoiceEnabled}
          onToggleVoice={() => setIsVoiceEnabled(!isVoiceEnabled)}
          contrastMode={contrastMode}
          onToggleContrast={() => setContrastMode(!contrastMode)}
          voiceGender={voiceGender}
          onVoiceGenderChange={(gender) => setVoiceGender(gender)}
          voiceVolume={voiceVolume}
          onVoiceVolumeChange={(volume) => {
            setVoiceVolume(volume);
            if (volume > 0) {
              setIsVoiceEnabled(true);
            }
          }}
          enableBenefitsExplanation={enableBenefitsExplanation}
          onToggleExplanation={() => setEnableBenefitsExplanation(!enableBenefitsExplanation)}
          exercisePace={exercisePace}
          onExercisePaceChange={(pace) => setExercisePace(pace)}
          strokeAffectedSide={strokeAffectedSide}
          onStrokeAffectedSideChange={setStrokeAffectedSide}
          focusedRehab={focusedRehab}
          onFocusedRehabChange={setFocusedRehab}
        />
      </div>
    </div>
  );
}
