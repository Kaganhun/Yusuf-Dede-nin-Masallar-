import { Component, computed, inject, input, OnInit, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GeneratedStory, GeminiService } from '../../services/gemini.service';
import { AudioService } from '../../services/audio.service';

@Component({
  selector: 'app-story-viewer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="w-full flex flex-col items-center gap-6 animate-fade-in">
      <h2 class="text-3xl md:text-5xl font-bold text-purple-700 text-center drop-shadow-sm transition-all duration-500">
        {{ story().title }}
      </h2>
      
      <!-- Book Container -->
      <div class="w-full flex flex-col md:flex-row bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-white max-w-5xl h-[600px] transition-all duration-500">
        
        <!-- Image Side (Left) -->
        <div class="w-full md:w-1/2 bg-gray-100 flex items-center justify-center relative overflow-hidden group">
          
          @if (currentImage()) {
            <!-- Using @for with a single item array tracking the URL ensures the animation replays when the image changes -->
            @for (img of [currentImage()]; track img) {
              <img 
                [src]="img" 
                class="w-full h-full object-cover animate-scale-in" 
                alt="Hikaye resmi"
              >
            }
          } @else {
            <div class="flex flex-col items-center justify-center text-gray-400 p-8 text-center animate-fade-in">
              <svg class="animate-spin h-12 w-12 text-purple-400 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p class="animate-pulse font-bold text-purple-400">Sihirli resim çiziliyor...</p>
            </div>
          }
        </div>

        <!-- Text Side (Right) -->
        <div class="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-between bg-white relative">
          
          <!-- Text Area with Animation -->
          <div class="prose prose-xl relative">
             <!-- Tracking the page index forces the text container to re-render and play the animation -->
             @for (page of [currentPageIndex()]; track page) {
               <div class="animate-slide-up">
                 <p class="text-2xl md:text-3xl leading-relaxed text-gray-800 font-medium">
                   {{ currentText() }}
                 </p>
               </div>
             }
          </div>

          <div class="flex flex-col sm:flex-row justify-between items-center mt-8 gap-4">
            <button 
              (click)="toggleSpeech()"
              class="flex items-center gap-2 px-6 py-3 rounded-full bg-blue-100 text-blue-600 font-bold hover:bg-blue-200 transition-all hover:scale-105 active:scale-95 shadow-sm"
              [class.animate-pulse]="audio.isSpeaking()"
              [class.ring-4]="audio.isSpeaking()"
              [class.ring-blue-200]="audio.isSpeaking()"
              title="Sesli oku">
              @if (audio.isSpeaking()) {
                <span class="text-2xl">🔇</span>
                <span>Durdur</span>
              } @else {
                <span class="text-2xl">🔊</span>
                <span>Sesli Oku</span>
              }
            </button>

            <div class="flex gap-4">
              <button 
                (click)="prevPage()" 
                [disabled]="currentPageIndex() === 0"
                class="px-6 py-3 rounded-xl bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95">
                Geri
              </button>
              
              <button 
                (click)="nextPage()"
                [disabled]="currentPageIndex() === story().pages.length - 1"
                class="px-6 py-3 rounded-xl bg-purple-500 text-white font-bold hover:bg-purple-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg active:scale-95">
                İleri
              </button>
            </div>
          </div>
          
          <div class="absolute bottom-2 right-4 text-sm text-gray-300 font-bold">
            Sayfa {{ currentPageIndex() + 1 }} / {{ story().pages.length }}
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(30px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    @keyframes scaleIn {
      from { opacity: 0; transform: scale(1.05); filter: blur(10px); }
      to { opacity: 1; transform: scale(1); filter: blur(0); }
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .animate-slide-up {
      animation: slideUp 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
    }

    .animate-scale-in {
      animation: scaleIn 1.2s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
    }

    .animate-fade-in {
      animation: fadeIn 0.5s ease-out forwards;
    }
  `]
})
export class StoryViewerComponent implements OnInit {
  story = input.required<GeneratedStory>();
  imageQuality = input.required<string>();
  
  currentPageIndex = signal(0);
  currentImage = signal<string | null>(null);
  
  private imageCache = new Map<number, string>();

  gemini = inject(GeminiService);
  audio = inject(AudioService);

  currentText = computed(() => this.story().pages[this.currentPageIndex()].text);
  currentPrompt = computed(() => this.story().pages[this.currentPageIndex()].imagePrompt);

  constructor() {
    effect(() => {
      this.loadPageImage();
      this.audio.cancel();
    });
  }

  ngOnInit() {
    this.loadPageImage();
  }

  async loadPageImage() {
    const idx = this.currentPageIndex();
    
    if (this.imageCache.has(idx)) {
      this.currentImage.set(this.imageCache.get(idx)!);
      return;
    }

    this.currentImage.set(null); 
    
    try {
      // Create a consistent prompt by combining the character description with the page action
      const charDesc = this.story().characterDescription || 'A cute child character';
      const pageAction = this.currentPrompt();
      const combinedPrompt = `Character Reference: ${charDesc}. \n\n Scene Action: ${pageAction}`;
      
      const imageUrl = await this.gemini.generateImage(combinedPrompt, this.imageQuality());
      this.imageCache.set(idx, imageUrl);
      
      if (this.currentPageIndex() === idx) {
        this.currentImage.set(imageUrl);
      }
    } catch (e) {
      console.error('Error loading image', e);
      this.currentImage.set('https://picsum.photos/800/800');
    }
  }

  nextPage() {
    if (this.currentPageIndex() < this.story().pages.length - 1) {
      this.currentPageIndex.update(i => i + 1);
    }
  }

  prevPage() {
    if (this.currentPageIndex() > 0) {
      this.currentPageIndex.update(i => i - 1);
    }
  }

  toggleSpeech() {
    if (this.audio.isSpeaking()) {
      this.audio.cancel();
    } else {
      this.audio.speak(this.currentText());
    }
  }
}