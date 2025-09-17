import { Injectable } from '@nestjs/common';
import { Update, Ctx, Start, Help, Action, Command } from 'nestjs-telegraf';
import { Context } from 'telegraf';

@Update()
@Injectable()
export class BotService {
  private message = `
  Привет👋  Я SpendLog бот для учёта расходов! Ты можешь скидывать:\n
  - 📸 чеки (фото или pdf)
  - 📱 скриншоты из банковских приложений
  - 💬 текстовые сообщения с тратами
  - 🎤 голосовые сообщения с тратами

  Я постараюсь распознать информацию и сохранить её в твоём личном кабинете, посмотреть всю информацию про свои траты ты можешь в веб-приложении!
  `
  @Start()
  async start(@Ctx() ctx: Context) {
    await ctx.reply(this.message);
  }

  @Help()
  async help(@Ctx() ctx: Context) {
    await ctx.reply(this.message);
  }
}
