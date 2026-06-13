/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

class VoiceService {
  private isEnabled: boolean = true;
  private volume: number = 0.8; // default to a safe 80% volume
  private voiceGender: 'female' | 'male' = 'female'; // default to friendly female assistant
  private exercisePace: 'lento' | 'normal' | 'rapido' = 'normal';
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private synth: SpeechSynthesis | null = null;
  private hasWarned: boolean = false;

  constructor() {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      this.synth = window.speechSynthesis;
    }
  }

  public setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    if (!enabled) {
      this.stop();
    }
  }

  public getIsEnabled(): boolean {
    return this.isEnabled;
  }

  public setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  public getVolume(): number {
    return this.volume;
  }

  public setVoiceGender(gender: 'female' | 'male') {
    this.voiceGender = gender;
  }

  public getVoiceGender(): 'female' | 'male' {
    return this.voiceGender;
  }

  public setExercisePace(pace: 'lento' | 'normal' | 'rapido') {
    this.exercisePace = pace;
  }

  public getExercisePace(): 'lento' | 'normal' | 'rapido' {
    return this.exercisePace;
  }

  public speak(text: string, force: boolean = false) {
    if (!this.isEnabled || !this.synth) return;

    // If force is true, interrupt current speaker
    if (force) {
      this.synth.cancel();
    } else if (this.synth.speaking) {
      // Avoid overlapping standard notifications
      return;
    }

    try {
      this.currentUtterance = new SpeechSynthesisUtterance(text);
      this.currentUtterance.lang = 'es-ES';
      
      let targetRate = 0.85;
      if (this.exercisePace === 'lento') {
        targetRate = 0.65; // Relaxed and easy to process for seniors
      } else if (this.exercisePace === 'rapido') {
        targetRate = 1.05; // Normal standard speech rate
      } else {
        targetRate = 0.82; // Slightly slower, highly comforting and clear medical pace
      }
      this.currentUtterance.rate = targetRate;
      
      this.currentUtterance.pitch = this.voiceGender === 'female' ? 1.05 : 0.85; // Pitch shift as high utility cue
      this.currentUtterance.volume = this.volume;

      const voices = this.synth.getVoices();
      const spanishVoices = voices.filter(
        (v) => v.lang.startsWith('es-') || v.lang.includes('Spanish') || v.lang.startsWith('es_')
      );

      let selectedVoice: SpeechSynthesisVoice | null = null;
      if (spanishVoices.length > 0) {
        if (this.voiceGender === 'female') {
          // Standard female Spanish voices (Microsoft Laura/Helena/Sabina, Google)
          selectedVoice = spanishVoices.find((v) => {
            const nameLower = v.name.toLowerCase();
            return (
              nameLower.includes('laura') ||
              nameLower.includes('helena') ||
              nameLower.includes('sabina') ||
              nameLower.includes('lucia') ||
              nameLower.includes('elena') ||
              nameLower.includes('monica') ||
              nameLower.includes('sofia') ||
              nameLower.includes('female') ||
              nameLower.includes('mujer')
            );
          }) || spanishVoices.find((v) => v.name.toLowerCase().includes('google')) || spanishVoices[0];
        } else {
          // Standard male Spanish voices (Microsoft Pablo/Julio, Google)
          selectedVoice = spanishVoices.find((v) => {
            const nameLower = v.name.toLowerCase();
            return (
              nameLower.includes('pablo') ||
              nameLower.includes('julio') ||
              nameLower.includes('miguel') ||
              nameLower.includes('alvaro') ||
              nameLower.includes('enrique') ||
              nameLower.includes('jose') ||
              nameLower.includes('javier') ||
              nameLower.includes('male') ||
              nameLower.includes('hombre') ||
              nameLower.includes('macho')
            );
          }) || spanishVoices.find((v) => !v.name.toLowerCase().includes('laura') && !v.name.toLowerCase().includes('helena')) || spanishVoices[0];
        }
      }

      if (selectedVoice) {
        this.currentUtterance.voice = selectedVoice;
      }

      this.synth.speak(this.currentUtterance);
    } catch (error) {
      if (!this.hasWarned) {
        console.warn('SpeechSynthesis failed to queue item:', error);
        this.hasWarned = true;
      }
    }
  }

  public stop() {
    if (this.synth) {
      this.synth.cancel();
    }
  }
}

export const voiceService = new VoiceService();
