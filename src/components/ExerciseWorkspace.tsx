/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { ExerciseType, Landmark, ExercisePace } from '../types';
import { EXERCISES, AUDIO_PHRASES } from '../data';
import { voiceService } from '../services/voice';
import { ArrowLeft, Camera, RefreshCw, Volume2, ShieldCheck, Activity, Brain, Smile, AlertCircle, Award, ZoomIn, ZoomOut, Maximize2, Minimize2, Eye, EyeOff } from 'lucide-react';

interface ExerciseWorkspaceProps {
  exerciseId: ExerciseType;
  onBack: () => void;
  onCompleteSession: (repetitions: number, progressStats: { angles: number[] }) => void;
  isVoiceEnabled: boolean;
  contrastMode: boolean;
  voiceVolume: number;
  onVoiceVolumeChange: (volume: number) => void;
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

export const ExerciseWorkspace: React.FC<ExerciseWorkspaceProps> = ({
  exerciseId,
  onBack,
  onCompleteSession,
  isVoiceEnabled,
  contrastMode,
  voiceVolume,
  onVoiceVolumeChange,
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
  const currentEx = EXERCISES.find((e) => e.id === exerciseId)!;

  // React states
  const [loadingStatus, setLoadingStatus] = useState<string>('Iniciando entorno...');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  
  const [reps, setReps] = useState<number>(0);
  const [currentAngle, setCurrentAngle] = useState<number>(0);
  const [activeSide, setActiveSide] = useState<'izquierda' | 'derecha'>('derecha');
  const [isLimbDetected, setIsLimbDetected] = useState<boolean>(false);
  const [sessionCompleted, setSessionCompleted] = useState<boolean>(false);
  const isCompletedRef = useRef<boolean>(false);
  const [zoomScale, setZoomScale] = useState<number>(1.0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isCounterMinimized, setIsCounterMinimized] = useState<boolean>(false);
  
  // Practice state controls
  const [practiceState, _setPracticeState] = useState<'not_started' | 'countdown' | 'active'>('not_started');
  const practiceStateRef = useRef<'not_started' | 'countdown' | 'active'>('not_started');
  const setPracticeState = (state: 'not_started' | 'countdown' | 'active') => {
    practiceStateRef.current = state;
    _setPracticeState(state);
  };
  const [countdownSeconds, setCountdownSeconds] = useState<number>(3);
  
  // Real-time visible transcript for hard-of-hearing users
  const [speechTranscript, setSpeechTranscript] = useState<string>('');
  
  // Setup persistent refs for loops and media
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cameraContainerRef = useRef<HTMLDivElement | null>(null);
  
  const poseLandmarkerRef = useRef<any>(null);
  const activeStreamRef = useRef<MediaStream | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  
  // Repetition machine refs
  const repetitionsRef = useRef<number>(0);
  const isReadyForRepRef = useRef<boolean>(true);
  const lastRepTimeRef = useRef<number>(0);
  const anglesHistoryRef = useRef<number[]>([]);
  
  // Effort prompt timer refs
  const effortStartTimeRef = useRef<number | null>(null);
  const hasEncouragedRef = useRef<boolean>(false);

  // Accessible subtitle generator
  const triggerVoice = (text: string, force: boolean = false) => {
    setSpeechTranscript(text);
    voiceService.speak(text, force);
  };

  // Helper trigger calculations (Euclidean Trigonometry)
  const calculateAngle = (a: Landmark, b: Landmark, c: Landmark): number => {
    if (!a || !b || !c) return 0;
    
    // Joint vector calculations
    const v1 = { x: a.x - b.x, y: a.y - b.y };
    const v2 = { x: c.x - b.x, y: c.y - b.y };
    
    const dotProduct = v1.x * v2.x + v1.y * v2.y;
    const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
    const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
    
    if (mag1 === 0 || mag2 === 0) return 0;
    
    let cosAngle = dotProduct / (mag1 * mag2);
    cosAngle = Math.max(-1, Math.min(1, cosAngle)); // prevent IEEE overflow
    
    const angleRad = Math.acos(cosAngle);
    return Math.round((angleRad * 180) / Math.PI);
  };

  useEffect(() => {
    let active = true;

    async function initializeWorkspace() {
      try {
        // Step 1: Load MediaPipe Tasks Vision dynamically via CDN
        setLoadingStatus('Cargando MediaPipe en el navegador...');
        const visionModule = await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/+esm');
        
        if (!active) return;
        setLoadingStatus('Cargando modelos anatómicos (pose_lite)...');
        
        const filesetResolver = await visionModule.FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
        );
        
        if (!active) return;
        
        const landmarker = await visionModule.PoseLandmarker.createFromOptions(filesetResolver, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
            delegate: 'GPU'
          },
          runningMode: 'VIDEO',
          numPoses: 1
        });

        if (!active) {
          landmarker.close();
          return;
        }

        poseLandmarkerRef.current = landmarker;

        // Step 2: Initialize Frontal Camera
        setLoadingStatus('Iniciando su cámara frontal...');
        
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 640 },
            height: { ideal: 480 },
            frameRate: { ideal: 30 }
          },
          audio: false
        });

        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        activeStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        setIsLoading(false);
        triggerVoice("Cámara lista. Coloque el teléfono y sitúe al paciente. Cuando esté listo, diga Inicio o presione el botón para comenzar.", true);

      } catch (err: any) {
        console.error('Error initializing physiotherapy core API:', err);
        if (active) {
          setCameraError(
            'No se pudo acceder a la cámara frontal. Asegúrese de otorgar permisos de cámara.'
          );
          setIsLoading(false);
        }
      }
    }

    initializeWorkspace();

    return () => {
      active = false;
      if (!isCompletedRef.current) {
        voiceService.stop();
      }
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      if (activeStreamRef.current) {
        activeStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (poseLandmarkerRef.current) {
        poseLandmarkerRef.current.close();
      }
    };
  }, [exerciseId]);

  const handleStartPractice = () => {
    if (practiceStateRef.current !== 'not_started') return;
    setPracticeState('countdown');
    setCountdownSeconds(3);
    
    // Play warm countdown speech: "Preparados en 3, 2, 1, ¡comenzamos!"
    triggerVoice("Preparados para comenzar en... tres... dos... uno... ¡comenzamos!", true);
  };

  // Continuous speech recognition for starting ("inicio", "empezar", "comenzar", etc.)
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    let recognition: any = null;
    let isListening = true;

    const startRecognition = () => {
      if (!isListening) return;
      try {
        recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.lang = 'es-ES';

        recognition.onresult = (event: any) => {
          let heardMatch = false;
          // Scan all active results to ensure we do not miss any matched command
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript.toLowerCase();
            console.log('Voice Command WebSpeech heard segment:', transcript);

            if (
              transcript.includes('inicio') || 
              transcript.includes('inicia') || 
              transcript.includes('empezar') || 
              transcript.includes('comienza') || 
              transcript.includes('comenzar') ||
              transcript.includes('comience') ||
              transcript.includes('comenzamos') ||
              transcript.includes('empecemos') ||
              transcript.includes('iniciar') ||
              transcript.includes('start') ||
              transcript.includes('ready') ||
              transcript.includes('listo') ||
              transcript.includes('ahora') ||
              transcript.includes('vamos') ||
              transcript.includes('ya') ||
              transcript.includes('dale')
            ) {
              heardMatch = true;
              break;
            }
          }

          if (heardMatch && practiceStateRef.current === 'not_started') {
            console.log('Voice trigger MATCHED! Starting practice.');
            handleStartPractice();
          }
        };

        recognition.onerror = (evt: any) => {
          console.warn('SpeechRecognition error event:', evt.error);
        };

        recognition.onend = () => {
          if (isListening && practiceStateRef.current === 'not_started') {
            setTimeout(() => {
              try {
                if (isListening && practiceStateRef.current === 'not_started') {
                  recognition.start();
                }
              } catch (e) {
                console.warn('Speech restart ignore error:', e);
              }
            }, 1000);
          }
        };

        recognition.start();
      } catch (err) {
        console.warn('Error starting SpeechRecognition:', err);
      }
    };

    if (practiceState === 'not_started') {
      startRecognition();
    }

    return () => {
      isListening = false;
      if (recognition) {
        try {
          recognition.abort();
        } catch (e) {}
      }
    };
  }, [practiceState]);

  // Handle countdown progression
  useEffect(() => {
    if (practiceState !== 'countdown') return;

    const timer = setInterval(() => {
      setCountdownSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setPracticeState('active');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [practiceState]);

  // Play session speech instructions when the workspace officially starts
  useEffect(() => {
    if (practiceState !== 'active') return;

    let active = true;
    const welcomePhrase = AUDIO_PHRASES.welcome(currentEx.title);
    const delayFactor = exercisePace === 'lento' ? 1.4 : (exercisePace === 'rapido' ? 0.85 : 1.0);

    if (enableBenefitsExplanation && currentEx.benefitsExplanation) {
      triggerVoice(welcomePhrase, true);
      
      const t1 = setTimeout(() => {
        if (active && repetitionsRef.current === 0 && !isCompletedRef.current) {
          triggerVoice(currentEx.benefitsExplanation!, true);
        }
      }, 4000);

      const t2 = setTimeout(() => {
        if (active && repetitionsRef.current === 0 && !isCompletedRef.current) {
          const speakSteps = `Instrucciones del ejercicio. ${currentEx.instructions.join(" ")}`;
          triggerVoice(speakSteps, true);
        }
      }, 16000 * delayFactor);

      const t3 = setTimeout(() => {
        if (active && repetitionsRef.current === 0 && !isCompletedRef.current) {
          triggerVoice(AUDIO_PHRASES.calibration_help);
        }
      }, 32000 * delayFactor);

      return () => {
        active = false;
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    } else {
      triggerVoice(welcomePhrase, true);
      
      const t1 = setTimeout(() => {
        if (active && repetitionsRef.current === 0 && !isCompletedRef.current) {
          const speakSteps = `Pasos a seguir. ${currentEx.instructions.join(" ")}`;
          triggerVoice(speakSteps, true);
        }
      }, 4000);

      const t2 = setTimeout(() => {
        if (active && repetitionsRef.current === 0 && !isCompletedRef.current) {
          triggerVoice(AUDIO_PHRASES.calibration_help);
        }
      }, 16000 * delayFactor);

      return () => {
        active = false;
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [practiceState]);

  // Handle active rendering frame and analysis
  useEffect(() => {
    if (isLoading || cameraError || !poseLandmarkerRef.current) return;

    let localFrameId: number;
    let lastVideoTime = -1;

    const runPoseTrackingLoop = () => {
      if (!videoRef.current || !canvasRef.current || !poseLandmarkerRef.current) {
        localFrameId = requestAnimationFrame(runPoseTrackingLoop);
        return;
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      // Only perform analysis if are dealing with fresh camera frame
      if (video.currentTime !== lastVideoTime && video.readyState >= 3) {
        lastVideoTime = video.currentTime;

        // Make canvas fill its screen size beautifully
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }

        // Run MediaPipe Vision Frame Inference
        const result = poseLandmarkerRef.current.detectForVideo(video, performance.now());

        if (ctx && result && result.landmarks && result.landmarks.length > 0) {
          const landmarks = result.landmarks[0]; // grab prime detected person
          
          // Clear visual viewport frame
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          // Track visibility points to determine optimal limb
          let landmarksOfInterest: Landmark[] = [];
          let sideSelected: 'izquierda' | 'derecha' = 'derecha';
          let detected = false;
          let leftAngle = 0;
          let rightAngle = 0;
          let angle = 0;

          // Determine current side. If 'ambos' is selected, we focus on the right side for state metrics but track general posture.
          const activeStrokeSide: 'izquierda' | 'derecha' = strokeAffectedSide === 'ambos' ? 'derecha' : strokeAffectedSide;
          const healthySide: 'izquierda' | 'derecha' = activeStrokeSide === 'izquierda' ? 'derecha' : 'izquierda';

          if (exerciseId === 'stroke_unilateral_rehab') {
            // Unilateral shoulder elevation auto-assisted (Hip, Shoulder, Elbow)
            if (activeStrokeSide === 'izquierda') {
              sideSelected = 'izquierda';
              landmarksOfInterest = [landmarks[23], landmarks[11], landmarks[13]];
              
              if (focusedRehab) {
                // Focused rehab disables strict visibility requirements on the affected side. 
                // We check if the healthy side is well visible instead to allow progress.
                detected = (landmarks[24]?.visibility || 0) > 0.35 && (landmarks[12]?.visibility || 0) > 0.35;
              } else {
                detected = (landmarks[23]?.visibility || 0) > 0.4 && (landmarks[11]?.visibility || 0) > 0.4;
              }
            } else {
              sideSelected = 'derecha';
              landmarksOfInterest = [landmarks[24], landmarks[12], landmarks[14]];
              
              if (focusedRehab) {
                detected = (landmarks[23]?.visibility || 0) > 0.35 && (landmarks[11]?.visibility || 0) > 0.35;
              } else {
                detected = (landmarks[24]?.visibility || 0) > 0.4 && (landmarks[12]?.visibility || 0) > 0.4;
              }
            }

            if (detected) {
              // Calculate angle. If focused rehab is on and key landmarks on affected side are hidden,
              // we can fallback to estimating the movement based on the healthy side (since both are held together).
              const vertexPoint = landmarksOfInterest[1];
              if (focusedRehab && (!vertexPoint || (vertexPoint.visibility || 0) < 0.2)) {
                const healthyLandmarks = healthySide === 'izquierda' 
                  ? [landmarks[23], landmarks[11], landmarks[13]] 
                  : [landmarks[24], landmarks[12], landmarks[14]];
                if (healthyLandmarks[0] && healthyLandmarks[1] && healthyLandmarks[2]) {
                  angle = calculateAngle(healthyLandmarks[0], healthyLandmarks[1], healthyLandmarks[2]);
                } else {
                  angle = 30; // resting fallback
                }
              } else if (landmarksOfInterest[0] && landmarksOfInterest[1] && landmarksOfInterest[2]) {
                angle = calculateAngle(landmarksOfInterest[0], landmarksOfInterest[1], landmarksOfInterest[2]);
              } else {
                angle = 30;
              }
            }

          } else if (exerciseId === 'stroke_unilateral_leg_rehab') {
            // Unilateral leg extension sentado (Hip, Knee, Ankle), supporting tracking BOTH legs simultaneously if 'ambos' is selected
            if (strokeAffectedSide === 'ambos') {
              sideSelected = 'ambos' as any;
              
              const leftLegVisible = (landmarks[23]?.visibility || 0) > (focusedRehab ? 0.25 : 0.4) && 
                                     (landmarks[25]?.visibility || 0) > (focusedRehab ? 0.25 : 0.4);
              const rightLegVisible = (landmarks[24]?.visibility || 0) > (focusedRehab ? 0.25 : 0.4) && 
                                      (landmarks[26]?.visibility || 0) > (focusedRehab ? 0.25 : 0.4);
              
              detected = leftLegVisible || rightLegVisible;
              
              if (detected) {
                // Calculate left leg angle
                if (landmarks[23] && landmarks[25] && landmarks[27]) {
                  leftAngle = calculateAngle(landmarks[23], landmarks[25], landmarks[27]);
                } else {
                  leftAngle = 110;
                }
                
                // Calculate right leg angle
                if (landmarks[24] && landmarks[26] && landmarks[28]) {
                  rightAngle = calculateAngle(landmarks[24], landmarks[26], landmarks[28]);
                } else {
                  rightAngle = 110;
                }
                
                // The primary tracking metric angle is whichever knee is currently performing the movement (maximum angle)
                angle = Math.max(leftAngle, rightAngle);
              }
            } else {
              if (activeStrokeSide === 'izquierda') {
                sideSelected = 'izquierda';
                landmarksOfInterest = [landmarks[23], landmarks[25], landmarks[27]];
                
                if (focusedRehab) {
                  detected = (landmarks[23]?.visibility || 0) > 0.25; // extremely low threshold
                } else {
                  detected = (landmarks[23]?.visibility || 0) > 0.4 && (landmarks[25]?.visibility || 0) > 0.4;
                }
              } else {
                sideSelected = 'derecha';
                landmarksOfInterest = [landmarks[24], landmarks[26], landmarks[28]];
                
                if (focusedRehab) {
                  detected = (landmarks[24]?.visibility || 0) > 0.25;
                } else {
                  detected = (landmarks[24]?.visibility || 0) > 0.4 && (landmarks[26]?.visibility || 0) > 0.4;
                }
              }

              if (detected) {
                const kneePoint = landmarksOfInterest[1];
                if (focusedRehab && (!kneePoint || (kneePoint.visibility || 0) < 0.2)) {
                  // Mirror healthy leg
                  const healthyLeg = healthySide === 'izquierda'
                    ? [landmarks[23], landmarks[25], landmarks[27]]
                    : [landmarks[24], landmarks[26], landmarks[28]];
                  if (healthyLeg[0] && healthyLeg[1] && healthyLeg[2]) {
                    angle = calculateAngle(healthyLeg[0], healthyLeg[1], healthyLeg[2]);
                  } else {
                    angle = 110;
                  }
                } else if (landmarksOfInterest[0] && landmarksOfInterest[1] && landmarksOfInterest[2]) {
                  angle = calculateAngle(landmarksOfInterest[0], landmarksOfInterest[1], landmarksOfInterest[2]);
                } else {
                  angle = 110;
                }
              }
            }

          } else if (exerciseId === 'stroke_bilateral_symmetry') {
            // Bilateral Arms Coordination. Check both sides
            // Left: Hip(23), Shoulder(11), Elbow(13)
            // Right: Hip(24), Shoulder(12), Elbow(14)
            const leftOk = (landmarks[11]?.visibility || 0) > 0.35 && (landmarks[13]?.visibility || 0) > 0.35;
            const rightOk = (landmarks[12]?.visibility || 0) > 0.35 && (landmarks[14]?.visibility || 0) > 0.35;
            
            if (focusedRehab) {
              // In focused mode, we only require the healthy side to be visible!
              detected = healthySide === 'izquierda' ? leftOk : rightOk;
            } else {
              detected = leftOk && rightOk;
            }
            
            if (strokeAffectedSide === 'ambos') {
              sideSelected = 'derecha'; // generic side for layout
            } else {
              sideSelected = strokeAffectedSide;
            }

            if (detected) {
              if (landmarks[23] && landmarks[11] && landmarks[13]) {
                leftAngle = calculateAngle(landmarks[23], landmarks[11], landmarks[13]);
              } else { leftAngle = 30; }
              if (landmarks[24] && landmarks[12] && landmarks[14]) {
                rightAngle = calculateAngle(landmarks[24], landmarks[12], landmarks[14]);
              } else { rightAngle = 30; }

              if (focusedRehab) {
                // Avoid joint check failure by mirroring the tracked healthy side for the affected side!
                if (healthySide === 'izquierda') {
                  rightAngle = leftAngle;
                } else {
                  leftAngle = rightAngle;
                }
              }
              
              angle = Math.round((leftAngle + rightAngle) / 2);
            }
          }

          setActiveSide(sideSelected);
          setIsLimbDetected(detected);

          if (detected) {
            // Calculate joint angles in real time
            setCurrentAngle(angle);

            // Save telemetry
            anglesHistoryRef.current.push(angle);

            // Exercise State Machine logic
            const minGoal = currentEx.minAngle;
            const maxGoal = currentEx.maxAngle;

            let isRelaxed = false;
            let isExtended = false;

            if (exerciseId === 'stroke_bilateral_symmetry') {
              // Symmetrical tracking checks
              isRelaxed = leftAngle <= minGoal && rightAngle <= minGoal;
              isExtended = leftAngle >= maxGoal && rightAngle >= maxGoal;
            } else {
              isRelaxed = angle <= minGoal;
              isExtended = angle >= maxGoal;
            }

            // ONLY process repetition progress & speech instruction cues when practice is active!
            if (practiceStateRef.current === 'active') {
              // Step 1: Check if user returned/relaxed to starting point
              if (isRelaxed) {
                if (!isReadyForRepRef.current) {
                  isReadyForRepRef.current = true;
                  // Speak confirmation to senior that they re-entered starting base, ready for next repetition
                  triggerVoice(AUDIO_PHRASES.relaxed_prompt);
                }
              }

              // Step 2: Check if movement reaches extended goal target
              if (isReadyForRepRef.current && isExtended) {
                const coolingDownTime = Date.now() - lastRepTimeRef.current;
                
                let safetyLockout = 2500;
                if (exercisePace === 'lento') {
                  safetyLockout = 4000; // Patient lockout for slower reps
                } else if (exercisePace === 'rapido') {
                  safetyLockout = 1700; // Snappy lockout for faster loops
                }
                
                if (coolingDownTime > safetyLockout) { // Dynamic safety lockout threshold (2.5s) to avoid jitter double counts
                  repetitionsRef.current += 1;
                  lastRepTimeRef.current = Date.now();
                  isReadyForRepRef.current = false;
                  setReps(repetitionsRef.current);

                  if (repetitionsRef.current >= 5) {
                    isCompletedRef.current = true;
                    setSessionCompleted(true);
                    triggerVoice(AUDIO_PHRASES.final_celebration, true);
                    // Hold rendering loop brief and transition
                    setTimeout(() => {
                      onCompleteSession(5, { angles: anglesHistoryRef.current });
                    }, 6000);
                  } else {
                    triggerVoice(AUDIO_PHRASES.rep_count(repetitionsRef.current), true);
                  }
                }
              }

              // Step 3: Effort reminder if stuck at intermediate extension
              // Intermediate zone means they try effort, but get stuck/struggle
              const intermediateMinVal = minGoal + 6;
              const intermediateMaxVal = maxGoal - 5;
              if (angle >= intermediateMinVal && angle < intermediateMaxVal) {
                if (!effortStartTimeRef.current) {
                  effortStartTimeRef.current = Date.now();
                } else {
                  const elapsedEffort = Date.now() - effortStartTimeRef.current;
                  if (elapsedEffort > 3000 && !hasEncouragedRef.current) {
                    // Speak high-visibility verbal encouragement
                    const encouragementText = exerciseId === 'stroke_unilateral_leg_rehab' 
                      ? AUDIO_PHRASES.effort_prompt_knee 
                      : AUDIO_PHRASES.effort_prompt_shoulder;
                    triggerVoice(encouragementText, true);
                    hasEncouragedRef.current = true;
                  }
                }
              } else {
                // reset timer
                effortStartTimeRef.current = null;
                if (angle < intermediateMinVal) {
                  hasEncouragedRef.current = false;
                }
              }
            }

            // Draw skeletal overlays (Skeletor map in vibrant neon lines)
            ctx.save();
            
            if (exerciseId === 'stroke_bilateral_symmetry') {
              // Draw bilateral lines
              ctx.strokeStyle = focusedRehab ? '#3B82F6' : '#10B981'; // Blue for focused assisted, Green for active
              ctx.lineWidth = 2.5;
              ctx.lineCap = 'round';
              ctx.lineJoin = 'round';

              // Draw left side Hip-Shoulder-Elbow
              if (landmarks[23] && landmarks[11] && landmarks[13]) {
                ctx.beginPath();
                ctx.moveTo(landmarks[23].x * canvas.width, landmarks[23].y * canvas.height);
                ctx.lineTo(landmarks[11].x * canvas.width, landmarks[11].y * canvas.height);
                ctx.lineTo(landmarks[13].x * canvas.width, landmarks[13].y * canvas.height);
                ctx.stroke();
              }

              // Draw right side Hip-Shoulder-Elbow
              if (landmarks[24] && landmarks[12] && landmarks[14]) {
                ctx.beginPath();
                ctx.moveTo(landmarks[24].x * canvas.width, landmarks[24].y * canvas.height);
                ctx.lineTo(landmarks[12].x * canvas.width, landmarks[12].y * canvas.height);
                ctx.lineTo(landmarks[14].x * canvas.width, landmarks[14].y * canvas.height);
                ctx.stroke();
              }

              // Draw node spheres for both
              const drawJointSpheres = (lm: Landmark) => {
                if (!lm) return;
                const cx = lm.x * canvas.width;
                const cy = lm.y * canvas.height;
                ctx.beginPath();
                ctx.arc(cx, cy, 5.5, 0, 2 * Math.PI);
                ctx.fillStyle = '#F59E0B'; // Amber
                ctx.fill();
                ctx.beginPath();
                ctx.arc(cx, cy, 7.5, 0, 2 * Math.PI);
                ctx.strokeStyle = '#FFFFFF';
                ctx.lineWidth = 1.5;
                ctx.stroke();
              };

              const jointsToDraw = [landmarks[23], landmarks[11], landmarks[13], landmarks[24], landmarks[12], landmarks[14]].filter(Boolean);
              jointsToDraw.forEach(drawJointSpheres);

              // Draw angle overlay bubbles over both shoulders (11 and 12)
              const drawAngleBubble = (lm: Landmark, prAngle: number) => {
                if (!lm) return;
                const vertexX = lm.x * canvas.width;
                const vertexY = lm.y * canvas.height;
                ctx.fillStyle = '#0F172A';
                ctx.strokeStyle = '#3B82F6';
                ctx.lineWidth = 2;
                const padding = 8;
                ctx.font = 'bold 20px "JetBrains Mono", Courier, monospace';
                const metrics = ctx.measureText(`${prAngle}°`);
                const width = metrics.width + padding * 2;
                const height = 28;
                ctx.fillRect(vertexX - width/2, vertexY - 45, width, height);
                ctx.strokeRect(vertexX - width/2, vertexY - 45, width, height);
                
                ctx.fillStyle = '#F59E0B';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(`${prAngle}°`, vertexX, vertexY - 31);
              };

              if (landmarks[11]) drawAngleBubble(landmarks[11], leftAngle);
              if (landmarks[12]) drawAngleBubble(landmarks[12], rightAngle);
            } else if (exerciseId === 'stroke_unilateral_leg_rehab' && strokeAffectedSide === 'ambos') {
              // Draw BOTH legs
              ctx.strokeStyle = focusedRehab ? '#3B82F6' : '#10B981'; // Blue for focused assisted, Green for normal active
              ctx.lineWidth = 2.5;
              ctx.lineCap = 'round';
              ctx.lineJoin = 'round';
 
              // Draw Left leg Hip-Knee-Ankle
              if (landmarks[23] && landmarks[25] && landmarks[27]) {
                ctx.beginPath();
                ctx.moveTo(landmarks[23].x * canvas.width, landmarks[23].y * canvas.height);
                ctx.lineTo(landmarks[25].x * canvas.width, landmarks[25].y * canvas.height);
                ctx.lineTo(landmarks[27].x * canvas.width, landmarks[27].y * canvas.height);
                ctx.stroke();
              }
 
              // Draw Right leg Hip-Knee-Ankle
              if (landmarks[24] && landmarks[26] && landmarks[28]) {
                ctx.beginPath();
                ctx.moveTo(landmarks[24].x * canvas.width, landmarks[24].y * canvas.height);
                ctx.lineTo(landmarks[26].x * canvas.width, landmarks[26].y * canvas.height);
                ctx.lineTo(landmarks[28].x * canvas.width, landmarks[28].y * canvas.height);
                ctx.stroke();
              }
 
              // Draw joint node spheres for both legs (Hip, Knee, Ankle)
              const drawJointSpheres = (lm: Landmark) => {
                if (!lm) return;
                const cx = lm.x * canvas.width;
                const cy = lm.y * canvas.height;
                ctx.beginPath();
                ctx.arc(cx, cy, 5.5, 0, 2 * Math.PI);
                ctx.fillStyle = '#F59E0B'; // Amber orange
                ctx.fill();
                
                ctx.beginPath();
                ctx.arc(cx, cy, 7.5, 0, 2 * Math.PI);
                ctx.strokeStyle = '#FFFFFF';
                ctx.lineWidth = 1.5;
                ctx.stroke();
              };
 
              const jointsToDraw = [
                landmarks[23], landmarks[25], landmarks[27],
                landmarks[24], landmarks[26], landmarks[28]
              ].filter(Boolean);
              jointsToDraw.forEach(drawJointSpheres);
 
              // Draw angle text bubbles over both knees (25 and 26)
              const drawAngleBubble = (lm: Landmark, kneeAngle: number) => {
                if (!lm) return;
                const vertexX = lm.x * canvas.width;
                const vertexY = lm.y * canvas.height;
                ctx.fillStyle = '#0F172A';
                ctx.strokeStyle = '#3B82F6';
                ctx.lineWidth = 2;
                const padding = 8;
                ctx.font = 'bold 20px "JetBrains Mono", Courier, monospace';
                const metrics = ctx.measureText(`${kneeAngle}°`);
                const width = metrics.width + padding * 2;
                const height = 28;
                ctx.fillRect(vertexX - width/2, vertexY - 45, width, height);
                ctx.strokeRect(vertexX - width/2, vertexY - 45, width, height);
                
                ctx.fillStyle = '#F59E0B';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(`${kneeAngle}°`, vertexX, vertexY - 31);
              };
 
              if (landmarks[25]) drawAngleBubble(landmarks[25], leftAngle);
              if (landmarks[26]) drawAngleBubble(landmarks[26], rightAngle);
            } else {
              // Draw unilateral active joint bone segments lines
              ctx.strokeStyle = focusedRehab ? '#3B82F6' : '#10B981'; // Blue for focused assisted, Green for normal active
              ctx.lineWidth = 2.5;
              ctx.lineCap = 'round';
              ctx.lineJoin = 'round';
              
              ctx.beginPath();
              let isFirst = true;
              landmarksOfInterest.forEach((lm) => {
                if (!lm) return;
                const cx = lm.x * canvas.width;
                const cy = lm.y * canvas.height;
                if (isFirst) {
                  ctx.moveTo(cx, cy);
                  isFirst = false;
                } else {
                  ctx.lineTo(cx, cy);
                }
              });
              ctx.stroke();

              // Draw joint nodes (Amber spheres)
              landmarksOfInterest.forEach((lm) => {
                if (!lm) return;
                const cx = lm.x * canvas.width;
                const cy = lm.y * canvas.height;
                
                ctx.beginPath();
                ctx.arc(cx, cy, 5.5, 0, 2 * Math.PI);
                ctx.fillStyle = '#F59E0B'; // Amber orange
                ctx.fill();
                
                ctx.beginPath();
                ctx.arc(cx, cy, 7.5, 0, 2 * Math.PI);
                ctx.strokeStyle = '#FFFFFF';
                ctx.lineWidth = 1.5;
                ctx.stroke();
              });

              // Draw active vertex angle visual dial marker on HTML Canvas
              const vertexNode = landmarksOfInterest[1] || landmarksOfInterest[0];
              if (vertexNode) {
                const vertexX = vertexNode.x * canvas.width;
                const vertexY = vertexNode.y * canvas.height;
                
                ctx.fillStyle = '#0F172A'; // Deep background tag
                ctx.strokeStyle = '#3B82F6';
                ctx.lineWidth = 2;
                
                // Draw custom overlay text bubble directly on key joint
                const padding = 8;
                ctx.font = 'bold 20px "JetBrains Mono", Courier, monospace';
                const metrics = ctx.measureText(`${angle}°`);
                const width = metrics.width + padding * 2;
                const height = 28;
                
                ctx.fillRect(vertexX - width/2, vertexY - 45, width, height);
                ctx.strokeRect(vertexX - width/2, vertexY - 45, width, height);
                
                ctx.fillStyle = '#F59E0B';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(`${angle}°`, vertexX, vertexY - 31);
              }
            }

            ctx.restore();
          } else {
            // Draw fallback silhouette tracker
            ctx.fillStyle = 'rgba(239, 68, 68, 0.15)'; // Red background
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }
        }
      }

      localFrameId = requestAnimationFrame(runPoseTrackingLoop);
    };

    localFrameId = requestAnimationFrame(runPoseTrackingLoop);
    animationFrameIdRef.current = localFrameId;

    return () => {
      cancelAnimationFrame(localFrameId);
    };
  }, [isLoading, cameraError, exerciseId]);

  return (
    <div
      id="exercise-workspace"
      className={`flex flex-col min-h-screen transition-colors duration-300 relative overflow-hidden ${
        contrastMode 
          ? 'bg-black text-white' 
          : 'medical-grid text-white'
      }`}
    >
      
      {/* Session Completed Peaceful Transition Overlay */}
      {sessionCompleted && (
        <div className="absolute inset-0 z-50 flex flex-col justify-center items-center text-center p-6 bg-slate-950/95 backdrop-blur-md animate-fade-in animate-duration-500">
          <div className="p-5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/35 mb-6 success-glow animate-bounce">
            <Award size={64} />
          </div>
          <h2 className="font-display font-black text-3xl text-white tracking-tight mb-3">
            ¡Ejercicio Logrado con Éxito!
          </h2>
          <p className="text-sm text-slate-300 max-w-md leading-relaxed mb-8">
            Felicidades, ha completado sus 5 repeticiones de forma muy segura. Escuche atentamente las recomendaciones clínicas de la inteligencia artificial.
          </p>
          <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-xl px-5 py-3 text-xs font-mono text-emerald-400 animate-pulse">
            <Activity size={16} className="text-amber-500 animate-spin" style={{ animationDuration: '6s' }} />
            <span>Generando su reporte personalizado...</span>
          </div>
        </div>
      )}

      {/* Dynamic Workspace Header - styled according to High Density template */}
      <header className={`h-16 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30 ${
        isFullscreen ? 'hidden' : ''
      } ${
        contrastMode 
          ? 'bg-zinc-950 border-b-2 border-yellow-400' 
          : 'bg-slate-900/95 border-b border-slate-700/60 backdrop-blur'
      }`}>
        <div className="flex items-center gap-3">
          <button
            id="back-btn"
            onClick={onBack}
            className="flex items-center gap-1.5 font-display font-extrabold text-xs border border-slate-700 rounded-lg px-3 py-1.5 hover:bg-slate-800 transition cursor-pointer text-amber-400 border-amber-400/40"
          >
            <ArrowLeft size={14} />
            <span>Volver</span>
          </button>
          <div className="hidden sm:block">
            <h1 className="text-sm font-extrabold tracking-tight leading-none text-white flex items-center gap-1">
              FisioAsistente<span className="text-blue-400">AI</span>
            </h1>
            <p className="text-[9px] uppercase tracking-widest text-slate-400 font-mono">PoC PWA</p>
          </div>
        </div>

        {/* Live system indicators from the design HTML */}
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-1.5 px-2 py-0.5 sm:px-3 sm:py-1 bg-green-500/10 border border-green-500/20 rounded-full">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            <span className="text-[9px] font-semibold text-green-400 uppercase tracking-tighter">MediaPipe Activo</span>
          </div>
          <div className={`flex items-center gap-1.5 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full border ${
            voiceVolume === 0 
              ? 'bg-red-500/10 border-red-500/20 text-red-400' 
              : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
          }`}>
            {voiceVolume === 0 ? (
              <span className="w-1 h-1 bg-red-400 rounded-full" />
            ) : (
              <Volume2 size={10} className="text-blue-400 animate-pulse" />
            )}
            <span className="text-[9px] font-semibold uppercase tracking-tighter">
              {voiceVolume === 0 ? 'Mudo' : `Voz: ${Math.round(voiceVolume * 100)}%`}
            </span>
          </div>
        </div>
      </header>

      {/* Main core loader */}
      {isLoading ? (
        <div id="loading-container" className="flex-1 flex flex-col justify-center items-center p-8 text-center bg-slate-950">
          <div className="relative mb-6">
            <RefreshCw className="text-amber-500 animate-spin" size={60} />
            <Brain className="absolute inset-0 m-auto text-emerald-400 animate-pulse" size={28} />
          </div>
          <h2 className="font-display font-black text-2xl text-white tracking-tight mb-2 uppercase">
            Cargando Asistente Médico...
          </h2>
          <p className="text-slate-400 max-w-sm text-sm mb-4">
            Descargando algoritmos de visión de MediaPipe y calibrando de forma local en su navegador.
          </p>
          <span className="bg-slate-900 border border-slate-850 rounded-lg px-4 py-2 text-xs font-mono text-emerald-400 max-w-xs block overflow-hidden text-ellipsis whitespace-nowrap">
            {loadingStatus}
          </span>
        </div>
      ) : cameraError ? (
        <div id="error-container" className="flex-1 flex flex-col justify-center items-center p-8 text-center bg-red-950/20 animate-fade-in">
          <div className="bg-red-500/20 p-4 rounded-full text-red-400 mb-6 border border-red-500">
            <AlertCircle size={48} />
          </div>
          <h2 className="font-display font-black text-xl text-red-500 tracking-tight mb-2">
            No pudimos iniciar el tracker de cámara
          </h2>
          <p className="text-slate-300 max-w-sm text-sm mb-6">
            {cameraError}
          </p>
          <button
            id="reload-btn"
            onClick={() => window.location.reload()}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-6 rounded-xl cursor-pointer shadow-lg w-full max-w-xs h-12"
          >
            Reintentar acceso
          </button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          
          {/* LEFT: Live camera interactive area */}
          <div 
            ref={cameraContainerRef}
            id="camera-visual-container" 
            className={isFullscreen 
              ? "fixed inset-0 z-40 bg-black p-0" 
              : "flex-1 relative aspect-[4/3] lg:aspect-auto bg-black border-b lg:border-b-0 lg:border-r border-slate-800 p-2 sm:p-4"
            }
          >
            
            <div className={isFullscreen 
              ? "relative w-full h-full border-0 bg-black overflow-hidden" 
              : "relative w-full h-full rounded-2xl sm:rounded-3xl border-2 sm:border-4 border-slate-700 bg-black overflow-hidden shadow-2xl"
            }>
              
              <video
                ref={(node) => {
                  videoRef.current = node;
                  if (node && activeStreamRef.current && node.srcObject !== activeStreamRef.current) {
                    node.srcObject = activeStreamRef.current;
                    node.play().catch((e) => {
                      console.warn('Error playing video stream in ref callback:', e);
                    });
                  }
                }}
                autoPlay
                playsInline
                muted
                className="absolute top-0 left-0 w-full h-full object-cover"
                style={{
                  transform: `scale(${zoomScale})`,
                  transformOrigin: 'center center',
                  transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
              />
              
              {/* Draw overlay canvas */}
              <canvas
                ref={canvasRef}
                className="absolute top-0 left-0 w-full h-full object-cover z-10 pointer-events-none"
                style={{
                  transform: `scale(${zoomScale})`,
                  transformOrigin: 'center center',
                  transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
              />

              {/* Dynamic top-left workspace action buttons */}
              <div className="absolute top-4 left-4 z-35 flex items-center gap-2 pointer-events-auto">
                {isFullscreen ? (
                  <>
                    <button
                      id="exit-fullscreen-btn"
                      type="button"
                      onClick={() => setIsFullscreen(false)}
                      className="flex items-center gap-1.5 font-display font-extrabold text-xs bg-slate-900/95 hover:bg-slate-800 border border-slate-750 text-amber-400 rounded-xl px-3 py-2 shadow-2xl backdrop-blur-md cursor-pointer transition-all active:scale-95"
                    >
                      <Minimize2 size={13} />
                      <span>Vista Normal</span>
                    </button>
                    {!sessionCompleted && (
                      <button
                        id="fullscreen-finish-btn"
                        type="button"
                        onClick={() => onCompleteSession(reps, { angles: anglesHistoryRef.current })}
                        className="flex items-center gap-1.5 font-display font-black text-xs bg-red-650 hover:bg-red-600 border border-red-500/30 text-white rounded-xl px-3 py-2 shadow-2xl cursor-pointer transition-all active:scale-95"
                      >
                        <span>Finalizar</span>
                      </button>
                    )}
                  </>
                ) : (
                  <button
                    id="enter-fullscreen-btn"
                    type="button"
                    onClick={() => setIsFullscreen(true)}
                    className="flex items-center gap-1.5 font-display font-extrabold text-xs bg-slate-900/95 hover:bg-slate-800 border border-slate-700 text-emerald-400 rounded-xl px-3 py-2 shadow-2xl backdrop-blur-md cursor-pointer transition-all active:scale-95"
                  >
                    <Maximize2 size={13} />
                    <span>Pantalla Completa</span>
                  </button>
                )}
              </div>

              {/* Top-Right Floating Repetitions display with scale-up micro-interaction, minimize and draggable behaviour */}
              <motion.div
                drag
                dragMomentum={false}
                dragConstraints={cameraContainerRef}
                className="absolute top-4 right-4 z-35 cursor-grab active:cursor-grabbing pointer-events-auto select-none"
              >
                {isCounterMinimized ? (
                  <div
                    id="minimized-counter-badge"
                    onClick={() => {
                      setIsCounterMinimized(false);
                      triggerVoice("Contador ampliado.");
                    }}
                    className="px-3.5 py-2 rounded-xl bg-slate-900/95 hover:bg-slate-850 text-white font-bold font-mono text-xs border border-emerald-500/60 flex items-center gap-2 shadow-2xl backdrop-blur cursor-pointer select-none transition-colors"
                  >
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span>Reps: <b className="text-emerald-400">0{reps}/05</b></span>
                    <span className="text-[8px] bg-emerald-500/10 border border-emerald-500/20 px-1 py-0.5 rounded text-emerald-300 uppercase font-black">Ver</span>
                  </div>
                ) : (
                  <div
                    className={`px-4 sm:px-5 py-2.5 rounded-2xl flex flex-col items-center border shadow-2xl backdrop-blur-md select-none w-44 ${
                      contrastMode 
                        ? 'bg-black border-yellow-400 text-white' 
                        : 'bg-slate-900/95 border-slate-800 text-white shadow-[0_0_20px_rgba(0,0,0,0.8)]'
                    }`}
                    style={{
                      boxShadow: reps > 0 ? '0 0 35px rgba(16, 185, 129, 0.45)' : 'none'
                    }}
                  >
                    <div className="flex w-full justify-between items-center gap-3">
                      <span className="text-[9px] font-black uppercase text-amber-400 tracking-widest font-mono">
                        Repeticiones
                      </span>
                      <button
                        id="minimize-reps-btn"
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsCounterMinimized(true);
                          triggerVoice("Contador ocultado.");
                        }}
                        className="p-1 rounded-lg bg-slate-950/70 hover:bg-slate-800 transition text-slate-400 hover:text-white cursor-pointer border border-slate-800 flex items-center justify-center shrink-0"
                        title="Minimizar (Ocultar detalles)"
                      >
                        <EyeOff size={11} />
                      </button>
                    </div>
                    <span className="text-4xl sm:text-5xl font-black leading-none mt-1 flex items-baseline font-mono">
                      <span className={reps > 0 ? "text-emerald-400 font-extrabold" : "text-white"}>
                        0{reps}
                      </span>
                      <span className="text-sm text-slate-400 font-normal ml-0.5">/05</span>
                    </span>
                    <div className="text-[7.5px] text-slate-400 font-bold uppercase tracking-wider mt-1.5 opacity-60">
                      ↔ arrastrar ↔
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Floating Draggable Zoom Controls with professional Horizontal Range Slider */}
              <motion.div
                drag
                dragMomentum={false}
                dragConstraints={cameraContainerRef}
                className="absolute bottom-4 right-4 z-35 flex flex-col gap-2 bg-slate-950/90 border border-slate-750/90 rounded-2xl p-3 shadow-2xl backdrop-blur-md pointer-events-auto cursor-grab active:cursor-grabbing select-none w-52 max-w-[85vw]"
              >
                <div className="flex items-center justify-between gap-2" onPointerDown={e => e.stopPropagation()}>
                  <span className="text-[9px] font-black uppercase text-amber-400 tracking-widest font-mono">Zoom Stream</span>
                  <span className="text-xs font-mono font-bold text-slate-300">🔍 {zoomScale.toFixed(1)}x</span>
                </div>
                
                <div className="flex items-center gap-2 mt-0.5" onPointerDown={e => e.stopPropagation()}>
                  <button
                    id="zoom-out-btn"
                    type="button"
                    onClick={() => setZoomScale(prev => Math.max(1.0, prev - 0.1))}
                    disabled={zoomScale <= 1.0}
                    className="p-1 rounded-lg bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-35 disabled:pointer-events-none cursor-pointer border border-slate-800 flex items-center justify-center shrink-0 w-6 h-6 active:scale-90 transition-all font-bold"
                    title="Alejar"
                  >
                    <ZoomOut size={11} className="text-amber-400" />
                  </button>
                  
                  <input
                    type="range"
                    min="1.0"
                    max="2.5"
                    step="0.05"
                    value={zoomScale}
                    onChange={(e) => setZoomScale(parseFloat(e.target.value))}
                    className="flex-1 accent-emerald-500 h-1 bg-slate-850 rounded-lg cursor-pointer"
                    onPointerDown={(e) => e.stopPropagation()}
                  />
                  
                  <button
                    id="zoom-in-btn"
                    type="button"
                    onClick={() => setZoomScale(prev => Math.min(2.5, prev + 0.1))}
                    disabled={zoomScale >= 2.5}
                    className="p-1 rounded-lg bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-35 disabled:pointer-events-none cursor-pointer border border-slate-800 flex items-center justify-center shrink-0 w-6 h-6 active:scale-90 transition-all font-bold"
                    title="Acercar"
                  >
                    <ZoomIn size={11} className="text-emerald-400" />
                  </button>
                </div>
                <div className="text-[7.5px] text-slate-400 font-bold uppercase tracking-wider text-center opacity-60">
                  ↔ arrastrar panel ↔
                </div>
              </motion.div>

              {/* Ready/Preparation screen overlay */}
              {practiceState === 'not_started' && (
                <div className="absolute inset-0 bg-slate-950/80 z-30 flex flex-col justify-center items-center p-4 text-center animate-fade-in backdrop-blur-md">
                  <div className="bg-slate-900/95 border border-slate-750/90 rounded-2xl p-5 max-w-xs sm:max-w-sm shadow-2xl flex flex-col items-center">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-3 text-emerald-400">
                      <Camera size={20} />
                    </div>
                    <h3 className="font-display font-black text-sm sm:text-base text-white leading-tight uppercase tracking-tight">
                      Preparar Alineación
                    </h3>
                    <p className="text-[11px] sm:text-xs text-slate-300 mt-1.5 leading-relaxed">
                      Coloque el teléfono en una base estable y sitúe al paciente a una distancia donde se le observe por completo.
                    </p>
                    
                    {/* Real-time status in preparing mode */}
                    <div className="mt-3.5 w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-left flex items-center justify-between">
                      <div className="flex items-center gap-2 font-display">
                        <span className="relative flex h-2 w-2">
                          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                            isLimbDetected ? 'bg-emerald-400' : 'bg-amber-400'
                          }`}></span>
                          <span className={`relative inline-flex rounded-full h-2 w-2 ${
                            isLimbDetected ? 'bg-emerald-500' : 'bg-amber-500'
                          }`}></span>
                        </span>
                        <span className="text-[9px] font-bold text-slate-300 uppercase font-mono">
                          {isLimbDetected ? 'Paciente detectado ✅' : 'Buscando articulaciones...'}
                        </span>
                      </div>
                      <span className="text-[9px] text-yellow-400 font-bold font-mono">{currentAngle}°</span>
                    </div>

                    <button
                      id="start-practice-btn"
                      type="button"
                      onClick={handleStartPractice}
                      className="mt-5 w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black font-display rounded-xl cursor-pointer shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all transform active:scale-95 text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5"
                    >
                      <span>Comenzar Ejercicio</span>
                    </button>
                    
                    <div className="mt-3 flex items-center gap-1.5 text-[9px] text-slate-400 font-medium font-mono">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                      <span>O diga fuerte: <b className="text-blue-400 font-bold">"Inicio"</b></span>
                    </div>
                  </div>
                </div>
              )}

              {/* Countdown overlay screen */}
              {practiceState === 'countdown' && (
                <div className="absolute inset-0 bg-slate-950/85 z-30 flex flex-col justify-center items-center p-6 text-center backdrop-blur-md">
                  <motion.div
                    key={countdownSeconds}
                    initial={{ scale: 0.3, opacity: 0 }}
                    animate={{ scale: [0.8, 1.25, 1], opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 0.95 }}
                    className="flex flex-col items-center justify-center"
                  >
                    <span className="text-8xl sm:text-9xl font-black text-amber-400 drop-shadow-[0_0_40px_rgba(245,158,11,0.5)] font-mono leading-none">
                      {countdownSeconds}
                    </span>
                    <span className="text-xs font-black font-display text-white tracking-widest uppercase mt-3 animate-pulse">
                      ¡Prepárate!
                    </span>
                  </motion.div>
                </div>
              )}

              {/* Bottom Angle HUD Card overlay from High Density template */}
              {!isFullscreen && (
                <div className="absolute bottom-4 left-4 z-20 pointer-events-none max-w-[85%] sm:max-w-md">
                  <div className={`p-4 rounded-xl flex items-center gap-4 border-l-4 ${
                    contrastMode 
                      ? 'bg-zinc-950 border-l-yellow-400 border border-zinc-700 text-white' 
                      : 'glass-card border-l-yellow-400 text-white'
                  }`}>
                    {/* Circular Dial Indicator from the design HTML */}
                    <div className="relative flex items-center justify-center shrink-0">
                      <svg className="w-14 h-14 sm:w-16 sm:h-16 transform -rotate-90">
                        <circle cx="32" cy="32" r="28" stroke="#1e293b" strokeWidth="4" fill="transparent" />
                        <circle 
                          cx="32" 
                          cy="32" 
                          r="28" 
                          stroke="#f59e0b" 
                          strokeWidth="4" 
                          fill="transparent" 
                          strokeDasharray={175}
                          strokeDashoffset={175 - (175 * Math.min(currentAngle, 180)) / 180}
                          style={{ transition: 'stroke-dashoffset 0.3s' }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-xs sm:text-sm font-black font-mono leading-none">{currentAngle}°</span>
                        <span className="text-[6px] uppercase font-bold text-slate-400">Ángulo</span>
                      </div>
                    </div>

                    <div>
                      <p className="text-[9px] font-bold text-yellow-400 uppercase tracking-widest mb-0.5">
                        Estado: {isLimbDetected ? 'Rastreo Activo' : 'Alineando'}
                      </p>
                      <h3 className="text-xs sm:text-sm font-black leading-tight text-white drop-shadow-md">
                        {isLimbDetected 
                          ? (exerciseId === 'stroke_unilateral_rehab'
                              ? `Lado afectado (${strokeAffectedSide}) detectado.`
                              : exerciseId.includes('bilateral') 
                                ? '¡Ambos brazos detectados! Siga así.' 
                                : `Lado ${activeSide} detectado. ¡Siga así!`) 
                          : (exerciseId === 'stroke_unilateral_rehab'
                              ? `Ajuste su cuerpo frente a la cámara para el hombro ${strokeAffectedSide}.`
                              : exerciseId.includes('bilateral')
                                ? 'Ajuste su cuerpo de frente a la cámara.'
                                : 'Ajuste su cuerpo de perfil frente a la cámara.')
                        }
                      </h3>
                    </div>
                  </div>
                </div>
              )}

              {/* Float HUD detection status pill */}
              {!isFullscreen && (
                <div className="absolute top-4 left-4 z-20 flex flex-col gap-2 pointer-events-none">
                  <div className={`rounded-xl px-3 py-1 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider shadow-lg ${
                    isLimbDetected ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-500/40' : 'bg-red-950/90 text-red-400 border border-red-500/40'
                  }`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${isLimbDetected ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'}`} />
                    <span>
                      {isLimbDetected 
                        ? (exerciseId === 'stroke_unilateral_rehab'
                            ? `Persona (Rehab ${strokeAffectedSide})`
                            : exerciseId.includes('bilateral') ? 'Corporal (Bilateral)' : `Persona (${activeSide})`) 
                        : 'Calibrando'}
                    </span>
                  </div>
                </div>
              )}

              {/* Internal telemetry log overlay from design HTML */}
              <div className="absolute bottom-4 right-4 z-20 pointer-events-none hidden sm:block">
                <div className="bg-black/55 backdrop-blur-sm p-2 rounded-lg border border-white/10 text-[8px] font-mono text-slate-400 leading-tight">
                  <div>LATENCIA: 14ms</div>
                  <div>FPS: 60</div>
                  <div>INF: LITE</div>
                </div>
              </div>

              {/* Calibration visual shadow mask when not detected */}
              {!isLimbDetected && (
                <div className={`absolute inset-0 z-15 flex flex-col justify-center items-center text-center p-6 transition-all duration-300 ${
                  isFullscreen ? 'bg-slate-950/25 backdrop-blur-[1px]' : 'bg-slate-950/60'
                }`}>
                  <div className="bg-amber-500/10 text-amber-400 border border-amber-500/30 p-4 rounded-2xl max-w-xs shadow-xl animate-pulse">
                    <Activity size={32} className="mx-auto mb-2 text-amber-500" />
                    <h4 className="font-bold text-xs uppercase text-amber-300">Buscando articulaciones</h4>
                    <p className="text-[11px] text-slate-300 mt-1 leading-normal">
                      {exerciseId === 'stroke_unilateral_rehab'
                        ? `Por favor colóquese de frente a la cámara para calibrar el hombro del brazo ${strokeAffectedSide} afectado.`
                        : exerciseId.includes('bilateral')
                          ? 'Favor colóquese de frente a la cámara para tomar las métricas de ambos brazos.'
                          : 'Favor colóquese de perfil frente al celular para tomar las métricas.'
                      }
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: High density session program panel of the design HTML */}
          <aside className={`w-full lg:w-80 flex flex-col p-4 sm:p-6 gap-4 overflow-y-auto ${
            isFullscreen ? 'hidden' : ''
          } ${
            contrastMode 
              ? 'bg-black border-t-2 border-yellow-400 lg:border-t-0' 
              : 'bg-slate-900 border-t lg:border-t-0 border-slate-700/60'
          }`}>
            
            {/* Session Plan Card */}
            <div className={`p-4 sm:p-5 rounded-2xl flex-1 border ${
              contrastMode 
                ? 'bg-zinc-950 border-zinc-700' 
                : 'glass-card text-white'
            }`}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 bg-slate-800 rounded-xl flex items-center justify-center text-blue-400">
                  <Activity size={18} />
                </div>
                <div>
                  <h2 className="font-display font-extrabold text-sm text-white">Plan de Sesión</h2>
                  <p className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                    {currentEx.title}
                  </p>
                </div>
              </div>

              {/* Speak steps motivation button */}
              <button
                id="listen-steps-floating-btn"
                type="button"
                onClick={() => {
                  const speechSteps = `Instrucciones del ejercicio ${currentEx.title}: ${currentEx.instructions.join(" ")}`;
                  triggerVoice(speechSteps, true);
                }}
                className={`w-full mb-4 flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  contrastMode
                    ? 'border-yellow-405 border-yellow-400 text-yellow-400 bg-black hover:bg-yellow-400/10'
                    : 'bg-emerald-500/10 border-emerald-500/35 text-emerald-300 hover:bg-emerald-500/20'
                }`}
              >
                <span className="text-sm">📢</span>
                <span>Escuchar Pasos de Ejercicio</span>
              </button>

              {/* Lado Afectado Selector Widget (Post-Derrame) */}
              <div className={`mb-4 p-3.5 rounded-xl border transition-all text-left ${
                contrastMode 
                  ? 'bg-zinc-900 border-zinc-700' 
                  : 'bg-slate-950/80 border-slate-800 bg-gradient-to-br from-slate-950 to-blue-950/5'
              }`}>
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block mb-1">
                  ♿ Lado del cuerpo Monitoreado:
                </span>
                <p className="text-[10px] text-slate-400 leading-normal mb-2.5">
                  Ajuste qué lado de su cuerpo o extremidad desea seguir y calibrar en tiempo real.
                </p>
                <div className="flex gap-1.5 mb-3">
                  <button
                    id="affected-left-btn"
                    type="button"
                    onClick={() => {
                      onStrokeAffectedSideChange('izquierda');
                      triggerVoice("Lado izquierdo seleccionado. Ajustando detección.");
                    }}
                    className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer transition-all border ${
                      strokeAffectedSide === 'izquierda'
                        ? 'bg-amber-600 text-white border-amber-400 shadow font-extrabold'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    👈 Izq
                  </button>
                  <button
                    id="affected-right-btn"
                    type="button"
                    onClick={() => {
                      onStrokeAffectedSideChange('derecha');
                      triggerVoice("Lado derecho seleccionado. Ajustando detección.");
                    }}
                    className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer transition-all border ${
                      strokeAffectedSide === 'derecha'
                        ? 'bg-amber-600 text-white border-amber-400 shadow font-extrabold'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Der 👉
                  </button>
                  <button
                    id="affected-both-btn"
                    type="button"
                    onClick={() => {
                      onStrokeAffectedSideChange('ambos');
                      triggerVoice("Monitoreo de ambos lados seleccionado. Ajustando detección.");
                    }}
                    className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer transition-all border ${
                      strokeAffectedSide === 'ambos'
                        ? 'bg-amber-600 text-white border-amber-400 shadow font-extrabold'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    🔄 Ambos
                  </button>
                </div>

                {/* Inline Focused Rehab toggle widget */}
                <div className="pt-2 border-t border-slate-800/80">
                  <button
                    id="sidebar-focused-rehab-toggle"
                    type="button"
                    onClick={() => {
                      const updated = !focusedRehab;
                      onFocusedRehabChange(updated);
                      triggerVoice(updated ? "Modo de calibración focalizada activado." : "Modo de calibración completa activado.");
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded-lg border text-left cursor-pointer transition-all text-[10px] ${
                      focusedRehab
                        ? 'bg-amber-950/20 border-amber-500/30 text-amber-300 font-bold'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    <span>Rehabilitación Focalizada</span>
                    <span className={`px-1.5 py-0.5 text-[8px] rounded uppercase ${
                      focusedRehab ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-slate-800 text-slate-500'
                    }`}>
                      {focusedRehab ? 'Activo' : 'Inactivo'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Current state and step progress bar list */}
              <ul className="space-y-2.5">
                <li className={`flex items-center gap-3 p-3 rounded-lg border leading-tight ${
                  contrastMode 
                    ? 'bg-zinc-900 border-yellow-400' 
                    : 'bg-blue-500/10 border-blue-500/30'
                }`}>
                  <div className="w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold font-mono">
                    1
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-black text-white leading-none">Extensión Activa</p>
                    <div className="w-full bg-slate-800 h-1 mt-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-blue-400 h-full transition-all duration-300"
                        style={{ width: `${(reps / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                </li>

                <li className="flex items-center gap-3 p-2.5 bg-slate-800/30 opacity-40 grayscale rounded-lg border border-transparent">
                  <div className="w-5 h-5 bg-slate-700 text-slate-500 rounded-full flex items-center justify-center text-[10px] font-mono">
                    2
                  </div>
                  <p className="text-xs font-bold text-slate-400 leading-none">Elevación Mantenida</p>
                </li>
              </ul>

              {/* Adjust voice feedback volume slider */}
              <div className="mt-5 pt-4 border-t border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="sidebar-vol-slider" className="text-[9px] uppercase font-bold text-slate-400 tracking-widest font-mono flex items-center gap-1.5">
                    {voiceVolume === 0 ? (
                      <span className="text-red-405 text-red-400">🔇</span>
                    ) : (
                      <Volume2 className="text-blue-400" size={12} />
                    )}
                    <span>Volumen Guía</span>
                  </label>
                  <span className="text-[10px] font-mono font-bold text-slate-300">
                    {Math.round(voiceVolume * 100)}%
                  </span>
                </div>
                <div className="flex items-center gap-2.5 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800/80">
                  <input
                    id="sidebar-vol-slider"
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={voiceVolume}
                    aria-label="Volumen de asistencia de voz"
                    onChange={(e) => onVoiceVolumeChange(parseFloat(e.target.value))}
                    className="w-full accent-blue-500 h-1 rounded-lg appearance-none cursor-pointer bg-slate-800"
                  />
                  <button
                    id="test-val-btn"
                    onClick={() => {
                      voiceService.setEnabled(voiceVolume > 0);
                      voiceService.setVolume(voiceVolume);
                      voiceService.speak("Probando volumen", true);
                    }}
                    disabled={voiceVolume === 0}
                    className={`shrink-0 px-2 py-1 text-[9px] font-black uppercase rounded-md border transition-all select-none ${
                        voiceVolume === 0
                          ? 'opacity-30 cursor-not-allowed border-slate-800 text-slate-500'
                          : contrastMode
                            ? 'border-yellow-400 text-yellow-400 hover:bg-yellow-400/20'
                            : 'border-blue-500/60 text-blue-400 hover:bg-blue-500/15'
                      }`}
                  >
                    Probar
                  </button>
                </div>
              </div>

              {/* Ritmo y Velocidad de Ejercicio */}
              <div className="mt-5 pt-4 border-t border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] uppercase font-bold text-slate-400 tracking-widest font-mono flex items-center gap-1.5">
                    🐢 <span>Ritmo de Guía</span>
                  </span>
                  <span className="text-[10px] font-mono font-bold text-slate-300 uppercase tracking-widest">
                    {exercisePace}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800/80">
                  <button
                    id="sidebar-pace-lento"
                    type="button"
                    onClick={() => onExercisePaceChange('lento')}
                    className={`py-1 text-[10px] rounded-lg font-bold text-center cursor-pointer transition-all ${
                      exercisePace === 'lento'
                        ? 'bg-blue-600 text-white shadow font-extrabold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Lento
                  </button>
                  <button
                    id="sidebar-pace-normal"
                    type="button"
                    onClick={() => onExercisePaceChange('normal')}
                    className={`py-1 text-[10px] rounded-lg font-bold text-center cursor-pointer transition-all ${
                      exercisePace === 'normal'
                        ? 'bg-blue-600 text-white shadow font-extrabold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Normal
                  </button>
                  <button
                    id="sidebar-pace-rapido"
                    type="button"
                    onClick={() => onExercisePaceChange('rapido')}
                    className={`py-1 text-[10px] rounded-lg font-bold text-center cursor-pointer transition-all ${
                      exercisePace === 'rapido'
                        ? 'bg-blue-600 text-white shadow font-extrabold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Rápido
                  </button>
                </div>
              </div>

              {/* IA Assistant Feedback Box */}
              <div className="mt-5 pt-4 border-t border-slate-800">
                <p className="text-[9px] uppercase font-bold text-slate-500 mb-2 tracking-widest font-mono">
                  IA Assistant Feedback
                </p>
                <div className="bg-slate-950 rounded-xl p-3.5 italic text-xs text-slate-300 border border-slate-800 flex items-start gap-2">
                  <Smile size={14} className="text-emerald-400 shrink-0 mt-0.5 animate-bounce" />
                  <p className="leading-relaxed">
                    "{speechTranscript || 'Colóquese en posición inicial frente a la cámara.'}"
                  </p>
                </div>
              </div>
            </div>

            {/* Complete workflow action buttons */}
            <div className="flex flex-col gap-2">
              <button
                id="finish-session-btn"
                onClick={() => onCompleteSession(reps, { angles: anglesHistoryRef.current })}
                className="w-full py-4 bg-red-600 hover:bg-red-500 transition-colors rounded-2xl font-black text-sm tracking-widest uppercase shadow-lg shadow-red-900/10 cursor-pointer h-12 flex justify-center items-center"
              >
                Finalizar Sesión
              </button>
            </div>

          </aside>

        </div>
      )}
    </div>
  );
};
