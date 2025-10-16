// telegraf-webhook.controller.ts
import { Controller, Post, Body, Res } from '@nestjs/common';
import { type Response } from 'express';
import { BotService } from './bot/bot.service';

@Controller()
export class TelegrafWebhookController {
  constructor(private readonly botService: BotService) {}

  @Post('telegraf')
  async handleWebhook(@Body() update: any, @Res() res: Response) {
    console.log('📨 Telegram webhook received');
    
    try {
      await this.botService.handleUpdate(update);
      res.status(200).send('OK');
    } catch (error) {
      console.error('Error handling webhook:', error);
      res.status(200).send('OK'); 
    }
  }
}