import { Injectable } from '@nestjs/common';
import { Update, Ctx, Start, Help, On, Command } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import fetch from 'node-fetch';
import { ProcessorService } from 'src/bot/processor/processor.service';
import { UserService } from 'src/db/user/user.service';
import { ExpenseService } from 'src/db/expense/expense.service';



@Update()
@Injectable()
export class BotService {
  constructor(private processor: ProcessorService, private user: UserService, private expense: ExpenseService) {}
  private message = `
  Привет👋  Я SpendLog бот для учёта расходов! Скидывай мне:\n
  - 📸 чеки (фото или pdf)
  - 📱 скриншоты из банковских приложений
  - 💬 текстовые сообщения с тратами
  - 🎤 голосовые сообщения с тратами

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
        Если желаешь начать вести учет заново, напиши /clear 
        Если желаешь удалить все свои данные, напиши /delete`);

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
        await ctx.reply('✅ У тебя нет прошлых трат для удаления, можно начинать вести учет!');
        return
      }
      await this.expense.clearUserExpenses(userId);
    } catch {
      await ctx.reply('⚠️ Произошла ошибка при удалении трат, попробуй еще раз позже!');
      return;
    }

    await ctx.reply('✅ Все твои прошлые траты удалены, можно начинать вести учет заново!');
  }

  @Command('delete')
  async delete(@Ctx() ctx: Context) {
    const userId = String(ctx.from?.id);
    try {
      await this.expense.clearUserExpenses(userId);
      await this.user.deleteUser(userId);
    } catch {
      ctx.reply('⚠️ Произошла ошибка при удалении данных, попробуй еще раз позже!');
      return;
    }

    await ctx.reply('✅ Все твои данные удалены, жаль тебя терять! Если передумаешь, просто напиши /start');
  
    await ctx.reply('👋 До встречи!', {
      reply_markup: { remove_keyboard: true },
    });

  }

  @On('message')
  async onMessage(@Ctx() ctx: Context) {
    const msg = ctx.message;
    if (!msg) return;


    if ('text' in msg) {
      const result = await this.processor.processText(msg.text);
      await ctx.reply(`✅ Транзакция сохранена: ${result}`);

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
