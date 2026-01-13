import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StorySetupComponent } from './components/story-setup/story-setup.component';
import { StoryViewerComponent } from './components/story-viewer/story-viewer.component';
import { ChatWidgetComponent } from './components/chat-widget/chat-widget.component';
import { GeneratedStory } from './services/gemini.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, StorySetupComponent, StoryViewerComponent, ChatWidgetComponent],
  template: `
    <div class="min-h-screen flex flex-col relative overflow-hidden">
      <!-- Header -->
      <header class="p-4 flex justify-between items-center bg-white/50 backdrop-blur-md shadow-sm z-10 sticky top-0">
        <div class="flex items-center gap-2">
          <span class="text-3xl">📚</span>
          <h1 class="text-2xl font-bold text-purple-600 tracking-wide">Yusuf Dede'nin Masalları</h1>
        </div>
        @if (currentStory()) {
          <button 
            (click)="resetApp()"
            class="px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-full font-bold transition-all shadow-md active:scale-95">
            Yeni Hikaye
          </button>
        }
      </header>

      <!-- Main Content -->
      <main class="flex-grow flex flex-col items-center justify-center p-4 w-full max-w-6xl mx-auto z-0">
        @if (!currentStory()) {
          <app-story-setup (storyGenerated)="onStoryGenerated($event)"></app-story-setup>
        } @else {
          <app-story-viewer [story]="currentStory()!" [imageQuality]="selectedQuality()"></app-story-viewer>
        }
      </main>

      <!-- Chat Widget -->
      <app-chat-widget></app-chat-widget>
    </div>
  `
})
export class AppComponent {
  currentStory = signal<GeneratedStory | null>(null);
  selectedQuality = signal<string>('1K');

  onStoryGenerated(event: { story: GeneratedStory, quality: string }) {
    this.selectedQuality.set(event.quality);
    this.currentStory.set(event.story);
  }

  resetApp() {
    this.currentStory.set(null);
  }
}