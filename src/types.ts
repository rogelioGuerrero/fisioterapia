/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ExerciseType =
  | 'stroke_unilateral_rehab'
  | 'stroke_unilateral_leg_rehab'
  | 'stroke_bilateral_symmetry'
  | 'stroke_elbow_flexion'
  | 'stroke_shoulder_abduction'
  | 'stroke_trunk_lateral_lean';

export type ExercisePace = 'lento' | 'normal' | 'rapido';

// How the angle is measured from landmarks
export type MeasurementType = 'joint_angle' | 'trunk_lean';

// Body region for UI grouping
export type ExerciseCategory = 'upper_limb' | 'lower_limb' | 'trunk';

export interface ExerciseDefinition {
  id: ExerciseType;
  title: string;
  description: string;
  category: ExerciseCategory;
  measurementType: MeasurementType;
  targetJoints: string;
  instructions: string[];
  minAngle: number; // For 'high' direction: resting position. For 'low' direction: target position.
  maxAngle: number; // For 'high' direction: target position. For 'low' direction: resting position.
  triggerDirection: 'high' | 'low'; // high if extension increases angle, low if flexion decreases angle
  keypointsRequired: number[]; // Index of keypoints in MediaPipe Pose
  primaryJointName: string;
  benefitsExplanation?: string;
  demoVideo?: string; // Path to demo video in public/demos/
  positioningHint?: string; // How to position phone/camera for this exercise
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
