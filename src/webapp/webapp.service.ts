import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class WebappService {
  
  verifyInitData(initData: string): { ok: false; error: string } | { ok: true; data: Record<string, string> } {
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;

    if (!initData) {
      return { ok: false, error: 'Нет initData' };
    }

    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    if (!hash) {
      return { ok: false, error: 'Нет hash' };
    }

    params.delete('hash');

    const dataCheckString = Array.from(params.entries())
      .map(([k, v]) => `${k}=${v}`)
      .sort()
      .join('\n');

    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(BOT_TOKEN)
      .digest();

    const computedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    if (computedHash === hash) {
      return { ok: true, data: Object.fromEntries(params) };
    } else {
      return { ok: false, error: 'Подпись неверная' };
    }
  }
}