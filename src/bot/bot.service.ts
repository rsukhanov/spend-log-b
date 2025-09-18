import { Injectable } from '@nestjs/common';
import { Update, Ctx, Start, Help, On } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import fetch from 'node-fetch';
import { ProcessorService } from 'src/processor/processor.service';
import { DbService } from 'src/db/db.service';



@Update()
@Injectable()
export class BotService {
  constructor(private processor: ProcessorService, private db: DbService) {}
  private message = `
  Привет👋  Я SpendLog бот для учёта расходов! Ты можешь скидывать:\n
  - 📸 чеки (фото или pdf)
  - 📱 скриншоты из банковских приложений
  - 💬 текстовые сообщения с тратами
  - 🎤 голосовые сообщения с тратами

  Я постараюсь распознать информацию и сохранить её в твоём личном кабинете, посмотреть всю информацию про свои траты ты можешь в веб-приложении!
`;

  @Start()
  async start(@Ctx() ctx: Context) {
    await ctx.reply(this.message);
  }

  @Help()
  async help(@Ctx() ctx: Context) {
    await ctx.reply(this.message);
  }

  @On('message')
  async onMessage(@Ctx() ctx: Context) {
    const msg = ctx.message;
    if (!msg) return;


    if ('text' in msg) {
      const result = await this.processor.processText(msg.text);
      await ctx.reply(`✅ Транзакция сохранена: ${JSON.stringify(result)}`);

    } 
    else if ('photo' in msg) {
      const fileId = msg.photo[msg.photo.length - 1].file_id;
      const file = await ctx.telegram.getFileLink(fileId);
      const result = await this.processor.processPhoto(file.href);
      await ctx.reply(`📸 Обработан чек: ${JSON.stringify(result)}`);

    } 
    else if ('document' in msg) {
      const fileId = msg.document.file_id;
      const file = await ctx.telegram.getFileLink(fileId);
      const result = await this.processor.processPhoto(file.href);
      await ctx.reply(`📄 Документ обработан: ${JSON.stringify(result)}`);

    } 
    else if ('voice' in msg) {
      const file = await ctx.telegram.getFileLink(msg.voice.file_id);
      const result = await this.processor.processVoice(file.href);
      await ctx.reply(`🎤 Голос переведен в текст: ${JSON.stringify(result)}`);

    }
  }
}
