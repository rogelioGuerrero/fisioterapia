/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ExerciseType =
  | 'shoulder_abduction'
  | 'trunk_lateral_lean'
  | 'bilateral_arm_abduction'
  | 'assisted_shoulder_abduction'
  | 'seated_hip_abduction'
  | 'cervical_lateral_flexion';

export type ExercisePace = 'lento' | 'normal' | 'rapido';

// How the angle is measured from landmarks
export type MeasurementType = 'joint_angle' | 'lateral_lean';

// Body region for UI grouping
export type ExerciseCategory = 'upper_limb' | 'lower_limb' | 'trunk' | 'neck';

export interface ExerciseDefinition {
  id: ExerciseType;
  title: string;
  description: string;
  category: ExerciseCategory;
  measurementType: MeasurementType;
  targetJoints: string;
  instructions: string[];
  minAngle: number; // Resting position
  maxAngle: number; // Target position
  triggerDirection: 'high' | 'low';
  keypointsRequired: number[];
  primaryJointName: string;
  benefitsExplanation?: string;
  demoVideo?: string;
  positioningHint?: string;
}

export interface ExerciseSession {
  exerciseId: ExerciseType;
  repetitions: number;
  targetRepetitions: number;
  startTime: number;
  endTime?: number;
  anglesHistory: { timestamp: number; angle: number }[];
  feedbackCount: number;
  isCompleted: boolean;
}

export interface Landmark {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
}
