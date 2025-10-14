import { Update, Start, Help, Ctx, On, Command } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { BotService } from './bot.service';

@Update()
export class BotUpdate {
  constructor(private readonly botService: BotService) {}

  @Start()
  onStart(@Ctx() ctx: Context) {
    return this.botService.start(ctx as any);
  }

  @Help()
  onHelp(@Ctx() ctx: Context) {
    return this.botService.help(ctx as any);
  }

  @Command('clear')
  onClear(@Ctx() ctx: Context) {
    return this.botService.clear(ctx as any);
  }

  @On('message')
  onMessage(@Ctx() ctx: Context) {
    return this.botService.onMessage(ctx as any);
  }

  @On('callback_query')
  onCallback(@Ctx() ctx: Context) {
    return this.botService.onCallback(ctx as any);
  }
}
