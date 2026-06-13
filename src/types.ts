/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ExerciseType = 
  | 'stroke_unilateral_rehab'
  | 'stroke_unilateral_leg_rehab'
  | 'stroke_bilateral_symmetry';

export type ExercisePace = 'lento' | 'normal' | 'rapido';

export interface ExerciseDefinition {
  id: ExerciseType;
  title: string;
  description: string;
  targetJoints: string;
  instructions: string[];
  minAngle: number; // Starting position (e.g., knee bent at 90°, or shoulder at 20°)
  maxAngle: number; // Target extension position (e.g., knee straight at >160°, shoulder high at >140°)
  triggerDirection: 'high' | 'low'; // high if extension increases angle, low if it decreases
  keypointsRequired: number[]; // Index of keypoints in MediaPipe Pose
  primaryJointName: string;
  benefitsExplanation?: string;
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
