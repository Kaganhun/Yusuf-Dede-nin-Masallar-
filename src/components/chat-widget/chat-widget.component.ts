import { Component, inject, signal, ElementRef, ViewChild, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GeminiService } from '../../services/gemini.service';

interface Message {
  text: string;
  sender: 'user' | 'bot';
}

@Component({
  selector: 'app-chat-widget',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed bottom-4 right-4 z-50 flex flex-col items-end">
      
      <!-- Chat Window -->
      @if (isOpen()) {
        <div class="bg-white rounded-2xl shadow-2xl border border-purple-100 w-80 sm:w-96 mb-4 flex flex-col overflow-hidden animate-slide-up h-96">
          
          <!-- Header -->
          <div class="bg-purple-600 p-4 text-white flex justify-between items-center">
            <h3 class="font-bold flex items-center gap-2">
              🤖 Hikaye Botu
            </h3>
            <button (click)="toggleChat()" class="hover:bg-purple-700 p-1 rounded">✕</button>
          </div>

          <!-- Messages -->
          <div class="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 scroll-smooth" #scrollContainer>
            @for (msg of messages(); track $index) {
              <div class="flex" [class.justify-end]="msg.sender === 'user'">
                <div class="max-w-[80%] rounded-2xl p-3 text-sm"
                  [class.bg-purple-600]="msg.sender === 'user'"
                  [class.text-white]="msg.sender === 'user'"
                  [class.bg-white]="msg.sender === 'bot'"
                  [class.text-gray-800]="msg.sender === 'bot'"
                  [class.shadow-sm]="msg.sender === 'bot'">
                  {{ msg.text }}
                </div>
              </div>
            }
            @if (isThinking()) {
              <div class="flex justify-start">
                <div class="bg-white rounded-2xl p-3 shadow-sm flex gap-1">
                  <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                  <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                </div>
              </div>
            }
          </div>

          <!-- Input -->
          <div class="p-3 bg-white border-t border-gray-100 flex gap-2">
            <input 
              type="text" 
              [(ngModel)]="userInput" 
              (keyup.enter)="sendMessage()"
              placeholder="Bana her şeyi sorabilirsin!"
              [disabled]="isThinking()"
              class="flex-1 px-4 py-2 rounded-full bg-gray-100 text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-400"
            >
            <button 
              (click)="sendMessage()"
              [disabled]="!userInput().trim() || isThinking()"
              class="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center hover:bg-purple-700 disabled:opacity-50 transition-colors">
              ➤
            </button>
          </div>
        </div>
      }

      <!-- Toggle Button -->
      <button 
        (click)="toggleChat()"
        class="w-16 h-16 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center text-3xl z-50">
        @if (isOpen()) {
          👇
        } @else {
          💬
        }
      </button>
    </div>
  `,
  styles: [`
    @keyframes slide-up {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-slide-up {
      animation: slide-up 0.3s ease-out;
    }
    .delay-100 { animation-delay: 100ms; }
    .delay-200 { animation-delay: 200ms; }
  `]
})
export class ChatWidgetComponent {
  isOpen = signal(false);
  messages = signal<Message[]>([{ text: "Merhaba! Hikayenle veya başka bir şeyle ilgili soruları cevaplayabilirim!", sender: 'bot' }]);
  userInput = signal('');
  isThinking = signal(false);

  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  private gemini = inject(GeminiService);

  // Auto-scroll effect
  constructor() {
    effect(() => {
      this.messages(); // Depend on messages
      setTimeout(() => this.scrollToBottom(), 50); // Slight delay for DOM update
    });
  }

  toggleChat() {
    this.isOpen.update(v => !v);
  }

  async sendMessage() {
    const text = this.userInput().trim();
    if (!text || this.isThinking()) return;

    // Add user message
    this.messages.update(msgs => [...msgs, { text, sender: 'user' }]);
    this.userInput.set('');
    this.isThinking.set(true);

    try {
      // Build history for API
      const history = this.messages().map(m => ({
        role: m.sender === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }]
      }));

      // Call Gemini
      const response = await this.gemini.chat(history, text);
      
      this.messages.update(msgs => [...msgs, { text: response, sender: 'bot' }]);
    } catch (err) {
      console.error(err);
      this.messages.update(msgs => [...msgs, { text: "Üzgünüm, kafam biraz karıştı. Tekrar söyler misin?", sender: 'bot' }]);
    } finally {
      this.isThinking.set(false);
    }
  }

  private scrollToBottom() {
    if (this.scrollContainer) {
      const el = this.scrollContainer.nativeElement;
      el.scrollTop = el.scrollHeight;
    }
  }
}