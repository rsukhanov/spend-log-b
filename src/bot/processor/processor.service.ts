import { Injectable } from '@nestjs/common';
import { Expense } from '@prisma/client';
import fetch from 'node-fetch';
import { getSubCategoriesList } from 'src/db/expense/utils/categories';
import { json } from 'stream/consumers';

@Injectable()
export class ProcessorService {

  private OPEN_ROUTERS_URL = process.env.OPEN_ROUTERS_URL!;
  private OPEN_ROUTERS_API_KEY = process.env.OPEN_ROUTERS_API_KEY!;

  private OPEN_ROUTERS_AI_MODEL = process.env.OPEN_ROUTERS_AI_MODEL!;

  private OCR_URL = process.env.OCR_URL!;
  private OCR_API_KEY = process.env.OCR_API_KEY!;

  private ASSEMBLY_URL = process.env.ASSEMBLY_URL!;
  private ASSEMBLY_API_KEY = process.env.ASSEMBLY_API_KEY!;

  private subCategories = getSubCategoriesList()

  async processText(rawText: string, image_url?: string) {
    let raw_content: Array<{ type: "image_url"; image_url: { url: string } } | { type: "text"; text: string }>;
    if (image_url) {
       const fileResp = await fetch(image_url);
        const buffer = await fileResp.arrayBuffer();
        const base64Image = Buffer.from(buffer).toString('base64');
       
        const dataUrl = `data:image/jpeg;base64,${base64Image}`;

      raw_content = [
        {
          type: "image_url",
          image_url: { url: dataUrl}
        }
      ]
    } else {
      raw_content = [{
      type: "text",
      text: rawText
    }];
    }
    try {

    const response = await fetch(this.OPEN_ROUTERS_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${this.OPEN_ROUTERS_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      "model": this.OPEN_ROUTERS_AI_MODEL,
      messages: [ {
        role: "system",
        content: `
          You are a JSON extractor and financial categorizer.
          Given a raw text from a receipt, voice note, user message or receipt image, extract structured transaction data.

          Rules:
          1. Always return a **valid JSON array** of objects. Return only a array of objects or an error object. Never return some extra markers or text! 

          2. Each object must contain all required fields:
            - "amount_original" (number) — numeric amount. If cannot detect, set to "to_ask".
            - "currency_original" (string) — currency code (UAH, PLN, USD, EUR). If cannot detect, set to "to_ask".
            - "date" (ISO 8601 string) — if no date is present, use today's: ${new Date().toISOString()}! If you can not extract day, use today's day. If you can not extract month - use todays month. If you can not extract year, use today's year! ${new Date().toISOString()} - it is today's date!
            - "merchant" (string) — merchant/store name. If unknown, set to "unknown".
            - "category" (string) — one of these categories ${this.subCategories}. If unknown, set to "OTHER".

          3. Splitting rule:
            - If the transaction clearly includes multiple types of expenses (e.g. groceries + household purchases), split into multiple JSON objects.
            - Do not split off small items: if a part is less than 20% of total amount, merge it into the main category.
            - When you use splitting rule you can not put "to_ask" to the "amount_original" and "currency_original" fields! Its important!.

          4. Decision rule for uncertainty:
            - If you cannot determine amount or currency and you are NOT splitting the expense → use "to_ask".
            - If you cannot determine merchant, or it is irrelevant → use "to_ask".
            - If you cannot determine category → set to "OTHER".
            - If you are splitting the expense than you can not put "to_ask" to the "amount_original" and "currency_original" fields.
            - Never leave fields empty.

          5. If nothing at all can be extracted → return: { error: "Не могу распознать информацию! Пожалуйста предоставте более четкую и понятную информацию!"} . 

          6. Do not be shy to response with { error: "Не могу распознать информацию! Пожалуйста предоставте более четкую и понятную информацию!"} if you are not sure that you have a valid data to respond!

          7. If you can split the extense and there are not clear currencies for all it parts, then return { error: "Не могу распознать валюту для каждой части этой большой траты! Отправьте эти траты по одной или с более четким указанием валют!"}.

          8. Do not try to extract category from merchant only, try to understand the purchase itself!

          9. When you finish, return ONLY valid JSON (without markdown, explanations, or extra text).
        `,
      },
      {
        role: "user",
        content: raw_content,
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

    if (!content) throw new Error("Сервис не вернула данные");

    try {
      const data = JSON.parse(content);
      return { data };
    } catch (e) {
      try{
        let cleaned = content!.trim()
          .replace(/^```(?:json)?/i, "")
          .replace(/```$/i, "")
          .replace(/^Here\s+is\s+the\s+JSON[:\s]*/i, "")
          .trim();

        const data = JSON.parse(cleaned);
        return { data };
      } catch (e) {
        throw new Error("Модель вернула невалидный JSON");
      }
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
        OCREngine: '1',
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
