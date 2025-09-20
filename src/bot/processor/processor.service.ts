import { Injectable } from '@nestjs/common';
import fetch from 'node-fetch';

@Injectable()
export class ProcessorService {

  private OPEN_ROUTERS_URL = process.env.OPEN_ROUTERS_URL!;
  private OPEN_ROUTERS_API_KEY = process.env.OPEN_ROUTERS_API_KEY!;

  private OCR_URL = process.env.OCR_URL!;
  private OCR_API_KEY = process.env.OCR_API_KEY!;

  private ASSEMBLY_URL = process.env.ASSEMBLY_URL!;
  private ASSEMBLY_API_KEY = process.env.ASSEMBLY_API_KEY!;

  async processText(rawText: string) {
    try {
    
    const response = await fetch(this.OPEN_ROUTERS_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${this.OPEN_ROUTERS_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      "model": "x-ai/grok-4-fast:free",
      messages: [ {
        role: "system",
        content: `You are a JSON extractor. Given a raw text from a receipt or user message, extract the following fields:
            - amount_original (number, required) — the numeric amount found.
            - currency_original (string, required) — currency code (UAH, PLN, USD, EUR). If ambiguous, guess.
            - date (ISO 8601 date or null) — date of transaction if present.
            - merchant (string or null) — merchant/store name.
            - category (one of: Food, Transport, Entertainment, Groceries, Utilities, ComputerGames) — choose best match or "Other".

            Return ONLY valid JSON. Example:
            {
              "amount_original": 123.45,
              "currency_original": "PLN",
              "date": "2025-09-17",
              "merchant": "Lidl",
              "category": "Groceries",
            }
            If a field is missing, set it to null. If amount or currency cannot be determined, respond with "Cannot extract transaction data."
            If you cannot extract any fields, respond with "Cannot extract transaction data.`,
        },
        {
          role: "user",
          content: rawText,
        },]
      })
    });

    interface OpenRouterResponse {
      choices?: Array<{
        message?: {
          content?: string;
        };
      }>;
      [key: string]: any;
    }

    const result = await response.json() as OpenRouterResponse;

    const content = result?.choices?.[0]?.message?.content;
    
    try {
      if (typeof content !== "string") {
        throw new Error('Модель не вернула текст для парсинга');
      }
      return { data: JSON.parse(content)}
    } catch (e) {
      throw new Error ("Модель вернула невалидный JSON");
    } 
  } catch (err) {
    return { error: err};
  } 
  }

  async processPhotoOrDoc(photoUrl: string) {
    try {
    
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
      throw new Error("Не удалось распознать чек");
    }

    const text = data.ParsedResults[0].ParsedText;

    return { text: text };
  } catch (err) {
    return { error: err};
  }
  }

  async processVoice(voiceUrl: string) {
    try {

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


    if (!createResp.ok) throw new Error("Can not fetch to the assembly service!");

    const { id } = await createResp.json() as { id?: string };
    if (!id) throw new Error("Не удалось создать задачу Assembly!");

    const transcriptId = id;
    
    let result;
    while (true) {
      const statusResp = await fetch(`${this.ASSEMBLY_URL}/${id}`, {
        headers: { Authorization: this.ASSEMBLY_API_KEY },
      });
      result = await statusResp.json();

      if (["completed", "error"].includes(result.status)) break;
      await new Promise(r => setTimeout(r, 2000));
    }

    if (result.status !== "completed") throw new Error(`Ошибка при расшифровке. ${result.error}`)

    return { text: result.text }

  } catch (err) {
    return { error: err};
  }
  }

}
