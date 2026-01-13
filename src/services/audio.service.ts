import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AudioService {
  isSpeaking = signal(false);
  private synth = window.speechSynthesis;
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  speak(text: string) {
    this.cancel(); // Stop any current speech

    this.currentUtterance = new SpeechSynthesisUtterance(text);
    
    // Attempt to pick a pleasant voice, prioritizing Turkish
    const voices = this.synth.getVoices();
    const preferredVoice = voices.find(v => v.lang.includes('tr')) || 
                           voices.find(v => v.name.includes('Turkish')) || 
                           voices[0];
    
    if (preferredVoice) {
      this.currentUtterance.voice = preferredVoice;
    }

    this.currentUtterance.rate = 0.9; // Slightly slower for kids
    this.currentUtterance.pitch = 1.1; // Slightly higher pitch

    this.currentUtterance.onstart = () => this.isSpeaking.set(true);
    this.currentUtterance.onend = () => this.isSpeaking.set(false);
    this.currentUtterance.onerror = () => this.isSpeaking.set(false);

    this.synth.speak(this.currentUtterance);
  }

  cancel() {
    if (this.synth.speaking) {
      this.synth.cancel();
    }
    this.isSpeaking.set(false);
  }
}