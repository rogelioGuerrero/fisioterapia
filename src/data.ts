/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ExerciseDefinition } from './types';
import { EXERCISE_ANGLES, STROKE_FUNCTIONAL_THRESHOLDS } from './clinicalConstants';

export const EXERCISES: ExerciseDefinition[] = [
  {
    id: 'stroke_unilateral_rehab',
    title: 'Movilidad Asistida de Brazo',
    description: 'Ejercicio de rango de movimiento auto-asistido para hombro y brazo. Ideal para personas con debilidad o parálisis en un lado del cuerpo (hemiplejia). El brazo sano asiste y eleva suavemente el brazo afectado.',
    category: 'upper_limb',
    measurementType: 'joint_angle',
    targetJoints: 'Hombro del Lado Afectado (Asistido)',
    primaryJointName: 'Lado Afectado',
    instructions: [
      'Siéntese bien derecho, apoyando firmemente la espalda en la silla.',
      'Con la mano de su lado sano, sujete suavemente la muñeca de su lado afectado.',
      'Lentamente, use la fuerza de su lado sano para elevar ambos brazos hacia el frente.',
      'Suba despacio hasta donde se sienta cómodo, sin sentir ningún dolor.',
      'Sostenga la elevación arriba un segundo para estirar los tendones con cuidado.',
      'Baje ambos brazos de regreso a su regazo de manera controlada y suave.'
    ],
    // Ángulo cadera→hombro→codo. Rest=25° (brazo en regazo). Target=90° (flexión funcional).
    // Fuente: Serrezuela et al. 2023 — "functional shoulder" = flexión activa >= 90°.
    // ROM normal AAOS: 180° flexión. 90° es objetivo conservador post-AVC.
    minAngle: EXERCISE_ANGLES.shoulderAssisted.rest,
    maxAngle: EXERCISE_ANGLES.shoulderAssisted.target,
    triggerDirection: 'high',
    keypointsRequired: [11, 13], // Left or Right depending on configuration
    benefitsExplanation: 'Este ejercicio de auto-asistencia (rango de movimiento pasivo-asistivo) estimula la plasticidad cerebral, evita que el hombro afectado se vuelva rígido y doloroso, y facilita volver a conectar los circuitos nerviosos de movimiento.'
  },
  {
    id: 'stroke_unilateral_leg_rehab',
    title: 'Re-educación de Pierna Afectada',
    description: 'Extensión de rodilla del lado afectado para reactivar las fibras musculares cuádriceps de la marcha y combatir la espasticidad.',
    category: 'lower_limb',
    measurementType: 'joint_angle',
    targetJoints: 'Cadera ➔ Rodilla ➔ Tobillo del Lado Seleccionado',
    primaryJointName: 'Rodilla Afectada',
    instructions: [
      'Siéntese bien derecho en una silla estable con respaldo apoyo.',
      'Sujete el borde del asiento con su mano del lado sano para estabilizarse.',
      'Eleve lentamente el pie de su pierna afectada hacia adelante intentando estirar la rodilla.',
      'Si tiene dificultad, intente la intención del movimiento o asista con el talón sano.',
      'Mantenga extendida la pierna brevemente sintiendo la activación muscular.',
      'Regrese el pie suavemente al piso con el mayor control posible.'
    ],
    // Ángulo cadera→rodilla→tobillo. Rest=95° (sentado, pie en piso, rodilla ~90° flexionada).
    // Target=160° (extensión casi completa). ROM normal AAOS: 0°-135° flexión.
    // 160° en landmarks = ~20° de flexión residual = extensión funcional segura post-AVC.
    // Corrección: minAngle era 110° (anatómicamente incorrecto para posición sentado).
    minAngle: EXERCISE_ANGLES.kneeExtension.rest,
    maxAngle: EXERCISE_ANGLES.kneeExtension.target,
    triggerDirection: 'high',
    keypointsRequired: [23, 25, 27],
    benefitsExplanation: 'La re-educación de la pierna fomenta el control voluntario del cuádriceps afectado. Ayuda a recuperar la fuerza necesaria para pararse de forma segura, mejora el equilibrio de apoyo y previene la rigidez flexora de la rodilla.'
  },
  {
    id: 'stroke_bilateral_symmetry',
    title: 'Sincronía Simétrica de Brazos',
    description: 'Ejercicio de elevación frontal paralela de ambos brazos simultáneos, promoviendo la estimulación bilateral simétrica de la corteza cerebral.',
    category: 'upper_limb',
    measurementType: 'joint_angle',
    targetJoints: 'Hombros ➔ Codos de Ambos Lados',
    primaryJointName: 'Ambos Hombros',
    instructions: [
      'Párese o siéntese erguido, con la mirada al frente y hombros relajados.',
      'Intente elevar ambos brazos hacia adelante al unísono de forma simétrica.',
      'Enfoque su mente en mover ambos lados al mismo ritmo y con la misma altura.',
      'Suba hasta la altura de los hombros o donde se sienta cómodo.',
      'Baje ambos brazos lentamente y al mismo tiempo en perfecta coordinación.'
    ],
    // Ángulo cadera→hombro→codo (ambos lados). Rest=25° (brazos a los lados).
    // Target=90° (flexión bilateral funcional). Fuente: Serrezuela 2023.
    // ROM normal AAOS: 180° flexión. 90° es objetivo terapéutico post-AVC.
    minAngle: EXERCISE_ANGLES.bilateralSymmetry.rest,
    maxAngle: EXERCISE_ANGLES.bilateralSymmetry.target,
    triggerDirection: 'high',
    keypointsRequired: [11, 12, 13, 14],
    benefitsExplanation: 'Mover ambos lados al unísono estimula de forma cruzada ambos hemisferios del cerebro. Esto favorece que el área motora sana auxilie en el re-entrenamiento del área afectada mediante neuronas espejo.'
  },
  {
    id: 'stroke_elbow_flexion',
    title: 'Flexión de Codo (Curl)',
    description: 'Ejercicio de flexión y extensión de codo para recuperar la capacidad de llevar objetos hacia el rostro, alimentarse y realizar higiene personal de forma autónoma.',
    category: 'upper_limb',
    measurementType: 'joint_angle',
    targetJoints: 'Codo del Lado Afectado (Hombro → Codo → Muñeca)',
    primaryJointName: 'Codo Afectado',
    instructions: [
      'Siéntese bien derecho con la espalda apoyada en el respaldo de la silla.',
      'Apoye el brazo afectado sobre su regazo o sobre la mesa, con la palma hacia arriba.',
      'Doble lentamente el codo intentando llevar la mano hacia su hombro.',
      'Suba hasta donde le sea cómodo, sintiendo la activación del músculo del brazo.',
      'Mantenga un segundo la posición flexionada con control.',
      'Extienda el brazo suavemente de regreso a la posición inicial.'
    ],
    // Ángulo hombro→codo→muñeca. triggerDirection: 'low' (el ángulo disminuye al flexionar).
    // minAngle=50° (objetivo = flexión funcional). maxAngle=160° (descanso = brazo extendido).
    // AAOS normal: 150° flexión de codo (~30° ángulo interno). 50° deja margen post-AVC.
    // Funcional para alimentación, afeitado, higiene facial.
    minAngle: EXERCISE_ANGLES.elbowFlexion.target,
    maxAngle: EXERCISE_ANGLES.elbowFlexion.rest,
    triggerDirection: 'low',
    keypointsRequired: [11, 13, 15], // shoulder, elbow, wrist (left or right)
    benefitsExplanation: 'La flexión de codo es fundamental para las actividades de la vida diaria: llevar comida a la boca, cepillarse los dientes, afeitarse. Entrenar este movimiento reactiva el bíceps y mejora la coordinación mano-boca tras un accidente cerebrovascular.'
  },
  {
    id: 'stroke_shoulder_abduction',
    title: 'Abducción de Hombro (Elevación Lateral)',
    description: 'Elevación lateral del brazo hacia el lado, alejándolo del cuerpo. Activa el deltoides medio y restablece la capacidad de alcanzar objetos a los lados.',
    category: 'upper_limb',
    measurementType: 'joint_angle',
    targetJoints: 'Hombro del Lado Afectado (Cadera → Hombro → Codo)',
    primaryJointName: 'Hombro Afectado',
    instructions: [
      'Siéntese erguido con la espalda recta y los pies apoyados en el piso.',
      'Mantenga el brazo afectado a lo largo del cuerpo con la palma hacia adentro.',
      'Eleve lentamente el brazo hacia el lado, alejándolo del cuerpo.',
      'Suba hasta la altura del hombro o hasta donde se sienta cómodo.',
      'Mantenga un segundo la elevación sintiendo el trabajo del hombro.',
      'Baje el brazo con control suave y lento de regreso al lado del cuerpo.'
    ],
    // Ángulo cadera→hombro→codo (plano frontal). Rest=20° (brazo a los lados).
    // Target=90° (abducción funcional). Serrezuela 2023: ≥75° abducción = "functional shoulder".
    // AAOS normal: 180° abducción. 90° es objetivo conservador post-AVC.
    // Cámara frontal captura este plano de movimiento de forma óptima.
    minAngle: EXERCISE_ANGLES.shoulderAbduction.rest,
    maxAngle: EXERCISE_ANGLES.shoulderAbduction.target,
    triggerDirection: 'high',
    keypointsRequired: [11, 13], // hip, shoulder, elbow (left or right)
    benefitsExplanation: 'La abducción del hombro activa el deltoides medio, músculo clave para levantar objetos a los lados y proteger la articulación. Junto con la flexión, define un "hombro funcional" según los criterios clínicos post-AVC.'
  },
  {
    id: 'stroke_trunk_lateral_lean',
    title: 'Control de Tronco (Inclinación Lateral)',
    description: 'Ejercicio de inclinación controlada del tronco hacia los lados, fundamental para el equilibrio sentado, las transferencias y la marcha segura post-AVC.',
    category: 'trunk',
    measurementType: 'trunk_lean',
    targetJoints: 'Columna Torácica y Lumbar',
    primaryJointName: 'Tronco',
    instructions: [
      'Siéntese bien derecho en una silla con respaldo, con los pies apoyados en el piso.',
      'Mantenga los brazos relajados a los lados o cruzados sobre el regazo.',
      'Inclínese lentamente hacia un lado manteniendo la espalda recta, sin encorvarse.',
      'Llegue hasta donde sienta que puede controlar el movimiento con seguridad.',
      'Regrese al centro con movimiento suave y controlado, usando los músculos del abdomen.',
      'Luego inclínese hacia el otro lado con la misma técnica y regrese al centro.'
    ],
    // Ángulo de inclinación del tronco (vector cadera-centro → hombro-centro vs vertical).
    // Rest=5° (tronco erguido). Target=12° (inclinación controlada funcional).
    // Van Criekinge 2019 (meta-análisis 22 RCTs): trunk training SMD 1.08.
    // Karthikbabu 2011: inclinación lateral 8-15° es rango terapéutico post-AVC.
    minAngle: EXERCISE_ANGLES.trunkLateralLean.rest,
    maxAngle: EXERCISE_ANGLES.trunkLateralLean.target,
    triggerDirection: 'high',
    keypointsRequired: [11, 12, 23, 24], // shoulders + hips
    benefitsExplanation: 'El control del tronco es el predictor más fuerte de recuperación funcional tras un AVC. Sin control de tronco, no hay control de extremidades. Esta inclinación lateral entrena los oblicuos y mejora el equilibrio sentado, esencial para vestirse, transferirse y caminar de forma segura.'
  }
];

export const AUDIO_PHRASES = {
  welcome: (title: string) => `Terapia de ${title}. Mire el video y comience cuando esté listo.`,
  calibration_help: 'Acérquese a la cámara para ver su cuerpo completo.',
  calibrated: '¡Excelente! Empecemos con calma.',
  relaxed_prompt: 'Vuelva a la posición de descanso.',
  effort_prompt_knee: 'Estire la pierna un poco más, ¡muy bien!',
  effort_prompt_shoulder: 'Suba el brazo un poco más, ¡excelente!',
  effort_prompt_elbow: 'Doble el codo un poco más, ¡buen esfuerzo!',
  effort_prompt_abduction: 'Aleje el brazo hacia el lado, ¡excelente!',
  effort_prompt_trunk: 'Inclínese un poco más con control, ¡muy bien!',
  rep_count: (count: number) => `¡Muy bien! Repetición ${count}.`,
  final_celebration: '¡Felicidades! Sesión completada. Excelente trabajo hoy.'
};
