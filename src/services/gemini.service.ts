import { Injectable } from '@angular/core';
import { GoogleGenAI, Type } from '@google/genai';

export interface StoryPage {
  text: string;
  imagePrompt: string;
}

export interface GeneratedStory {
  title: string;
  characterDescription: string; // New field for visual consistency
  pages: StoryPage[];
}

@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    // Initialize with environment API Key
    this.ai = new GoogleGenAI({ apiKey: process.env['API_KEY'] || '' });
  }

  private handleError(error: any): never {
    console.error('Gemini API Error:', error);
    
    const errStr = JSON.stringify(error);
    if (errStr.includes('429') || errStr.includes('RESOURCE_EXHAUSTED') || errStr.includes('quota')) {
      throw new Error('Sistem şu an çok yoğun (Kota Aşıldı). Lütfen bir süre bekleyip tekrar dene.');
    }
    
    throw new Error('Bir hata oluştu. Lütfen tekrar dene.');
  }

  async generateStory(topic: string, childName: string, age: number): Promise<GeneratedStory> {
    try {
      // Updated prompt to explicitly request a consistent character description
      const prompt = `Write a children's story in Turkish for a ${age} year old named ${childName} about ${topic}. 
      The story should be 4-6 pages long. 
      Return a JSON object with:
      1. 'title': The story title.
      2. 'characterDescription': A detailed visual description in English of the main character (e.g. "a 5-year-old boy with curly brown hair, wearing a red superhero cape and blue jeans") to be used for consistent image generation across all pages.
      3. 'pages': An array of pages. Each page must have 'text' (the story text for that page in Turkish, 2-3 sentences max) and 'imagePrompt' (a description of the scene/action in English, focusing on the environment and activity, not redefining the character).`;

      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              characterDescription: { type: Type.STRING },
              pages: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    text: { type: Type.STRING },
                    imagePrompt: { type: Type.STRING }
                  },
                  required: ['text', 'imagePrompt']
                }
              }
            },
            required: ['title', 'characterDescription', 'pages']
          }
        }
      });

      if (response.text) {
        return JSON.parse(response.text) as GeneratedStory;
      }
      throw new Error('Failed to generate story text');
    } catch (e) {
      this.handleError(e);
    }
  }

  async generateImage(prompt: string, quality: string): Promise<string> {
    const enhancedPrompt = `${prompt}. Style: 3D render, bright colors, cute, pixar style, high quality, detailed, 8k resolution, cinematic lighting. Quality level: ${quality}`;

    try {
      const response = await this.ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: enhancedPrompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/jpeg',
          aspectRatio: '1:1', 
        }
      });
      
      const base64 = response.generatedImages?.[0]?.image?.imageBytes;
      if (base64) {
        return `data:image/jpeg;base64,${base64}`;
      }
      throw new Error('No image generated');
    } catch (e) {
      console.error('Image generation failed', e);
      // Return fallback image on error instead of throwing to keep the story readable
      return 'https://picsum.photos/1024/1024?blur=2'; 
    }
  }

  async chat(history: {role: string, parts: {text: string}[]}[], message: string) {
    try {
      const chat = this.ai.chats.create({
        model: 'gemini-2.5-flash',
        history: history,
        config: {
          systemInstruction: 'Sen çocuklar için arkadaş canlısı, yardımsever bir hikaye anlatıcısısın. Cevapları kısa, güvenli ve eğlenceli tut. Türkçe konuş.',
        }
      });

      const response = await chat.sendMessage({ message });
      return response.text;
    } catch (e) {
      // Return a friendly error message within the chat flow
      const errStr = JSON.stringify(e);
      if (errStr.includes('429') || errStr.includes('RESOURCE_EXHAUSTED')) {
        return "Çok fazla konuştuk galiba! Biraz yoruldum (Kota Doldu). Lütfen biraz bekle.";
      }
      return "Bir şeyler ters gitti, anlayamadım.";
    }
  }
}