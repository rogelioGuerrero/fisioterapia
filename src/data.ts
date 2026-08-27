/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ExerciseDefinition } from './types';
import { EXERCISE_ANGLES } from './clinicalConstants';

export const EXERCISES: ExerciseDefinition[] = [
  {
    id: 'shoulder_abduction',
    title: 'Abducción de Hombro',
    description: 'Elevación lateral del brazo hacia el lado, alejándolo del cuerpo. Activa el deltoides medio y restablece la capacidad de alcanzar objetos a los lados.',
    category: 'upper_limb',
    measurementType: 'joint_angle',
    targetJoints: 'Hombro (Cadera → Hombro → Codo)',
    primaryJointName: 'Hombro',
    instructions: [
      'Siéntese erguido con la espalda recta y los pies apoyados en el piso.',
      'Mantenga el brazo a lo largo del cuerpo con la palma hacia adentro.',
      'Eleve lentamente el brazo hacia el lado, alejándolo del cuerpo.',
      'Suba hasta la altura del hombro o hasta donde se sienta cómodo.',
      'Mantenga un segundo la elevación sintiendo el trabajo del hombro.',
      'Baje el brazo con control suave y lento de regreso al lado del cuerpo.'
    ],
    minAngle: EXERCISE_ANGLES.shoulderAbduction.rest,
    maxAngle: EXERCISE_ANGLES.shoulderAbduction.target,
    triggerDirection: 'high',
    keypointsRequired: [11, 13],
    benefitsExplanation: 'La abducción del hombro activa el deltoides medio, músculo clave para levantar objetos a los lados y proteger la articulación.',
    demoVideo: '/demos/demo-ejercicio-1.mp4',
    positioningHint: 'Ponga el teléfono frente a usted sobre una mesa. Siéntese a 1 metro de distancia, de FRENTE a la cámara. La cámara debe ver su hombro y brazo completo.',
  },
  {
    id: 'assisted_shoulder_abduction',
    title: 'Abducción Asistida de Hombro',
    description: 'Ejercicio de rango de movimiento auto-asistido. El brazo sano ayuda a elevar el brazo afectado hacia el lado. Ideal para personas con debilidad o limitación en un lado.',
    category: 'upper_limb',
    measurementType: 'joint_angle',
    targetJoints: 'Hombro del Lado Afectado (Asistido)',
    primaryJointName: 'Hombro Afectado',
    instructions: [
      'Siéntese bien derecho, apoyando firmemente la espalda en la silla.',
      'Con la mano de su lado sano, sujete suavemente la muñeca de su lado afectado.',
      'Lentamente, use la fuerza de su lado sano para elevar ambos brazos hacia el LADO.',
      'Suba despacio hasta donde se sienta cómodo, sin sentir ningún dolor.',
      'Sostenga la elevación arriba un segundo para estirar con cuidado.',
      'Baje ambos brazos de regreso a su regazo de manera controlada y suave.'
    ],
    minAngle: EXERCISE_ANGLES.assistedShoulderAbduction.rest,
    maxAngle: EXERCISE_ANGLES.assistedShoulderAbduction.target,
    triggerDirection: 'high',
    keypointsRequired: [11, 13],
    benefitsExplanation: 'Este ejercicio de auto-asistencia estimula la plasticidad cerebral, evita que el hombro se vuelva rígido y doloroso, y facilita reconnectar los circuitos nerviosos de movimiento.',
    positioningHint: 'Ponga el teléfono frente a usted sobre una mesa. Siéntese a 1 metro de distancia, de FRENTE a la cámara. La cámara debe ver sus hombros y ambos brazos.',
  },
  {
    id: 'bilateral_arm_abduction',
    title: 'Abducción Bilateral de Brazos',
    description: 'Elevación lateral de ambos brazos simultáneamente hacia los lados, promoviendo la estimulación bilateral simétrica de la corteza cerebral.',
    category: 'upper_limb',
    measurementType: 'joint_angle',
    targetJoints: 'Hombros ➔ Codos de Ambos Lados',
    primaryJointName: 'Ambos Hombros',
    instructions: [
      'Siéntese erguido, con la mirada al frente y hombros relajados.',
      'Intente elevar ambos brazos hacia los LADOS al unísono de forma simétrica.',
      'Enfoque su mente en mover ambos lados al mismo ritmo y con la misma altura.',
      'Suba hasta la altura de los hombros o donde se sienta cómodo.',
      'Baje ambos brazos lentamente y al mismo tiempo en perfecta coordinación.'
    ],
    minAngle: EXERCISE_ANGLES.bilateralArmAbduction.rest,
    maxAngle: EXERCISE_ANGLES.bilateralArmAbduction.target,
    triggerDirection: 'high',
    keypointsRequired: [11, 12, 13, 14],
    benefitsExplanation: 'Mover ambos lados al unísono estimula de forma cruzada ambos hemisferios del cerebro. Esto favorece que el área motora sana auxilie en el re-entrenamiento del área afectada.',
    positioningHint: 'Ponga el teléfono frente a usted sobre una mesa. Siéntese a 1 metro de distancia, de FRENTE a la cámara. La cámara debe ver sus hombros y ambos brazos completos.',
  },
  {
    id: 'seated_hip_abduction',
    title: 'Abducción de Cadera Sentado',
    description: 'Apertura lateral de la rodilla alejándola de la línea media del cuerpo, manteniendo la cadera en la silla. Fortalece el glúteo medio, clave para la estabilidad de la marcha.',
    category: 'lower_limb',
    measurementType: 'lateral_lean',
    targetJoints: 'Cadera (Cadera → Rodilla, respecto a vertical)',
    primaryJointName: 'Cadera',
    instructions: [
      'Siéntese bien derecho en una silla con respaldo, con los pies apoyados en el piso.',
      'Mantenga las rodillas juntas al inicio, con las manos sobre los muslos.',
      'Aleje lentamente una rodilla hacia el lado, sin mover la cadera de la silla.',
      'Llegue hasta donde sienta que puede controlar el movimiento con seguridad.',
      'Regrese la rodilla al centro con movimiento suave y controlado.',
      'Luego repita con la otra pierna con la misma técnica.'
    ],
    minAngle: EXERCISE_ANGLES.seatedHipAbduction.rest,
    maxAngle: EXERCISE_ANGLES.seatedHipAbduction.target,
    triggerDirection: 'high',
    keypointsRequired: [23, 25, 24, 26],
    benefitsExplanation: 'La abducción de cadera fortalece el glúteo medio, músculo fundamental para la estabilidad lateral de la marcha y para evitar caídas.',
    positioningHint: 'Ponga el teléfono frente a usted sobre una mesa. Siéntese a 1 metro de distancia, de FRENTE a la cámara. La cámara debe ver desde su cintura hasta sus rodillas.',
  },
  {
    id: 'trunk_lateral_lean',
    title: 'Control de Tronco (Inclinación Lateral)',
    description: 'Ejercicio de inclinación controlada del tronco hacia los lados, fundamental para el equilibrio sentado, las transferencias y la marcha segura.',
    category: 'trunk',
    measurementType: 'lateral_lean',
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
    minAngle: EXERCISE_ANGLES.trunkLateralLean.rest,
    maxAngle: EXERCISE_ANGLES.trunkLateralLean.target,
    triggerDirection: 'high',
    keypointsRequired: [11, 12, 23, 24],
    benefitsExplanation: 'El control del tronco es el predictor más fuerte de recuperación funcional. Esta inclinación lateral entrena los oblicuos y mejora el equilibrio sentado, esencial para vestirse, transferirse y caminar de forma segura.',
    positioningHint: 'Ponga el teléfono frente a usted sobre una mesa. Siéntese a 1 metro de distancia, de FRENTE a la cámara. La cámara debe ver sus hombros y caderas completos.',
  },
  {
    id: 'cervical_lateral_flexion',
    title: 'Flexión Lateral de Cuello',
    description: 'Inclinación suave de la cabeza hacia el hombro, acercando la oreja al hombro. Relaja la espasticidad cervical y mejora el rango de movimiento del cuello.',
    category: 'neck',
    measurementType: 'lateral_lean',
    targetJoints: 'Columna Cervical',
    primaryJointName: 'Cuello',
    instructions: [
      'Siéntese bien derecho con la espalda recta y hombros relajados.',
      'Mire al frente, manteniendo la cabeza en posición neutra.',
      'Incline lentamente la cabeza hacia un lado, acercando la oreja al hombro.',
      'No levante el hombro hacia la oreja, manténgalo abajo.',
      'Llegue hasta donde sienta un estiramiento suave, sin dolor.',
      'Regrese la cabeza al centro con control y repita hacia el otro lado.'
    ],
    minAngle: EXERCISE_ANGLES.cervicalLateralFlexion.rest,
    maxAngle: EXERCISE_ANGLES.cervicalLateralFlexion.target,
    triggerDirection: 'high',
    keypointsRequired: [0, 11, 12],
    benefitsExplanation: 'La flexión lateral de cuello relaja la musculatura cervical tensa, mejora el rango de movimiento y reduce la rigidez. Es especialmente útil para pacientes con espasticidad cervical o tensión postural.',
    positioningHint: 'Ponga el teléfono frente a usted sobre una mesa. Siéntese a 60 cm de distancia, de FRENTE a la cámara. La cámara debe ver su cabeza y hombros completos.',
  }
];

export const AUDIO_PHRASES = {
  welcome: (title: string) => `Terapia de ${title}. Mire el video y comience cuando esté listo.`,
  calibration_help: 'Ponga el teléfono frente a usted, a un metro de distancia, hasta que se detecte su cuerpo.',
  calibrated: '¡Excelente! Empecemos con calma.',
  relaxed_prompt: 'Vuelva a la posición de descanso.',
  effort_prompt_shoulder: 'Suba el brazo un poco más, ¡excelente!',
  effort_prompt_abduction: 'Aleje el brazo hacia el lado, ¡excelente!',
  effort_prompt_trunk: 'Inclínese un poco más con control, ¡muy bien!',
  effort_prompt_hip: 'Abra la rodilla un poco más hacia el lado, ¡muy bien!',
  effort_prompt_neck: 'Incline la cabeza un poco más, ¡suave!',
  effort_prompt_bilateral: 'Suba ambos brazos un poco más, ¡excelente!',
  rep_count: (count: number) => `¡Muy bien! Repetición ${count}.`,
  final_celebration: '¡Felicidades! Sesión completada. Excelente trabajo hoy.'
};
