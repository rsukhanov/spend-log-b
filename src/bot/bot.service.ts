import { Injectable } from '@nestjs/common';
import { Update, Ctx, Start, Help, On, Action, Command } from 'nestjs-telegraf';
import { Context } from 'telegraf';

@Update()
@Injectable()
export class BotService {
  private replyMarkup =  {
    reply_markup: {
      inline_keyboard: [
        [{ text: '➕ Добавить запись', callback_data: 'add' }],
        [{ text: '📂 Мои записи', callback_data: 'records' }],
      ],
    }
  }
  @Start()
  async start(@Ctx() ctx: Context) {
    await ctx.reply(
      '👋 Привет! Я SpendLog бот для учёта расходов.\nВыберите действие:',
      this.replyMarkup
    );
  }

  @Help()
  async help(@Ctx() ctx: Context) {
    await ctx.reply(`
      📋 Доступные команды:
      /add - - Добавить запись
      /records - Мои записи
      /help - Помощь`,
      this.replyMarkup
    );
  }

  @Action('add')
  async onAddAction(@Ctx() ctx: Context) {
    await ctx.answerCbQuery();
    await this.handleAdd(ctx);
  }

  @Command('add')
  async onAddCommand(@Ctx() ctx: Context) {
    await this.handleAdd(ctx);
  }

  async handleAdd(ctx: Context) {
    await ctx.reply('✍️ Введите данные для новой записи (будет отправлено в n8n)...');
  }

  @Action('records')
  async onRecords(@Ctx() ctx: Context) {
    await ctx.answerCbQuery();
    await this.showAllRecords(ctx);
  }

  @Command('records')
  async onRecordsCommand(@Ctx() ctx: Context) {
    await this.showAllRecords(ctx);
  }

  async showAllRecords(ctx: Context) {
    await ctx.reply('📂 Ваши записи (будет получено из n8n)...');
  }


  @Action('help')
  async onHelp(@Ctx() ctx: Context) {
    await ctx.answerCbQuery();
    await this.help(ctx);
  }

}
