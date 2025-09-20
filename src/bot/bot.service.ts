import { Injectable } from '@nestjs/common';
import { Update, Ctx, Start, Help, On, Command } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import fetch from 'node-fetch';
import { ProcessorService } from 'src/bot/processor/processor.service';
import { UserService } from 'src/db/user/user.service';
import { ExpenseService } from 'src/db/expense/expense.service';
import { error } from 'console';
import { text } from 'stream/consumers';



@Update()
@Injectable()
export class BotService {
  constructor(private processor: ProcessorService, private user: UserService, private expense: ExpenseService) {}
  private message = `
  Привет👋  Я SpendLog бот для учёта расходов! Скидывай мне:\n
  - 💬 текстовые сообщения с тратами
  - 📸 чеки (фото или pdf)
  - 📱 скриншоты из банковских приложений
  - 🎤 голосовые сообщения с тратами (beta, работает долго)

  Я постараюсь распознать информацию и сохранить её в твоём личном кабинете, посмотреть всю информацию про свои траты ты можешь в веб-приложении!
`;
  @Start()
  async start(@Ctx() ctx: Context) {
    const userId = String(ctx.from?.id);
    const isRegistered = await this.user.isRegistered(userId);

    await ctx.reply(this.message);

    if (!isRegistered) {
      await this.user.registerUser({
        userId,
        name: ctx.from?.first_name,
        username: ctx.from?.username,
      });
    } else {
      await ctx.reply(`Рад тебя видеть снова!😊 Я востановил твои прошлые траты! Посмотри их в веб-приложении!\n
        Если желаешь начать вести учет заново, напиши /clear (все прошлые траты будут удалены)\n`);

      }
  }

  @Help()
  async help(@Ctx() ctx: Context) {
    await ctx.reply(this.message);
  }

  @Command('clear')
  async clear(@Ctx() ctx: Context) {
    const userId = String(ctx.from?.id);

    try {
      const isExistExpenses = await this.expense.isExistExpense(userId);
      if (!isExistExpenses) {
        await ctx.reply('✅ У тебя нет прошлых трат для удаления, можно начинать вести новый учет!');
        return
      }
      await this.expense.clearUserExpenses(userId);
    } catch {
      await ctx.reply('⚠️ Произошла ошибка при удалении трат, попробуй еще раз позже!');
      return;
    }

    await ctx.reply('✅ Все твои прошлые траты удалены, можно начинать вести новый учет заново!');
  }

  private async extractJsonFromText(ctx: Context, text: string){
      const result = await this.processor.processText(text)
      if (result.error) {
        await ctx.reply(`⚠️ Ошибка главного сервиса по трансформации данных!: ${result.error}`);
        return null;
      }
      return result.data
  }
  @On('message')
  async onMessage(@Ctx() ctx: Context) {
    const msg = ctx.message;
    if (!msg) return;


    if ('text' in msg) {
      const data = await this.extractJsonFromText(ctx, msg.text)
      if (!data) return;

      await ctx.reply(`✅ Данные успешно распознаны: ${JSON.stringify(data)}`);
      
    } 

    else if ('photo' in msg) {
      const fileId = msg.photo[msg.photo.length - 1].file_id;
      const file = await ctx.telegram.getFileLink(fileId);
      
      const result = await this.processor.processPhotoOrDoc(file.href);
      if (result.error) {
        await ctx.reply(`⚠️ Ошибка при обработке фото: ${result.error}`);
        return;
      }
      await ctx.reply(`📄 Фото обработано: ${JSON.stringify(result.text)}`); 

      const data = await this.extractJsonFromText(ctx, result.text)
      if (!data) return;

      await ctx.reply(`✅ Данные успешно распознаны: ${JSON.stringify(data)}`);
    } 

    else if ('document' in msg) {
      const fileId = msg.document.file_id;
      const file = await ctx.telegram.getFileLink(fileId);
      const result = await this.processor.processPhotoOrDoc(file.href);
      if (result.error) {
        await ctx.reply(`⚠️ Ошибка при обработке документа: ${result.error}`);
        return;
      }

      await ctx.reply(`📄 Документ обработан: ${JSON.stringify(result.text)}`);

      const data = await this.extractJsonFromText(ctx, result.text)
      if (!data) return;

      await ctx.reply(`✅ Данные успешно распознаны: ${JSON.stringify(data)}`);
      
    } 
    else if ('voice' in msg) {
      const file = await ctx.telegram.getFileLink(msg.voice.file_id);

      const result = await this.processor.processVoice(file.href);

      if (result.error) {
        ctx.reply(`⚠️ Ошибка перевода голоса в текс! ${result.error}`)
        return;
      }

      const text = result.text;
      await ctx.reply(`🎤 Голос переведен в текст: ${text}`);

      const data = await this.extractJsonFromText(ctx, result.text)
      if (!data) return;

      await ctx.reply(`✅ Данные успешно распознаны: ${JSON.stringify(data)}`);
    }
  }
}
