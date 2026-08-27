/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/// <reference types="vite-plugin-pwa/client" />

declare module 'https://*' {
  const value: any;
  export default value;
  export const FilesetResolver: any;
  export const PoseLandmarker: any;
  export const pipeline: any;
}
