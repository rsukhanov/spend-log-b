import { Injectable } from '@nestjs/common';
import { Update, Ctx, Start, Help, On, Command } from 'nestjs-telegraf';
import { Context as TelegrafContext } from "telegraf";
import fetch from 'node-fetch';
import { ProcessorService } from 'src/bot/processor/processor.service';
import { UserService } from 'src/db/user/user.service';
import { ExpenseService } from 'src/db/expense/expense.service';
import { error } from 'console';
import { text } from 'stream/consumers';
import { SOURCE_TYPE } from '@prisma/client';
import { getMainCategory } from 'src/db/expense/utils/categories';
import { getErrorMessage } from 'src/general/error_utils';
import { dateToStr } from 'src/general/format_utils';

interface SessionData {
  expense: {
    data?: any,
  }
}

export interface MyContext extends TelegrafContext {
  session: SessionData;
}



@Update()
@Injectable()
export class BotService {
  constructor(private processor: ProcessorService, private user: UserService, private expense: ExpenseService) {}
  // - 📄 скриншот или документ банковских выписок
  private message = `
    Привет👋  Я SpendLog бот для учёта расходов! Скидывай мне:

    - 💬 текстовые сообщения с тратами
    - 📸 чеки (фото или pdf)
    - 📱 скриншоты 1 (одной) траты из банковского приложения
    - 🎤 голосовые сообщения с тратами

Пожалуйста старайтесь указывать валюту и сумму всегда, особенно когда в одном запросе присутсвует несколько трат!!!

Я постараюсь распознать информацию и сохранить её в твоём личном кабинете, посмотреть всю информацию про свои траты ты можешь в веб-приложении!

 Команда /clear очистит твои траты!
  `;
  @Start()
  async start(@Ctx() ctx: MyContext) {
    const userId = String(ctx.from?.id);
    const isRegistered = await this.user.isRegistered(userId);

    await ctx.reply(this.message);

    if (!isRegistered) {
      await this.user.registerUser({
        id: userId,
        first_name: ctx.from?.first_name,
        username: ctx.from?.username,
      });
    } else {
      const isExistExpenses = await this.expense.isExistExpense(userId)
      if (isExistExpenses) {
        await ctx.reply(`\n
Рад тебя видеть снова!😊 Я востановил твои прошлые траты! Все их можно посмотреть в веб-приложении!\n
Если желаешь начать вести учет заново, напиши \n/clear (все прошлые траты будут удалены)`);  
      } else {
        await ctx.reply(`Рад тебя видеть снова!😊 Можешь начинать вести учет заново! Все траты можешь посмотреть в веб-приложении!\n`);
      }
    }
    ctx.session.expense = {}
  }

  @Help()
  async help(@Ctx() ctx: MyContext) {
    await ctx.reply(this.message);
  }

  private async showExpenseSuccessMessage(ctx: MyContext, expenses){
    expenses.map(async (expense) => {
      await ctx.reply(
`🗓️ Дата: ${dateToStr(expense.date)}
💰 Сумма: ${expense.amount_original}
💴 Валюта: ${expense.currency_original}
✉️ Категория: ${expense.main_category}
📩 Подкатегория: ${expense.sub_category}
🛒 Магазин: ${expense.merchant}
        `, 
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "❌ Удалить трату", callback_data: `delete:${expense.id}` }]
          ]
        }
      })
    })
  }
  @Command('clear')
  async clear(@Ctx() ctx: MyContext) {
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


  private async cancelTransaction(ctx: MyContext, message?: string){
    ctx.session.expense = {}
    await ctx.reply(message || "⚠️ Ошибка при добавление траты. Что-то пошло не так!")
  }

  private async extractJsonFromText(ctx: MyContext, text: string, source: SOURCE_TYPE, image_url?: string) {
      const result = await this.processor.processText(text, image_url);
      if (result.error) {
        this.cancelTransaction(ctx, `⚠️ Ошибка главного сервиса по трансформации данных! ${result.error}`);
        return;
      }
      const data = result.data
      if ('error' in data) {
        this.cancelTransaction(ctx, `⚠️ Ошибка при трансформации данных! ${data.error}`);
        return
      }
      const userId = String(ctx.from?.id)
      await ctx.reply(`✅ Данные успешно распознаны!`);
      ctx.session.expense = { data: {} }

      data.forEach(expense => {
        expense.source = source;
        expense.userId = userId;
        expense.main_category = getMainCategory(expense.category)
        expense.sub_category = expense.category
        expense.category = undefined
      })
      if (data.length > 1) {
        this.saveManyExpenses(ctx, data)
        return
      }
      ctx.session.expense.data = data[0];
      await this.checkFieldsAndSave(ctx);
  }

  private async checkFieldsAndSave(ctx: MyContext) {
    const expense = ctx.session.expense.data
    
    if (expense.currency_original === "to_ask" || expense.amount_original === "to_ask") {

      if (expense.amount_original === "to_ask") {
        await ctx.reply("❓ Введи сумму вручную:", {
          reply_markup: {
            inline_keyboard: [
              [{ text: "Cancel ❓", callback_data: "CANCEL" }]
            ]
          }
        });
        return;
      }

      if (expense.currency_original === "to_ask") {
        await ctx.reply("❓ Укажи валюту", {
          reply_markup: {
            inline_keyboard: [
              [{ text: "UAH 🇺🇦", callback_data: "currency:UAH" }],
              [{ text: "PLN 🇵🇱", callback_data: "currency:PLN" }],
              [{ text: "EUR 🇪🇺", callback_data: "currency:EUR" }],
              [{ text: "USD 🇺🇸", callback_data: "currency:USD" }],
              [{ text: "Cancel ❓", callback_data: "CANCEL" }]
            ]
          }
        });
        return;
      }

    }
    if (expense.currency_original && expense.amount_original && expense){
      this.saveExpense(ctx);
    } else {
      await this.cancelTransaction(ctx)
    }
  }

  private async saveExpense(ctx: MyContext){
    const expense = ctx.session.expense.data;
    ctx.session.expense = {}
    try {
      const res = await this.expense.createExpense(expense)
      await ctx.reply(`✅ Трата была успешно сохранена!`)
      await this.showExpenseSuccessMessage(ctx, [res]);
    } catch (e) {
      await ctx.reply(`⚠️ Ошибка при сохранении информации! Попробуйте ввести более честкую информацию. (ошибка может быть связаня с не указанием валюты в одном запросе при большей трате которую можно разделить на несколько) ${getErrorMessage(e, '')}`)
    }  
  }

  private async saveManyExpenses(ctx: MyContext, expenses){
    ctx.session.expense = {}
    try {
      const res = await this.expense.createManyExpenses(expenses);
    } catch (e) {
      await ctx.reply(`⚠️ Ошибка при сохранении информации! Попробуйте ввести более честкую информацию. (ошибка может быть связаня с мультивалютностью в однои запросе) ${getErrorMessage(e, '')}`)
      return
    }  
    
    await ctx.reply(`✅ Трата была разделена на несколько, и успешно сохранена!`)
    await this.showExpenseSuccessMessage(ctx, expenses);
  }

  @On('callback_query')
  async onCallback(@Ctx() ctx: MyContext) {
    const callback = ctx.callbackQuery;

    if (!("data" in callback!)) {
      return; 
    }
    const callbackData = callback.data; 

    if (callbackData.startsWith("delete:")) {
      const expenseId = callbackData.split(":")[1];

      try {
        const res = await this.expense.deleteExpense(expenseId);
        await ctx.editMessageReplyMarkup(undefined);
        await ctx.reply(`🗑 Трата ${dateToStr(res.date)} числа на сумму ${res.amount_original} ${res.currency_original} была успешно удалена!`);
      } catch (e) {
        await ctx.reply(`⚠️ Ошибка при удалении: ${getErrorMessage(e, '')}`);
      }
      return;
    }


    if (callbackData === "CANCEL") {
      this.cancelTransaction(ctx, "❌ Добавление траты отменено");
      return;
    }

    const expense = ctx.session.expense.data;

    if (callbackData.startsWith("currency:")) {
      const currency = callbackData.split(":")[1];
      await ctx.reply(`💱 Валюта указана: ${currency}`);
      ctx.session.expense.data.currency_original = currency;
    }

    this.checkFieldsAndSave(ctx)
}


  @On('message')
  async onMessage(@Ctx() ctx: MyContext) {
    const msg = ctx.message;
    if (!msg) return;

    
    if (ctx.session.expense && ctx.session.expense.data){
      if (!('text' in msg)) {
        this.cancelTransaction(ctx);
        return
      }
      if ('text' in msg) {
        const amount = parseFloat(msg.text)
        if (isNaN(amount)) {
          ctx.reply('Ожидается число, которое является суммой твоей траты!', {
            reply_markup: {
              inline_keyboard: [
                [{ text: "Cancel ❓", callback_data: "CANCEL" }]
                ]
              }
            });
          return
        }
        ctx.session.expense.data.amount_original = amount
        this.checkFieldsAndSave(ctx)
        return
      }
    }

    await ctx.reply('Принял вашу трату, начинаю обработку...')

    if ('text' in msg) {
      await this.extractJsonFromText(ctx, msg.text, 'TEXT') 
    } 

    else if ('photo' in msg) {
      const fileId = msg.photo[msg.photo.length - 1].file_id;
      const file = await ctx.telegram.getFileLink(fileId);
      
      // const result = await this.processor.processPhotoOrDoc(file.href);

      // if (result.error) {
      //   await ctx.reply(`⚠️ Ошибка при обработке фото: ${result.error}`);
      //   return;
      // }

      await this.extractJsonFromText(ctx, 'img', 'PHOTO', file.href);
    } 

    else if ('document' in msg) {
      const fileId = msg.document.file_id;
      const file = await ctx.telegram.getFileLink(fileId);
      // const result = await this.processor.processPhotoOrDoc(file.href);
      // if (result.error) {
      //   await ctx.reply(`⚠️ Ошибка при обработке документа: ${result.error}`);
      //   return;
      // }

      await this.extractJsonFromText(ctx, 'img', 'DOCUMENT', file.href);
    } 
    else if ('voice' in msg) {
      const file = await ctx.telegram.getFileLink(msg.voice.file_id);

      const result = await this.processor.processVoice(file.href);

      if (result.error) {
        ctx.reply(`⚠️ Ошибка перевода голоса в текс! ${result.error}`)
        return;
      }
      const text = result.text;

      await this.extractJsonFromText(ctx, result.text, 'VOICE')
    }
  }
}
