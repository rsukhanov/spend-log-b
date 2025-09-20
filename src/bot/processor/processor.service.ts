import { Injectable } from '@nestjs/common';
import fetch from 'node-fetch';

@Injectable()
export class ProcessorService {

  private OCR_URL = process.env.OCR_URL!;
  private OCR_API_KEY = process.env.OCR_API_KEY!;


  private ASSEMBLY_URL = process.env.ASSEMBLY_URL!;
  private ASSEMBLY_API_KEY = process.env.ASSEMBLY_API_KEY!;

  async processText(text: string) {
    
  }

  async processPhotoOrDoc(photoUrl: string) {
    const fileResp = await fetch(photoUrl);
    const buffer = await fileResp.arrayBuffer();
    const base64Image = Buffer.from(buffer).toString('base64');

    const response = await fetch(this.OCR_URL, {
      method: 'POST',
      headers: {
        apikey: this.OCR_API_KEY,
      },
      body: new URLSearchParams({
        base64Image: `data:image/jpeg;base64,${base64Image}`,
        language: 'eng',
        OCREngine: '2',
      }),
    });

    interface OcrSpaceResponse {
      ParsedResults?: Array<any>;
      [key: string]: any;
    }

    const data = await response.json() as OcrSpaceResponse;

    if (!data || !data.ParsedResults?.[0]) {
      return { error: 'Не удалось распознать чек' };
    }

    const text = data.ParsedResults[0].ParsedText;

    return { text };
  }

  async processVoice(voiceUrl: string) {
    // const fileResp = await fetch(voiceUrl);
    // const buffer = await fileResp.arrayBuffer();

    const createResp = await fetch(this.ASSEMBLY_URL, {
      method: "POST",
      headers: {
        "Authorization": this.ASSEMBLY_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        audio_url: voiceUrl,
        language_code: "ru",
      }),
    });


    const { id } = await createResp.json() as { id?: string };
    if (!id) return { error: "Не удалось создать задачу" };

    const transcriptId = id;
    
    let result;
    while (true) {
      const statusResp = await fetch(`${this.ASSEMBLY_URL}/${id}`, {
        headers: { Authorization: this.ASSEMBLY_API_KEY },
      });
      result = await statusResp.json();

      if (["completed", "error"].includes(result.status)) break;
      await new Promise(r => setTimeout(r, 3000));
  }

  return result.status === "completed"
    ? { text: result.text }
    : { error: "Ошибка при расшифровке", details: result };
  }
}
