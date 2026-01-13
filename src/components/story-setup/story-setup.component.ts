import { Component, inject, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GeminiService, GeneratedStory } from '../../services/gemini.service';

@Component({
  selector: 'app-story-setup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 border-4 border-purple-200">
      <div class="text-center mb-6">
        <h2 class="text-3xl font-bold text-purple-600 mb-2">Bir Hikaye Yarat!</h2>
        <p class="text-gray-500">Ne okumak istediğinden biraz bahset.</p>
      </div>

      <div class="space-y-6">
        <div>
          <label class="block text-gray-700 font-bold mb-2">Çocuğun Adı</label>
          <input 
            type="text" 
            [ngModel]="name()" 
            (ngModelChange)="name.set($event)"
            placeholder="örn. Ayşe"
            class="w-full px-4 py-3 rounded-xl border-2 border-purple-100 focus:border-purple-400 focus:outline-none transition-colors bg-purple-50 text-gray-900 placeholder-gray-400 text-lg"
          >
        </div>

        <div>
          <label class="block text-gray-700 font-bold mb-2">Hikaye Konusu</label>
          <input 
            type="text" 
            [ngModel]="topic()"
            (ngModelChange)="topic.set($event)" 
            placeholder="örn. Bir kediyle uzay macerası"
            class="w-full px-4 py-3 rounded-xl border-2 border-purple-100 focus:border-purple-400 focus:outline-none transition-colors bg-purple-50 text-gray-900 placeholder-gray-400 text-lg"
          >
          <!-- Example Topics -->
          <div class="mt-3 flex flex-wrap gap-2">
            <span class="text-xs text-gray-400 font-bold w-full uppercase tracking-wider">Şunları dene:</span>
            @for (ex of exampleTopics; track ex) {
              <button 
                (click)="topic.set(ex)"
                class="px-3 py-1.5 text-sm bg-purple-50 hover:bg-purple-100 text-purple-600 border border-purple-200 rounded-lg transition-colors text-left"
                type="button">
                {{ ex }}
              </button>
            }
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-gray-700 font-bold mb-2">Yaş</label>
            <input 
              type="number" 
              [ngModel]="age()"
              (ngModelChange)="age.set($event)" 
              min="2" max="12"
              class="w-full px-4 py-3 rounded-xl border-2 border-purple-100 focus:border-purple-400 focus:outline-none transition-colors bg-purple-50 text-gray-900 text-lg"
            >
          </div>
           <div>
            <label class="block text-gray-700 font-bold mb-2">Resim Kalitesi</label>
            <select 
              [ngModel]="quality()"
              (ngModelChange)="quality.set($event)"
              class="w-full px-4 py-3 rounded-xl border-2 border-purple-100 focus:border-purple-400 focus:outline-none transition-colors bg-purple-50 text-gray-900 text-lg appearance-none"
            >
              <option value="1K">1K (Hızlı)</option>
              <option value="2K">2K (Net)</option>
              <option value="4K">4K (Süper)</option>
            </select>
          </div>
        </div>

        <button 
          (click)="generate()" 
          [disabled]="isLoading() || !name() || !topic()"
          class="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold text-xl shadow-lg transform transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-xl flex justify-center items-center gap-2"
        >
          @if (isLoading()) {
            <svg class="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Sihir Yapılıyor...
          } @else {
            ✨ Sihir Yap!
          }
        </button>
      </div>
    </div>
  `
})
export class StorySetupComponent {
  name = signal('');
  topic = signal('');
  age = signal(5);
  quality = signal('1K');
  isLoading = signal(false);

  exampleTopics = [
    "🦖 Dondurma seven bir dinozor",
    "🚀 Yavru köpeğin aya ilk yolculuğu",
    "🧚‍♀️ Değneğini kaybeden peri",
    "🦁 Dans etmek isteyen aslan",
    "🤖 Bir robotun en iyi arkadaşı",
    "🏰 Gizli şeker şatosu",
    "🐢 Uçmayı öğrenen kaplumbağa",
    "🐙 Okyanusun dibindeki parti",
    "🌈 Renklerini kaybeden gökkuşağı",
    "🦄 Ormanda kaybolan bebek tek boynuz",
    "🦸‍♂️ Sebze sevmeyen süper kahraman",
    "🧸 Canlanan oyuncak ayı",
    "🏴‍☠️ Diş fırçalamayı sevmeyen korsan"
  ];

  storyGenerated = output<{story: GeneratedStory, quality: string}>();

  private gemini = inject(GeminiService);

  async generate() {
    if (this.isLoading()) return;
    this.isLoading.set(true);

    try {
      const story = await this.gemini.generateStory(this.topic(), this.name(), this.age());
      this.storyGenerated.emit({ story, quality: this.quality() });
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Bir hata oluştu. Tekrar dene!');
    } finally {
      this.isLoading.set(false);
    }
  }
}