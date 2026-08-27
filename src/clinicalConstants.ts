/**
 * Constantes clínicas canónicas para rehabilitación post-AVC.
 *
 * Fuentes:
 *  - American Academy of Orthopedic Surgeons (AAOS), Normal ROM values.
 *    Supplementary Digital Content 1, PRSGO 2020.
 *    https://cdn-links.lww.com/permalink/prsgo/b/prsgo_8_6_2020_04_17_hendriks_gox-d-20-00155r2_sdc1.pdf
 *  - Serrezuela et al., Robotic-Assisted Rehabilitation for Post-Stroke Shoulder Pain,
 *    Sensors 2023, 23(19), 8239. MDPI.
 *    https://www.mdpi.com/1424-8220/23/19/8239
 *    Define: "functional shoulder" = active flexion >= 90°, abduction >= 75°.
 *  - Boone & Azen, Normal range of motion of joints in male subjects.
 *    JBJS 1979. Referencia clásica para goniometría.
 *  - Soucie et al., Range of motion measurements: reference values,
 *    Haemophilia 2011, 17(3). Wiley. Dataset NHANES I (n=674).
 *
 * Convención de ángulos: el ángulo se calcula entre tres landmarks de MediaPipe Pose
 * (a, b, c) donde b es el vértice articular. El ángulo es el interno en grados [0, 180].
 * Para ejercicios sentados, el ángulo cadera-rodilla-tobillo refleja la flexión de rodilla:
 *   ~90°  = pie en piso, rodilla flexionada (posición descanso)
 *   ~180° = pierna horizontal al frente, rodilla extendida (extensión completa)
 */

// ─── ROM normal según AAOS (grados) ──────────────────────────────────────────
export const ROM_AAOS = {
  // Extremidad superior
  shoulderFlexion: 180,     // AAOS: 180°
  shoulderExtension: 60,    // AAOS: 60°
  shoulderAbduction: 180,   // AAOS: 180°
  elbowFlexion: 150,        // AAOS: 150°
  elbowExtension: 0,        // AAOS: 0°
  // Extremidad inferior
  hipFlexion: 120,          // AAOS: 120°
  hipExtension: 20,         // AAOS: 20°
  kneeFlexion: 135,         // AAOS: 135°
  kneeExtension: 0,         // AAOS: 0° (pierna recta)
  ankleDorsiflexion: 20,    // AAOS: 20°
  anklePlantarflexion: 50,  // AAOS: 50°
} as const;

// ─── Umbrales funcionales post-AVC (grados) ──────────────────────────────────
// Serrezuela et al. (2023): clasificación de hombro funcional post-AVC.
export const STROKE_FUNCTIONAL_THRESHOLDS = {
  shoulderFlexionFunctional: 90,   // >= 90° flexión activa = "hombro funcional"
  shoulderAbductionFunctional: 75, // >= 75° abducción activa = "hombro funcional"
  shoulderFlexionNonFunctional: 60, // < 60° = "hombro no funcional"
} as const;

// ─── Ángulos de posición por ejercicio (grados) ──────────────────────────────
// Ángulos medidos entre landmarks MediaPipe.
// Todos los ejercicios funcionan de FRENTE a la cámara (plano frontal).
export const EXERCISE_ANGLES = {
  // Ejercicio 1: Abducción de Hombro (cadera→hombro→codo, plano frontal)
  // Posición descanso: brazo a los lados, ángulo ~10-20°.
  // Objetivo: 90° = abducción funcional.
  //   AAOS normal: 180° abducción. 90° es objetivo conservador.
  //   Serrezuela 2023: ≥75° abducción = "hombro funcional".
  shoulderAbduction: {
    rest: 20,
    target: 90,
  },
  // Ejercicio 2: Abducción Asistida de Hombro (cadera→hombro→codo, lado afectado)
  // Mismo ángulo que abducción pero el brazo sano asiste al afectado.
  // Útil para hemiparesia, post-quirúrgico, hombro congelado.
  assistedShoulderAbduction: {
    rest: 20,
    target: 90,
  },
  // Ejercicio 3: Abducción Bilateral de Brazos (cadera→hombro→codo, ambos lados)
  // Ambos brazos se elevan hacia los lados simultáneamente.
  // Estimulación bilateral simétrica de la corteza cerebral.
  bilateralArmAbduction: {
    rest: 20,
    target: 90,
  },
  // Ejercicio 4: Abducción de Cadera Sentado (ángulo cadera→rodilla vs vertical)
  // Medición: ángulo del vector cadera→rodilla respecto a vertical.
  // Posición descanso: rodillas juntas, ángulo ~0-5°.
  // Objetivo: 30° = abducción funcional sentado.
  //   AAOS normal: 40° abducción de cadera. 30° es objetivo conservador.
  //   Fortalece gluteo medio, clave para estabilidad de marcha.
  seatedHipAbduction: {
    rest: 5,
    target: 30,
  },
  // Ejercicio 5: Inclinación Lateral de Tronco (hombros vs caderas, respecto a vertical)
  // Medición: ángulo del vector cadera-centro → hombro-centro respecto a vertical.
  // Posición descanso: tronco erguido, ángulo ~0-3°. Umbral 5° da margen.
  // Objetivo: 12° = inclinación controlada funcional.
  //   Van Criekinge 2019 (meta-análisis 22 RCTs): trunk training SMD 1.08.
  //   Karthikbabu 2011: inclinación lateral 8-15° es rango terapéutico.
  trunkLateralLean: {
    rest: 5,
    target: 12,
  },
  // Ejercicio 6: Flexión Lateral de Cuello (hombros vs nariz, respecto a vertical)
  // Medición: ángulo del vector hombro-centro → nariz respecto a vertical.
  // Posición descanso: cabeza erguida, ángulo ~0-3°. Umbral 5° da margen.
  // Objetivo: 35° = flexión lateral funcional.
  //   AAOS normal: 45° flexión lateral de cuello. 35° es objetivo conservador.
  //   Relaja espasticidad cervical, mejora ROM cervical.
  cervicalLateralFlexion: {
    rest: 5,
    target: 35,
  },
} as const;

// ─── Umbrales de visibilidad de landmarks (MediaPipe Pose) ───────────────────
// Valores empíricos del modelo pose_landmarker_lite. No son valores clínicos.
export const VISIBILITY_THRESHOLDS = {
  strict: 0.5,        // Detección confiable estándar
  normal: 0.4,        // Detección normal (default)
  relaxed: 0.35,      // Detección relajada (focused rehab: lado sano visible)
  permissive: 0.25,   // Detección permisiva (focused rehab: lado afectado)
  fallback: 0.2,      // Umbral mínimo para mirror de lado sano
} as const;

// ─── Tiempos de seguridad (ms) ───────────────────────────────────────────────
// Debounce para evitar doble conteo de repeticiones por jitter de landmarks.
export const SAFETY_LOCKOUT_MS: { lento: number; normal: number; rapido: number } = {
  lento: 4000,    // Pacientes lentos: 4s entre reps
  normal: 2500,   // Pace normal: 2.5s entre reps
  rapido: 1700,   // Pace rápido: 1.7s entre reps
};

// Tiempo antes de emitir prompt de esfuerzo (ms)
export const EFFORT_PROMPT_DELAY_MS = 3000;

// Márgenes de zona intermedia para detección de esfuerzo estancado (grados)
export const INTERMEDIATE_ZONE_MARGIN = {
  aboveMin: 6,   // minGoal + 6° = inicio de zona de esfuerzo
  belowMax: 5,   // maxGoal - 5° = fin de zona de esfuerzo
} as const;

// ─── Parámetros de sesión ────────────────────────────────────────────────────
export const SESSION_PARAMS = {
  targetRepetitions: 5,        // 5 reps: protocolo conservador post-AVC
  countdownSeconds: 3,         // Cuenta regresiva estándar
  completionHoldMs: 6000,      // Pausa antes de transición a reporte
  speechDelayWelcomeMs: 4000,  // Delay entre welcome y benefits
  speechDelayInstructionsMs: 16000, // Delay hasta leer instrucciones
  speechDelayCalibrationMs: 32000,  // Delay hasta prompt de calibración
} as const;

// ─── Vibración háptica (ms) ──────────────────────────────────────────────────
export const HAPTIC_PATTERNS: { repCompleted: number; sessionCompleted: number[] } = {
  repCompleted: 150,
  sessionCompleted: [200, 100, 200, 100, 400], // Patrón de celebración
};

// ─── Cámara ──────────────────────────────────────────────────────────────────
export const CAMERA_CONFIG = {
  facingMode: 'user' as const,
  width: 640,
  height: 480,
  frameRate: 30,
} as const;
