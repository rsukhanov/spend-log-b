import { Injectable } from '@nestjs/common';
import fetch from 'node-fetch';

@Injectable()
export class ProcessorService {

  async processText(text: string) {
    // const response = await fetch(process.env.LLM_API_KEY!, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ text }),
    // });
    // return response.json();
  }

  async processPhoto(photoUrl: string) {
    // const ocrResponse = await fetch(process.env.OCR_API_KEY!, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ imageUrl: photoUrl }),
    // });
    // return ocrResponse.json();
  }

  async processVoice(voiceUrl: string) {
    // const sttResponse = await fetch(process.env.SPEECH_API_KEY!, {
    //   method: 'POST',
    //   body: JSON.stringify({ audioUrl: voiceUrl }),
    //   headers: { 'Content-Type': 'application/json' },
    // });
    // return sttResponse.json();
  }
}
