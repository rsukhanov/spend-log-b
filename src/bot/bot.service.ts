import { Injectable } from '@nestjs/common';
import { Telegraf } from "telegraf";
import { ProcessorService } from 'src/bot/processor/processor.service';
import { UserService } from 'src/db/user/user.service';
import { ExpenseService } from 'src/db/expense/expense.service';
import { SOURCE_TYPE } from '@prisma/client';
import { getMainCategory, CATEGORY_NAMES, EXPENSE_SUB_CATEGORIES } from 'src/db/expense/utils/categories';
import { getErrorMessage } from 'src/general/error_utils';
import { dateToStr } from 'src/general/format_utils';
import { AVALIABLE_CURRENCIES } from 'src/db/currency/utils/allCurrencies';

interface SessionData {
  expense: {
    data?: any;
  };
}

interface SimplifiedContext {
  update: any;
  from: any;
  message?: any;
  callbackQuery?: any;
  chat: any;
  session: SessionData;
}

@Injectable()
export class BotService {
  private bot: Telegraf;
  private userSessions: Map<string, SessionData> = new Map();

  constructor(
    private processor: ProcessorService, 
    private user: UserService, 
    private expense: ExpenseService
  ) {
    this.bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);
  }

  private getSession(userId: string): SessionData {
    if (!this.userSessions.has(userId)) {
      this.userSessions.set(userId, { expense: {} });
    }
    return this.userSessions.get(userId)!;
  }

  private createContext(update: any): SimplifiedContext {
    const from = update.message?.from || update.callback_query?.from;
    const userId = String(from?.id);
    
    return {
      update,
      from,
      message: update.message,
      callbackQuery: update.callback_query,
      chat: update.message?.chat || update.callback_query?.message?.chat,
      session: this.getSession(userId)
    };
  }

  private async sendMessage(ctx: SimplifiedContext, text: string, options?: any) {
    const chatId = ctx.chat?.id;
    if (!chatId) return;

    try {
      await this.bot.telegram.sendMessage(chatId, text, options);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }
  private async editMessageReplyMarkup(ctx: SimplifiedContext, messageId: number, replyMarkup?: any) {
    const chatId = ctx.chat?.id;
    if (!chatId) return;

    try {
      await this.bot.telegram.editMessageReplyMarkup(chatId, messageId, undefined, replyMarkup);
    } catch (error) {
      console.error('Error editing message:', error);
    }
  }

  private message = `
    Привет👋  Я SpendLog бот для учёта расходов! Скидывай мне:

    - 💬 текстовые сообщения с тратами
    - 📸 чеки (фото или pdf)
    - 🎤 голосовые сообщения с тратами

Пожалуйста старайтесь указывать валюту и сумму всегда, особенно когда в одном запросе присутсвует несколько трат!!!

Я постараюсь распознать информацию и сохранить её в твоём личном кабинете, посмотреть всю информацию про свои траты ты можешь в веб-приложении!

 Команда /clear очистит твои траты!
  `;

  async start(update: any) {
    const ctx = this.createContext(update);
    const userId = String(ctx.from?.id);
    const isRegistered = await this.user.isRegistered(userId);

    await this.sendMessage(ctx, this.message);

    if (!isRegistered) {
      await this.user.registerUser({
        id: userId,
        first_name: ctx.from?.first_name,
        username: ctx.from?.username,
      });
    } else {
      const isExistExpenses = await this.expense.isExistExpense(userId);
      if (isExistExpenses) {
        await this.sendMessage(ctx, `\nРад тебя видеть снова!😊 Я востановил твои прошлые траты! Все их можно посмотреть в веб-приложении!\nЕсли желаешь начать вести учет заново, напиши \n/clear (все прошлые траты будут удалены)`);  
      } else {
        await this.sendMessage(ctx, `Рад тебя видеть снова!😊 Можешь начинать вести учет заново! Все траты можешь посмотреть в веб-приложении!\n`);
      }
    }
    ctx.session.expense = {};
  }

  async help(update: any) {
    const ctx = this.createContext(update);
    await this.sendMessage(ctx, this.message);
  }

  async clear(update: any) {
    const ctx = this.createContext(update);
    const userId = String(ctx.from?.id);

    try {
      const isExistExpenses = await this.expense.isExistExpense(userId);
      if (!isExistExpenses) {
        await this.sendMessage(ctx, '✅ У тебя нет прошлых трат для удаления, можно начинать вести новый учет!');
        return;
      }
      await this.expense.clearUserExpenses(userId);
    } catch {
      await this.sendMessage(ctx, '⚠️ Произошла ошибка при удалении трат, попробуй еще раз позже!');
      return;
    }

    await this.sendMessage(ctx, '✅ Все твои прошлые траты удалены, можно начинать вести новый учет заново!');
  }

  private async showExpenseSuccessMessage(ctx: SimplifiedContext, expenses: any[]) {
    for (const expense of expenses) {
      await this.sendMessage(ctx,
`🗓️ Дата: ${dateToStr(expense.date)}
💰 Сумма: ${expense.amount_original}
💴 Валюта: ${expense.currency_original}
✉️ Категория: ${CATEGORY_NAMES[expense.main_category]}
📩 Подкатегория: ${EXPENSE_SUB_CATEGORIES[expense.sub_category]}
🛒 Магазин: ${expense.merchant}`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "❌ Удалить трату", callback_data: `delete:${expense.id}` }]
          ]
        }
      });
    }
  }

  private async cancelTransaction(ctx: SimplifiedContext, message?: string) {
    ctx.session.expense = {};
    await this.sendMessage(ctx, message || "⚠️ Ошибка при добавление траты. Что-то пошло не так!");
  }

  private async extractJsonFromText(ctx: SimplifiedContext, text: string, source: SOURCE_TYPE, image_url?: string) {
    const result = await this.processor.processText(text, image_url);
    console.log(result)
    if (result.error) {
      this.cancelTransaction(ctx, `⚠️ Ошибка главного сервиса по трансформации данных! ${result.error}`);
      return;
    }
    
    const data = result.data;
    if ('error' in data) {
      this.cancelTransaction(ctx, `⚠️ Ошибка при трансформации данных! ${data.error}`);
      return;
    }
    
    const userId = String(ctx.from?.id);
    await this.sendMessage(ctx, `✅ Данные успешно распознаны!`);
    ctx.session.expense = { data: {} };

    let isNotValidAllCurrencies: string | null = null;

    data.forEach(expense => {
      expense.source = source;
      expense.userId = userId;
      expense.main_category = getMainCategory(expense.category);
      expense.sub_category = expense.category;
      expense.category = undefined;
      if (!AVALIABLE_CURRENCIES.includes(expense.currency_original) && expense.currency_original !== "to_ask") 
        isNotValidAllCurrencies = expense.currency_original;  
    });
    
    if (isNotValidAllCurrencies) {
      this.cancelTransaction(ctx, `⚠️ Ошибка, выявленная валюта ${isNotValidAllCurrencies} недоступна!`);
      return;
    }
    
    if (data.length > 1) {
      this.saveManyExpenses(ctx, data);
      return;
    }
    
    ctx.session.expense.data = data[0];
    await this.checkFieldsAndSave(ctx);
  }

  private async checkFieldsAndSave(ctx: SimplifiedContext) {
    const expense = ctx.session.expense.data;
    
    if (expense.currency_original === "to_ask" || expense.amount_original === "to_ask") {
      if (expense.currency_original === "to_ask") {
        await this.sendMessage(ctx, "❓ Укажи валюту", {
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

       if (expense.amount_original === "to_ask") {
        await this.sendMessage(ctx, "❓ Введи сумму вручную:", {
          reply_markup: {
            inline_keyboard: [
              [{ text: "Cancel ❓", callback_data: "CANCEL" }]
            ]
          }
        });
        return;
      }

    }
    
    if (expense.currency_original && expense.amount_original && expense) {
      this.saveExpense(ctx);
    } else {
      await this.cancelTransaction(ctx);
    }
  }

  private async saveExpense(ctx: SimplifiedContext) {
    const expense = ctx.session.expense.data;
    ctx.session.expense = {};
    
    try {
      const res = await this.expense.createExpense(expense);
      await this.sendMessage(ctx, `✅ Трата была успешно сохранена!`);
      await this.showExpenseSuccessMessage(ctx, [res]);
    } catch (e) {
      await this.sendMessage(ctx, `⚠️ Ошибка при сохранении информации! Попробуйте ввести более честкую информацию. (ошибка может быть связаня с не указанием валюты в одном запросе при большей трате которую можно разделить на несколько) ${getErrorMessage(e, '')}`);
    }  
  }

  private async saveManyExpenses(ctx: SimplifiedContext, expenses: any[]) {
    ctx.session.expense = {};
    
    try {
      await this.expense.createManyExpenses(expenses);
    } catch (e) {
      await this.sendMessage(ctx, `⚠️ Ошибка при сохранении информации! Попробуйте ввести более честкую информацию. (ошибка может быть связаня с мультивалютностью в однои запросе) ${getErrorMessage(e, '')}`);
      return;
    }  
    
    await this.sendMessage(ctx, `✅ Трата была разделена на несколько, и успешно сохранена!`);
    await this.showExpenseSuccessMessage(ctx, expenses);
  }

  async onCallback(update: any) {
    const ctx = this.createContext(update);
    const callback = ctx.callbackQuery;

    if (!callback || !('data' in callback)) {
      return; 
    }
    
    const callbackData = callback.data; 

    if (callbackData.startsWith("delete:")) {
      const expenseId = callbackData.split(":")[1];
      try {
        const res = await this.expense.deleteExpense(expenseId);
        await this.editMessageReplyMarkup(ctx, callback.message.message_id, undefined);
        await this.sendMessage(ctx, `🗑 Трата ${dateToStr(res.date)} числа на сумму ${res.amount_original} ${res.currency_original} была успешно удалена!`);
      } catch (e) {
        await this.sendMessage(ctx, `⚠️ Ошибка при удалении: ${getErrorMessage(e, '')}`);
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
      await this.sendMessage(ctx, `💱 Валюта указана: ${currency}`);
      ctx.session.expense.data.currency_original = currency;
    }

    this.checkFieldsAndSave(ctx);
  }

  async onMessage(update: any) {
    const ctx = this.createContext(update);
    const msg = ctx.message;
    if (!msg) return;

    if (ctx.session.expense && ctx.session.expense.data) {
      if (!('text' in msg)) {
        this.cancelTransaction(ctx);
        return;
      }
      
      if ('text' in msg) {
        const amount = parseFloat(msg.text);
        if (isNaN(amount)) {
          await this.sendMessage(ctx, 'Ожидается число, которое является суммой твоей траты!', {
            reply_markup: {
              inline_keyboard: [
                [{ text: "Cancel ❓", callback_data: "CANCEL" }]
              ]
            }
          });
          return;
        }
        ctx.session.expense.data.amount_original = amount;
        this.checkFieldsAndSave(ctx);
        return;
      }
    }

    await this.sendMessage(ctx, 'Принял вашу трату, начинаю обработку...');

    if ('text' in msg) {
      await this.extractJsonFromText(ctx, msg.text, 'TEXT');
    } else if ('photo' in msg) {
      const fileId = msg.photo[msg.photo.length - 1].file_id;
      const file = await this.bot.telegram.getFileLink(fileId);
      await this.extractJsonFromText(ctx, 'img', 'PHOTO', file.href);
    } else if ('document' in msg) {
      const fileId = msg.document.file_id;
      const file = await this.bot.telegram.getFileLink(fileId);
      await this.extractJsonFromText(ctx, 'img', 'DOCUMENT', file.href);
    } else if ('voice' in msg) {
      const file = await this.bot.telegram.getFileLink(msg.voice.file_id);
      const result = await this.processor.processVoice(file.href);

      if (result.error) {
        await this.sendMessage(ctx, `⚠️ Ошибка перевода голоса в текс! ${result.error}`);
        return;
      }

      await this.extractJsonFromText(ctx, result.text, 'VOICE');
    }
  }

  async handleUpdate(update: any) {
    console.log('🔄 Processing update:', update.update_id);
    
    try {
      if (update.message) {
        const text = update.message.text;
        if (text === '/start') {
          await this.start(update);
        } else if (text === '/help') {
          await this.help(update);
        } else if (text === '/clear') {
          await this.clear(update);
        } else {
          await this.onMessage(update);
        }
      } else if (update.callback_query) {
        await this.onCallback(update);
      }
    } catch (error) {
      console.error('Error handling update:', error);
      const ctx = this.createContext(update);
      await this.sendMessage(ctx, '⚠️ Произошла ошибка при обработке запроса. Попробуйте еще раз.');
    }
  }
}