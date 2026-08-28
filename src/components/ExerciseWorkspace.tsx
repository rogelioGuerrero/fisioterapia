/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { ExerciseType, Landmark, ExercisePace } from '../types';
import { EXERCISES, AUDIO_PHRASES } from '../data';
import { voiceService } from '../services/voice';
import {
  EXERCISE_ANGLES,
  VISIBILITY_THRESHOLDS,
  SAFETY_LOCKOUT_MS,
  EFFORT_PROMPT_DELAY_MS,
  INTERMEDIATE_ZONE_MARGIN,
  SESSION_PARAMS,
  HAPTIC_PATTERNS,
  CAMERA_CONFIG,
} from '../clinicalConstants';
import { ArrowLeft, Camera, RefreshCw, Volume2, Activity, Brain, AlertCircle, Award, PlayCircle } from 'lucide-react';

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
  const [showDemoVideo, setShowDemoVideo] = useState<boolean>(false);
  const hasSpokenReadyRef = useRef<boolean>(false);
  const isCompletedRef = useRef<boolean>(false);
  const [zoomScale, setZoomScale] = useState<number>(1.0);
  const wakeLockRef = useRef<any>(null);
  
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

  // Trunk lateral lean: angle of the line from hip-center to shoulder-center relative to vertical.
  // Returns absolute lean in degrees [0, 90]. 0° = perfectly upright, 12° = functional lean target.
  const calculateTrunkLeanAngle = (
    leftShoulder: Landmark, rightShoulder: Landmark,
    leftHip: Landmark, rightHip: Landmark
  ): number => {
    if (!leftShoulder || !rightShoulder || !leftHip || !rightHip) return 0;

    const shoulderMid = {
      x: (leftShoulder.x + rightShoulder.x) / 2,
      y: (leftShoulder.y + rightShoulder.y) / 2,
    };
    const hipMid = {
      x: (leftHip.x + rightHip.x) / 2,
      y: (leftHip.y + rightHip.y) / 2,
    };

    // Vector from hip center to shoulder center
    const dx = shoulderMid.x - hipMid.x;
    const dy = hipMid.y - shoulderMid.y; // In screen coords, y increases downward; invert for "up"

    if (dy <= 0) return 0; // Shoulders below hips — invalid pose

    // Angle from vertical (y-axis): atan2(|dx|, |dy|)
    const angleRad = Math.atan2(Math.abs(dx), Math.abs(dy));
    return Math.round((angleRad * 180) / Math.PI);
  };

  // Generic lateral angle: angle of a line from point A to point B relative to vertical.
  // Used for hip abduction (hip→knee) and cervical flexion (shoulder-mid→nose).
  const calculateLateralAngle = (a: Landmark, b: Landmark): number => {
    if (!a || !b) return 0;
    const dx = b.x - a.x;
    const dy = a.y - b.y; // In screen coords, y increases downward
    if (dy <= 0) return 0;
    const angleRad = Math.atan2(Math.abs(dx), Math.abs(dy));
    return Math.round((angleRad * 180) / Math.PI);
  };

  // Draw text that compensates for the CSS scaleX(-1) mirror on the canvas.
  // The canvas element has transform: scaleX(-1) to match the mirrored video,
  // which inverts all drawn text horizontally. This helper temporarily un-mirrors
  // the text by applying a local scale(-1,1) around the text position.
  const drawUnmirroredText = (
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number
  ) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(-1, 1);
    ctx.fillText(text, 0, 0);
    ctx.restore();
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
            facingMode: CAMERA_CONFIG.facingMode,
            width: { ideal: CAMERA_CONFIG.width },
            height: { ideal: CAMERA_CONFIG.height },
            frameRate: { ideal: CAMERA_CONFIG.frameRate }
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
        // No voice here — wait until patient is detected before speaking

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

  // Wake Lock: keep screen awake during exercise
  useEffect(() => {
    let active = true;
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        }
      } catch (e) {
        console.warn('Wake Lock failed:', e);
      }
    };
    requestWakeLock();

    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && active) {
        requestWakeLock();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      active = false;
      document.removeEventListener('visibilitychange', handleVisibility);
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
        wakeLockRef.current = null;
      }
    };
  }, []);

  const handleStartPractice = () => {
    if (practiceStateRef.current !== 'not_started') return;
    setPracticeState('countdown');
    setCountdownSeconds(SESSION_PARAMS.countdownSeconds);
    
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

      // Single short calibration hint after a brief pause — no more 70s of speech
      const t1 = setTimeout(() => {
        if (active && repetitionsRef.current === 0 && !isCompletedRef.current) {
          triggerVoice(AUDIO_PHRASES.calibration_help);
        }
      }, SESSION_PARAMS.speechDelayWelcomeMs);

      return () => {
        active = false;
        clearTimeout(t1);
      };
    } else {
      triggerVoice(welcomePhrase, true);

      const t1 = setTimeout(() => {
        if (active && repetitionsRef.current === 0 && !isCompletedRef.current) {
          triggerVoice(AUDIO_PHRASES.calibration_help);
        }
      }, SESSION_PARAMS.speechDelayWelcomeMs);

      return () => {
        active = false;
        clearTimeout(t1);
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

          if (exerciseId === 'assisted_shoulder_abduction') {
            // Unilateral shoulder elevation auto-assisted (Hip, Shoulder, Elbow)
            if (activeStrokeSide === 'izquierda') {
              sideSelected = 'izquierda';
              landmarksOfInterest = [landmarks[23], landmarks[11], landmarks[13]];
              
              if (focusedRehab) {
                // Focused rehab disables strict visibility requirements on the affected side. 
                // We check if the healthy side is well visible instead to allow progress.
                detected = (landmarks[24]?.visibility || 0) > VISIBILITY_THRESHOLDS.relaxed && (landmarks[12]?.visibility || 0) > VISIBILITY_THRESHOLDS.relaxed;
              } else {
                detected = (landmarks[23]?.visibility || 0) > VISIBILITY_THRESHOLDS.normal && (landmarks[11]?.visibility || 0) > VISIBILITY_THRESHOLDS.normal;
              }
            } else {
              sideSelected = 'derecha';
              landmarksOfInterest = [landmarks[24], landmarks[12], landmarks[14]];

              if (focusedRehab) {
                detected = (landmarks[23]?.visibility || 0) > VISIBILITY_THRESHOLDS.relaxed && (landmarks[11]?.visibility || 0) > VISIBILITY_THRESHOLDS.relaxed;
              } else {
                detected = (landmarks[24]?.visibility || 0) > VISIBILITY_THRESHOLDS.normal && (landmarks[12]?.visibility || 0) > VISIBILITY_THRESHOLDS.normal;
              }
            }

            if (detected) {
              // Calculate angle. If focused rehab is on and key landmarks on affected side are hidden,
              // we can fallback to estimating the movement based on the healthy side (since both are held together).
              const vertexPoint = landmarksOfInterest[1];
              if (focusedRehab && (!vertexPoint || (vertexPoint.visibility || 0) < VISIBILITY_THRESHOLDS.fallback)) {
                const healthyLandmarks = healthySide === 'izquierda' 
                  ? [landmarks[23], landmarks[11], landmarks[13]] 
                  : [landmarks[24], landmarks[12], landmarks[14]];
                if (healthyLandmarks[0] && healthyLandmarks[1] && healthyLandmarks[2]) {
                  angle = calculateAngle(healthyLandmarks[0], healthyLandmarks[1], healthyLandmarks[2]);
                } else {
                  angle = EXERCISE_ANGLES.assistedShoulderAbduction.rest; // resting fallback
                }
              } else if (landmarksOfInterest[0] && landmarksOfInterest[1] && landmarksOfInterest[2]) {
                angle = calculateAngle(landmarksOfInterest[0], landmarksOfInterest[1], landmarksOfInterest[2]);
              } else {
                angle = EXERCISE_ANGLES.assistedShoulderAbduction.rest;
              }
            }

          } else if (exerciseId === 'seated_hip_abduction') {
            // Seated hip abduction: angle of hip→knee relative to vertical (frontal plane)
            if (strokeAffectedSide === 'ambos') {
              sideSelected = 'ambos' as any;

              const leftHipVisible = (landmarks[23]?.visibility || 0) > VISIBILITY_THRESHOLDS.normal &&
                                     (landmarks[25]?.visibility || 0) > VISIBILITY_THRESHOLDS.normal;
              const rightHipVisible = (landmarks[24]?.visibility || 0) > VISIBILITY_THRESHOLDS.normal &&
                                      (landmarks[26]?.visibility || 0) > VISIBILITY_THRESHOLDS.normal;

              detected = leftHipVisible || rightHipVisible;

              if (detected) {
                if (landmarks[23] && landmarks[25]) {
                  leftAngle = calculateLateralAngle(landmarks[23], landmarks[25]);
                }
                if (landmarks[24] && landmarks[26]) {
                  rightAngle = calculateLateralAngle(landmarks[24], landmarks[26]);
                }
                angle = Math.max(leftAngle, rightAngle);
                landmarksOfInterest = [landmarks[23], landmarks[25], landmarks[24], landmarks[26]].filter(Boolean) as Landmark[];
              }
            } else {
              if (activeStrokeSide === 'izquierda') {
                sideSelected = 'izquierda';
                landmarksOfInterest = [landmarks[23], landmarks[25]];

                detected = (landmarks[23]?.visibility || 0) > VISIBILITY_THRESHOLDS.normal &&
                           (landmarks[25]?.visibility || 0) > VISIBILITY_THRESHOLDS.normal;
              } else {
                sideSelected = 'derecha';
                landmarksOfInterest = [landmarks[24], landmarks[26]];

                detected = (landmarks[24]?.visibility || 0) > VISIBILITY_THRESHOLDS.normal &&
                           (landmarks[26]?.visibility || 0) > VISIBILITY_THRESHOLDS.normal;
              }

              if (detected) {
                angle = calculateLateralAngle(landmarksOfInterest[0], landmarksOfInterest[1]);
              }
            }

          } else if (exerciseId === 'bilateral_arm_abduction') {
            // Bilateral Arms Coordination. Check both sides
            // Left: Hip(23), Shoulder(11), Elbow(13)
            // Right: Hip(24), Shoulder(12), Elbow(14)
            const leftOk = (landmarks[11]?.visibility || 0) > VISIBILITY_THRESHOLDS.relaxed && (landmarks[13]?.visibility || 0) > VISIBILITY_THRESHOLDS.relaxed;
            const rightOk = (landmarks[12]?.visibility || 0) > VISIBILITY_THRESHOLDS.relaxed && (landmarks[14]?.visibility || 0) > VISIBILITY_THRESHOLDS.relaxed;
            
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
              } else { leftAngle = EXERCISE_ANGLES.bilateralArmAbduction.rest; }
              if (landmarks[24] && landmarks[12] && landmarks[14]) {
                rightAngle = calculateAngle(landmarks[24], landmarks[12], landmarks[14]);
              } else { rightAngle = EXERCISE_ANGLES.bilateralArmAbduction.rest; }

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
          } else if (exerciseId === 'cervical_lateral_flexion') {
            // Cervical lateral flexion: angle of shoulder-midpoint→nose relative to vertical
            // Landmarks: 0 (nose), 11 (left shoulder), 12 (right shoulder)
            const noseVisible = (landmarks[0]?.visibility || 0) > VISIBILITY_THRESHOLDS.normal;
            const shouldersVisible = (landmarks[11]?.visibility || 0) > VISIBILITY_THRESHOLDS.normal &&
                                     (landmarks[12]?.visibility || 0) > VISIBILITY_THRESHOLDS.normal;

            detected = noseVisible && shouldersVisible;

            if (strokeAffectedSide === 'ambos') {
              sideSelected = 'derecha';
            } else {
              sideSelected = strokeAffectedSide;
            }

            if (detected) {
              // Calculate shoulder midpoint
              const shoulderMid: Landmark = {
                x: (landmarks[11].x + landmarks[12].x) / 2,
                y: (landmarks[11].y + landmarks[12].y) / 2,
              };
              angle = calculateLateralAngle(shoulderMid, landmarks[0]);
              landmarksOfInterest = [landmarks[0], landmarks[11], landmarks[12]];
            }
          } else if (exerciseId === 'shoulder_abduction') {
            // Shoulder abduction: hip→shoulder→elbow (same landmarks as flexion, frontal plane movement)
            if (activeStrokeSide === 'izquierda') {
              sideSelected = 'izquierda';
              landmarksOfInterest = [landmarks[23], landmarks[11], landmarks[13]];

              if (focusedRehab) {
                detected = (landmarks[24]?.visibility || 0) > VISIBILITY_THRESHOLDS.relaxed && (landmarks[12]?.visibility || 0) > VISIBILITY_THRESHOLDS.relaxed;
              } else {
                detected = (landmarks[23]?.visibility || 0) > VISIBILITY_THRESHOLDS.normal && (landmarks[11]?.visibility || 0) > VISIBILITY_THRESHOLDS.normal;
              }
            } else {
              sideSelected = 'derecha';
              landmarksOfInterest = [landmarks[24], landmarks[12], landmarks[14]];

              if (focusedRehab) {
                detected = (landmarks[23]?.visibility || 0) > VISIBILITY_THRESHOLDS.relaxed && (landmarks[11]?.visibility || 0) > VISIBILITY_THRESHOLDS.relaxed;
              } else {
                detected = (landmarks[24]?.visibility || 0) > VISIBILITY_THRESHOLDS.normal && (landmarks[12]?.visibility || 0) > VISIBILITY_THRESHOLDS.normal;
              }
            }

            if (detected) {
              const vertexPoint = landmarksOfInterest[1];
              if (focusedRehab && (!vertexPoint || (vertexPoint.visibility || 0) < VISIBILITY_THRESHOLDS.fallback)) {
                const healthyArm = healthySide === 'izquierda'
                  ? [landmarks[23], landmarks[11], landmarks[13]]
                  : [landmarks[24], landmarks[12], landmarks[14]];
                if (healthyArm[0] && healthyArm[1] && healthyArm[2]) {
                  angle = calculateAngle(healthyArm[0], healthyArm[1], healthyArm[2]);
                } else {
                  angle = EXERCISE_ANGLES.shoulderAbduction.rest;
                }
              } else if (landmarksOfInterest[0] && landmarksOfInterest[1] && landmarksOfInterest[2]) {
                angle = calculateAngle(landmarksOfInterest[0], landmarksOfInterest[1], landmarksOfInterest[2]);
              } else {
                angle = EXERCISE_ANGLES.shoulderAbduction.rest;
              }
            }
          } else if (exerciseId === 'trunk_lateral_lean') {
            // Trunk lateral lean: angle between shoulder line and hip line (relative to vertical)
            // Uses landmarks 11, 12 (shoulders) and 23, 24 (hips)
            const shouldersVisible = (landmarks[11]?.visibility || 0) > VISIBILITY_THRESHOLDS.normal && (landmarks[12]?.visibility || 0) > VISIBILITY_THRESHOLDS.normal;
            const hipsVisible = (landmarks[23]?.visibility || 0) > VISIBILITY_THRESHOLDS.normal && (landmarks[24]?.visibility || 0) > VISIBILITY_THRESHOLDS.normal;

            detected = shouldersVisible && hipsVisible;

            if (strokeAffectedSide === 'ambos') {
              sideSelected = 'derecha';
            } else {
              sideSelected = strokeAffectedSide;
            }

            if (detected) {
              angle = calculateTrunkLeanAngle(landmarks[11], landmarks[12], landmarks[23], landmarks[24]);
              // For trunk lean, landmarksOfInterest is the 4-point set for drawing
              landmarksOfInterest = [landmarks[11], landmarks[12], landmarks[23], landmarks[24]];
            }
          }

          setActiveSide(sideSelected);
          setIsLimbDetected(detected);

          // Speak "ready" prompt only once when patient is first detected
          if (detected && !hasSpokenReadyRef.current && practiceStateRef.current === 'not_started') {
            hasSpokenReadyRef.current = true;
            triggerVoice("Cámara lista. Diga Inicio o presione el botón para comenzar.", true);
          }

          if (detected) {
            // Calculate joint angles in real time
            setCurrentAngle(angle);

            // Save telemetry
            anglesHistoryRef.current.push(angle);

            // Exercise State Machine logic
            const minGoal = currentEx.minAngle;
            const maxGoal = currentEx.maxAngle;
            const isLowDirection = currentEx.triggerDirection === 'low';

            let isRelaxed = false;
            let isExtended = false;

            if (exerciseId === 'bilateral_arm_abduction') {
              // Symmetrical tracking checks (always 'high' direction)
              isRelaxed = leftAngle <= minGoal && rightAngle <= minGoal;
              isExtended = leftAngle >= maxGoal && rightAngle >= maxGoal;
            } else if (isLowDirection) {
              // 'low' direction: angle DECREASES toward target (e.g., elbow flexion)
              // Resting = high angle (maxGoal). Target = low angle (minGoal).
              isRelaxed = angle >= maxGoal;
              isExtended = angle <= minGoal;
            } else {
              // 'high' direction: angle INCREASES toward target (default)
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
                
                let safetyLockout: number = SAFETY_LOCKOUT_MS.normal;
                if (exercisePace === 'lento') {
                  safetyLockout = SAFETY_LOCKOUT_MS.lento; // Patient lockout for slower reps
                } else if (exercisePace === 'rapido') {
                  safetyLockout = SAFETY_LOCKOUT_MS.rapido; // Snappy lockout for faster loops
                }
                
                if (coolingDownTime > safetyLockout) { // Dynamic safety lockout threshold (2.5s) to avoid jitter double counts
                  repetitionsRef.current += 1;
                  lastRepTimeRef.current = Date.now();
                  isReadyForRepRef.current = false;
                  setReps(repetitionsRef.current);

                  if (repetitionsRef.current >= SESSION_PARAMS.targetRepetitions) {
                    isCompletedRef.current = true;
                    setSessionCompleted(true);
                    triggerVoice(AUDIO_PHRASES.final_celebration, true);
                    if (navigator.vibrate) navigator.vibrate(HAPTIC_PATTERNS.sessionCompleted);
                    // Hold rendering loop brief and transition
                    setTimeout(() => {
                      onCompleteSession(SESSION_PARAMS.targetRepetitions, { angles: anglesHistoryRef.current });
                    }, SESSION_PARAMS.completionHoldMs);
                  } else {
                    triggerVoice(AUDIO_PHRASES.rep_count(repetitionsRef.current), true);
                    if (navigator.vibrate) navigator.vibrate(HAPTIC_PATTERNS.repCompleted);
                  }
                }
              }

              // Step 3: Effort reminder if stuck at intermediate extension
              // Intermediate zone means they try effort, but get stuck/struggle
              const intermediateMinVal = minGoal + INTERMEDIATE_ZONE_MARGIN.aboveMin;
              const intermediateMaxVal = maxGoal - INTERMEDIATE_ZONE_MARGIN.belowMax;
              if (angle >= intermediateMinVal && angle < intermediateMaxVal) {
                if (!effortStartTimeRef.current) {
                  effortStartTimeRef.current = Date.now();
                } else {
                  const elapsedEffort = Date.now() - effortStartTimeRef.current;
                  if (elapsedEffort > EFFORT_PROMPT_DELAY_MS && !hasEncouragedRef.current) {
                    // Speak high-visibility verbal encouragement
                    const encouragementText =
                      exerciseId === 'seated_hip_abduction'
                        ? AUDIO_PHRASES.effort_prompt_hip
                        : exerciseId === 'cervical_lateral_flexion'
                        ? AUDIO_PHRASES.effort_prompt_neck
                        : exerciseId === 'shoulder_abduction'
                        ? AUDIO_PHRASES.effort_prompt_abduction
                        : exerciseId === 'trunk_lateral_lean'
                        ? AUDIO_PHRASES.effort_prompt_trunk
                        : exerciseId === 'bilateral_arm_abduction'
                        ? AUDIO_PHRASES.effort_prompt_bilateral
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
            
            if (exerciseId === 'bilateral_arm_abduction') {
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
                drawUnmirroredText(ctx, `${prAngle}°`, vertexX, vertexY - 31);
              };

              if (landmarks[11]) drawAngleBubble(landmarks[11], leftAngle);
              if (landmarks[12]) drawAngleBubble(landmarks[12], rightAngle);
            } else if (exerciseId === 'seated_hip_abduction' && strokeAffectedSide === 'ambos') {
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
                drawUnmirroredText(ctx, `${kneeAngle}°`, vertexX, vertexY - 31);
              };
 
              if (landmarks[25]) drawAngleBubble(landmarks[25], leftAngle);
              if (landmarks[26]) drawAngleBubble(landmarks[26], rightAngle);
            } else if (exerciseId === 'trunk_lateral_lean') {
              // Draw trunk: shoulder line + hip line + vertical reference
              ctx.strokeStyle = focusedRehab ? '#3B82F6' : '#10B981';
              ctx.lineWidth = 3;
              ctx.lineCap = 'round';

              // Draw shoulder line (11→12)
              if (landmarks[11] && landmarks[12]) {
                ctx.beginPath();
                ctx.moveTo(landmarks[11].x * canvas.width, landmarks[11].y * canvas.height);
                ctx.lineTo(landmarks[12].x * canvas.width, landmarks[12].y * canvas.height);
                ctx.stroke();
              }

              // Draw hip line (23→24)
              if (landmarks[23] && landmarks[24]) {
                ctx.beginPath();
                ctx.moveTo(landmarks[23].x * canvas.width, landmarks[23].y * canvas.height);
                ctx.lineTo(landmarks[24].x * canvas.width, landmarks[24].y * canvas.height);
                ctx.stroke();
              }

              // Draw vertical reference line (hip center → up) as dashed
              if (landmarks[23] && landmarks[24]) {
                const hipMidX = ((landmarks[23].x + landmarks[24].x) / 2) * canvas.width;
                const hipMidY = ((landmarks[23].y + landmarks[24].y) / 2) * canvas.height;
                ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
                ctx.lineWidth = 1.5;
                ctx.setLineDash([6, 4]);
                ctx.beginPath();
                ctx.moveTo(hipMidX, hipMidY);
                ctx.lineTo(hipMidX, hipMidY - 200);
                ctx.stroke();
                ctx.setLineDash([]);

                // Draw lean line (hip center → shoulder center)
                if (landmarks[11] && landmarks[12]) {
                  const shoulderMidX = ((landmarks[11].x + landmarks[12].x) / 2) * canvas.width;
                  const shoulderMidY = ((landmarks[11].y + landmarks[12].y) / 2) * canvas.height;
                  ctx.strokeStyle = '#F59E0B';
                  ctx.lineWidth = 2.5;
                  ctx.beginPath();
                  ctx.moveTo(hipMidX, hipMidY);
                  ctx.lineTo(shoulderMidX, shoulderMidY);
                  ctx.stroke();
                }
              }

              // Draw joint nodes for all 4 landmarks
              const trunkJoints = [landmarks[11], landmarks[12], landmarks[23], landmarks[24]].filter(Boolean);
              trunkJoints.forEach((lm) => {
                const cx = lm.x * canvas.width;
                const cy = lm.y * canvas.height;
                ctx.beginPath();
                ctx.arc(cx, cy, 6, 0, 2 * Math.PI);
                ctx.fillStyle = '#F59E0B';
                ctx.fill();
                ctx.beginPath();
                ctx.arc(cx, cy, 8, 0, 2 * Math.PI);
                ctx.strokeStyle = '#FFFFFF';
                ctx.lineWidth = 1.5;
                ctx.stroke();
              });

              // Draw angle bubble at shoulder center
              if (landmarks[11] && landmarks[12]) {
                const shoulderMidX = ((landmarks[11].x + landmarks[12].x) / 2) * canvas.width;
                const shoulderMidY = ((landmarks[11].y + landmarks[12].y) / 2) * canvas.height;
                ctx.fillStyle = '#0F172A';
                ctx.strokeStyle = '#3B82F6';
                ctx.lineWidth = 2;
                const padding = 8;
                ctx.font = 'bold 20px "JetBrains Mono", Courier, monospace';
                const metrics = ctx.measureText(`${angle}°`);
                const width = metrics.width + padding * 2;
                const height = 28;
                ctx.fillRect(shoulderMidX - width / 2, shoulderMidY - 45, width, height);
                ctx.strokeRect(shoulderMidX - width / 2, shoulderMidY - 45, width, height);
                ctx.fillStyle = '#F59E0B';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                drawUnmirroredText(ctx, `${angle}°`, shoulderMidX, shoulderMidY - 31);
              }
            } else if (exerciseId === 'cervical_lateral_flexion') {
              // Draw cervical: shoulder line + nose + vertical reference
              ctx.strokeStyle = focusedRehab ? '#3B82F6' : '#10B981';
              ctx.lineWidth = 3;
              ctx.lineCap = 'round';

              // Draw shoulder line (11→12)
              if (landmarks[11] && landmarks[12]) {
                ctx.beginPath();
                ctx.moveTo(landmarks[11].x * canvas.width, landmarks[11].y * canvas.height);
                ctx.lineTo(landmarks[12].x * canvas.width, landmarks[12].y * canvas.height);
                ctx.stroke();
              }

              // Draw vertical reference from shoulder center (dashed)
              if (landmarks[11] && landmarks[12]) {
                const shoulderMidX = ((landmarks[11].x + landmarks[12].x) / 2) * canvas.width;
                const shoulderMidY = ((landmarks[11].y + landmarks[12].y) / 2) * canvas.height;
                ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
                ctx.lineWidth = 1.5;
                ctx.setLineDash([6, 4]);
                ctx.beginPath();
                ctx.moveTo(shoulderMidX, shoulderMidY);
                ctx.lineTo(shoulderMidX, shoulderMidY - 150);
                ctx.stroke();
                ctx.setLineDash([]);

                // Draw lean line (shoulder center → nose)
                if (landmarks[0]) {
                  const noseX = landmarks[0].x * canvas.width;
                  const noseY = landmarks[0].y * canvas.height;
                  ctx.strokeStyle = '#F59E0B';
                  ctx.lineWidth = 2.5;
                  ctx.beginPath();
                  ctx.moveTo(shoulderMidX, shoulderMidY);
                  ctx.lineTo(noseX, noseY);
                  ctx.stroke();
                }
              }

              // Draw joint nodes
              const neckJoints = [landmarks[0], landmarks[11], landmarks[12]].filter(Boolean);
              neckJoints.forEach((lm) => {
                const cx = lm.x * canvas.width;
                const cy = lm.y * canvas.height;
                ctx.beginPath();
                ctx.arc(cx, cy, 6, 0, 2 * Math.PI);
                ctx.fillStyle = '#F59E0B';
                ctx.fill();
                ctx.beginPath();
                ctx.arc(cx, cy, 8, 0, 2 * Math.PI);
                ctx.strokeStyle = '#FFFFFF';
                ctx.lineWidth = 1.5;
                ctx.stroke();
              });

              // Draw angle bubble at nose
              if (landmarks[0]) {
                const noseX = landmarks[0].x * canvas.width;
                const noseY = landmarks[0].y * canvas.height;
                ctx.fillStyle = '#0F172A';
                ctx.strokeStyle = '#3B82F6';
                ctx.lineWidth = 2;
                const padding = 8;
                ctx.font = 'bold 20px "JetBrains Mono", Courier, monospace';
                const metrics = ctx.measureText(`${angle}°`);
                const width = metrics.width + padding * 2;
                const height = 28;
                ctx.fillRect(noseX - width / 2, noseY - 45, width, height);
                ctx.strokeRect(noseX - width / 2, noseY - 45, width, height);
                ctx.fillStyle = '#F59E0B';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                drawUnmirroredText(ctx, `${angle}°`, noseX, noseY - 31);
              }
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
                drawUnmirroredText(ctx, `${angle}°`, vertexX, vertexY - 31);
              }
            }

            ctx.restore();
          } else {
            // Not fully detected yet — still draw skeleton with lines so patient
            // can see what the camera sees and position themselves correctly.
            const relevantLms = landmarksOfInterest.length > 0
              ? landmarksOfInterest
              : [landmarks[11], landmarks[12], landmarks[13], landmarks[14], landmarks[23], landmarks[24], landmarks[25], landmarks[26], landmarks[27], landmarks[28]];

            // Draw connecting lines between visible landmarks (dimmed amber)
            ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)';
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
            ctx.beginPath();
            let prevLm: Landmark | null = null;
            for (const lm of relevantLms) {
              if (!lm || (lm.visibility ?? 1) < 0.3) {
                prevLm = null;
                continue;
              }
              const cx = lm.x * canvas.width;
              const cy = lm.y * canvas.height;
              if (prevLm) {
                ctx.lineTo(cx, cy);
              } else {
                ctx.moveTo(cx, cy);
              }
              prevLm = lm;
            }
            ctx.stroke();

            // Draw joint dots on top
            ctx.fillStyle = 'rgba(245, 158, 11, 0.8)';
            for (const lm of relevantLms) {
              if (!lm || (lm.visibility ?? 1) < 0.3) continue;
              ctx.beginPath();
              ctx.arc(lm.x * canvas.width, lm.y * canvas.height, 4, 0, 2 * Math.PI);
              ctx.fill();
            }
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

      {/* Minimal Header - Volver + Counter */}
      <header className={`flex items-center justify-between px-4 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-3 sticky top-0 z-30 ${
        contrastMode 
          ? 'bg-black border-b border-yellow-400' 
          : 'bg-slate-900/95 border-b border-slate-800 backdrop-blur'
      }`}>
        <button
          id="back-btn"
          onClick={onBack}
          className={`flex items-center gap-1.5 font-display font-bold text-sm rounded-xl px-3 py-2.5 cursor-pointer transition-all active:scale-95 ${
            contrastMode
              ? 'text-yellow-400 border border-yellow-400/40'
              : 'text-amber-400 border border-amber-400/40 hover:bg-slate-800'
          }`}
          style={{ minHeight: '44px' }}
        >
          <ArrowLeft size={18} />
          <span>Volver</span>
        </button>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Reps</span>
          <span className="text-2xl font-black font-mono leading-none">
            <span className={reps > 0 ? 'text-emerald-400' : 'text-white'}>0{reps}</span>
            <span className="text-sm text-slate-500">/05</span>
          </span>
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
        <div className="flex-1 relative flex flex-col bg-black overflow-hidden">
          <div
            ref={cameraContainerRef}
            id="camera-visual-container"
            className="flex-1 relative bg-black overflow-hidden"
          >
            <div className="relative w-full h-full overflow-hidden">
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
                  transform: `scaleX(-1) scale(${zoomScale})`,
                  transformOrigin: 'center center',
                  transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
              />
              <canvas
                ref={canvasRef}
                className="absolute top-0 left-0 w-full h-full object-cover z-10 pointer-events-none"
                style={{
                  transform: `scaleX(-1) scale(${zoomScale})`,
                  transformOrigin: 'center center',
                  transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
              />

              <div className="absolute top-3 left-3 z-20 pointer-events-none">
                <div className={`rounded-full px-3 py-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider shadow-lg ${
                  isLimbDetected
                    ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-500/40'
                    : 'bg-red-950/90 text-red-400 border border-red-500/40'
                }`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${isLimbDetected ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'}}`} />
                  <span>{isLimbDetected ? 'Rastreo Activo' : 'Alineando'}</span>
                </div>
              </div>

              {/* Positioning hint when not detected — tells patient what to do */}
              {!isLimbDetected && practiceState === 'active' && (
                <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
                  <div className="bg-amber-950/90 border border-amber-500/50 rounded-xl px-4 py-2.5 text-center shadow-2xl backdrop-blur-md max-w-[280px]">
                    <p className="text-xs font-bold text-amber-300 leading-snug">
                      Acerque la cámara para ver su {currentEx.primaryJointName.toLowerCase()} con claridad
                    </p>
                  </div>
                </div>
              )}

              {practiceState === 'not_started' && (
                <div className="absolute inset-0 bg-slate-950/85 z-30 flex flex-col justify-center items-center p-4 text-center backdrop-blur-md">
                  {/* Visual position guide silhouette */}
                  <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none" viewBox="0 0 100 200" preserveAspectRatio="xMidYMid meet">
                    <circle cx="50" cy="25" r="10" fill="none" stroke="#10b981" strokeWidth="1.5" strokeDasharray="3 2" />
                    <line x1="50" y1="35" x2="50" y2="90" stroke="#10b981" strokeWidth="1.5" strokeDasharray="3 2" />
                    <line x1="50" y1="45" x2="30" y2="65" stroke="#10b981" strokeWidth="1.5" strokeDasharray="3 2" />
                    <line x1="50" y1="45" x2="70" y2="65" stroke="#10b981" strokeWidth="1.5" strokeDasharray="3 2" />
                    <line x1="30" y1="65" x2="25" y2="90" stroke="#10b981" strokeWidth="1.5" strokeDasharray="3 2" />
                    <line x1="70" y1="65" x2="75" y2="90" stroke="#10b981" strokeWidth="1.5" strokeDasharray="3 2" />
                    <line x1="50" y1="90" x2="40" y2="140" stroke="#10b981" strokeWidth="1.5" strokeDasharray="3 2" />
                    <line x1="50" y1="90" x2="60" y2="140" stroke="#10b981" strokeWidth="1.5" strokeDasharray="3 2" />
                    <line x1="40" y1="140" x2="38" y2="175" stroke="#10b981" strokeWidth="1.5" strokeDasharray="3 2" />
                    <line x1="60" y1="140" x2="62" y2="175" stroke="#10b981" strokeWidth="1.5" strokeDasharray="3 2" />
                  </svg>
                  <div className="bg-slate-900/95 border border-slate-700/90 rounded-2xl p-5 max-w-xs shadow-2xl flex flex-col items-center relative z-10">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-3 text-emerald-400">
                      <Camera size={24} />
                    </div>
                    <h3 className="font-display font-black text-base text-white leading-tight uppercase tracking-tight">
                      Preparar Alineacion
                    </h3>
                    <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                      {currentEx.positioningHint || 'Coloque el teléfono en una base estable y sitúese a una distancia donde se le observe por completo.'}
                    </p>

                    {/* Demo video player — shows correct movement before starting */}
                    {currentEx.demoVideo && (
                      <div className="mt-3 w-full">
                        {showDemoVideo ? (
                          <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-black">
                            <video
                              src={currentEx.demoVideo}
                              title={`Demostración: ${currentEx.title}`}
                              className="w-full h-auto max-h-[200px] object-contain"
                              autoPlay
                              loop
                              muted
                              playsInline
                              controls
                            />
                            <button
                              type="button"
                              onClick={() => setShowDemoVideo(false)}
                              className="absolute top-1.5 right-1.5 bg-slate-950/80 text-white text-[10px] font-bold px-2 py-1 rounded-lg border border-slate-700 cursor-pointer z-10"
                            >
                              Cerrar
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setShowDemoVideo(true)}
                            className="w-full flex items-center gap-2.5 py-2.5 px-3 bg-blue-950/60 border border-blue-500/40 rounded-xl text-blue-300 hover:bg-blue-900/40 transition-all cursor-pointer active:scale-95"
                          >
                            <PlayCircle size={20} className="shrink-0" />
                            <span className="text-xs font-bold text-left leading-tight">
                              Ver demostración del movimiento
                            </span>
                          </button>
                        )}
                      </div>
                    )}

                    <div className="mt-3 w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-left flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${isLimbDetected ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                        <span className="text-[10px] font-bold text-slate-300 uppercase font-mono">
                          {isLimbDetected ? 'Detectado' : 'Buscando...'}
                        </span>
                      </div>
                      <span className="text-[10px] text-yellow-400 font-bold font-mono">{currentAngle}</span>
                    </div>
                    <button
                      id="start-practice-btn"
                      type="button"
                      onClick={handleStartPractice}
                      className="mt-4 w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black font-display rounded-xl cursor-pointer shadow-lg transition-all active:scale-95 text-xs uppercase tracking-wider"
                      style={{ minHeight: '48px' }}
                    >
                      Comenzar Ejercicio
                    </button>
                    <div className="mt-2.5 flex items-center gap-1.5 text-[10px] text-slate-400 font-medium font-mono">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                      <span>O diga: <b className="text-blue-400">"Inicio"</b></span>
                    </div>
                  </div>
                </div>
              )}

              {practiceState === 'countdown' && (
                <div className="absolute inset-0 bg-slate-950/90 z-30 flex flex-col justify-center items-center p-6 text-center backdrop-blur-md">
                  <motion.div
                    key={countdownSeconds}
                    initial={{ scale: 0.3, opacity: 0 }}
                    animate={{ scale: [0.8, 1.25, 1], opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 0.95 }}
                    className="flex flex-col items-center justify-center"
                  >
                    <span className="text-8xl font-black text-amber-400 drop-shadow-[0_0_40px_rgba(245,158,11,0.5)] font-mono leading-none">
                      {countdownSeconds}
                    </span>
                    <span className="text-xs font-black font-display text-white tracking-widest uppercase mt-3 animate-pulse">
                      Preparese!
                    </span>
                  </motion.div>
                </div>
              )}
            </div>
          </div>

          <div className={`relative z-20 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] ${
            contrastMode ? 'bg-black border-t border-yellow-400' : 'bg-slate-900/95 border-t border-slate-800 backdrop-blur'
          }`}>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono shrink-0">Angulo</span>
              <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min((currentAngle / 180) * 100, 100)}%`,
                    background: isLimbDetected
                      ? 'linear-gradient(90deg, #3b82f6, #10b981)'
                      : '#475569'
                  }}
                />
              </div>
              <span className="text-sm font-black font-mono text-white shrink-0 w-12 text-right">{currentAngle}</span>
            </div>

            {speechTranscript && (
              <div className="mb-2.5 flex items-start gap-2">
                <Volume2 size={14} className="text-blue-400 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-300 leading-relaxed italic line-clamp-2">
                  "{speechTranscript}"
                </p>
              </div>
            )}

            <button
              id="finish-session-btn"
              onClick={() => onCompleteSession(reps, { angles: anglesHistoryRef.current })}
              className="w-full py-3.5 bg-red-600 hover:bg-red-500 active:scale-[0.98] transition-all rounded-xl font-bold text-sm tracking-wide text-white shadow-lg cursor-pointer"
              style={{ minHeight: '52px' }}
            >
              Finalizar Sesion
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
