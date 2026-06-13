/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ExerciseDefinition } from './types';

export const EXERCISES: ExerciseDefinition[] = [
  {
    id: 'stroke_unilateral_rehab',
    title: 'Movilidad Asistida de Brazo',
    description: 'Ejercicio de rango de movimiento auto-asistido para hombro y brazo. Ideal para personas con debilidad o parálisis en un lado del cuerpo (hemiplejia). El brazo sano asiste y eleva suavemente el brazo afectado.',
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
    minAngle: 25, // Starting position resting down
    maxAngle: 90,  // Target horizontal/diagonal elevation
    triggerDirection: 'high',
    keypointsRequired: [11, 13], // Left or Right depending on configuration
    benefitsExplanation: 'Este ejercicio de auto-asistencia (rango de movimiento pasivo-asistivo) estimula la plasticidad cerebral, evita que el hombro afectado se vuelva rígido y doloroso, y facilita volver a conectar los circuitos nerviosos de movimiento.'
  },
  {
    id: 'stroke_unilateral_leg_rehab',
    title: 'Re-educación de Pierna Afectada',
    description: 'Extensión de rodilla del lado afectado para reactivar las fibras musculares cuádriceps de la marcha y combatir la espasticidad.',
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
    minAngle: 110,
    maxAngle: 145,
    triggerDirection: 'high',
    keypointsRequired: [23, 25, 27],
    benefitsExplanation: 'La re-educación de la pierna fomenta el control voluntario del cuádriceps afectado. Ayuda a recuperar la fuerza necesaria para pararse de forma segura, mejora el equilibrio de apoyo y previene la rigidez flexora de la rodilla.'
  },
  {
    id: 'stroke_bilateral_symmetry',
    title: 'Sincronía Simétrica de Brazos',
    description: 'Ejercicio de elevación frontal paralela de ambos brazos simultáneos, promoviendo la estimulación bilateral simétrica de la corteza cerebral.',
    targetJoints: 'Hombros ➔ Codos de Ambos Lados',
    primaryJointName: 'Ambos Hombros',
    instructions: [
      'Párese o siéntese erguido, con la mirada al frente y hombros relajados.',
      'Intente elevar ambos brazos hacia adelante al unísono de forma simétrica.',
      'Enfoque su mente en mover ambos lados al mismo ritmo y con la misma altura.',
      'Suba hasta la altura de los hombros o donde se sienta cómodo.',
      'Baje ambos brazos lentamente y al mismo tiempo en perfecta coordinación.'
    ],
    minAngle: 35,
    maxAngle: 90,
    triggerDirection: 'high',
    keypointsRequired: [11, 12, 13, 14],
    benefitsExplanation: 'Mover ambos lados al unísono estimula de forma cruzada ambos hemisferios del cerebro. Esto favorece que el área motora sana auxilie en el re-entrenamiento del área afectada mediante neuronas espejo.'
  }
];

export const AUDIO_PHRASES = {
  welcome: (title: string) => `Bienvenido a su terapia de ${title}. Tómese su tiempo, realizaremos los movimientos suavemente y a su propio paso.`,
  calibration_help: 'Por favor, colóquese de manera que la cámara pueda ver su torso y sus brazos con claridad.',
  calibrated: '¡Excelente! Posición identificada. Empecemos a movernos con calma.',
  relaxed_prompt: 'Regrese suavemente a la posición de descanso para iniciar la siguiente.',
  effort_prompt_knee: 'Intente extender la pierna afectada un poco más hacia el frente, ¡excelente intento!',
  effort_prompt_shoulder: 'Intente elevar el brazo un poco más arriba si le es posible, ¡vamos excelente!',
  rep_count: (count: number) => `¡Muy bien logrado! Lleva ${count} repeticiones.`,
  final_celebration: '¡Felicidades! Ha completado su sesión de rehabilitación de hoy de forma muy segura. Excelente esfuerzo y constancia.'
};
