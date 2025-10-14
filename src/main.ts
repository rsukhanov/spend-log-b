import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { TELEGRAF_ALL_BOTS } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({
    transform: true, 
    whitelist: true, 
  }));

  const bots = app.get<Telegraf[]>(TELEGRAF_ALL_BOTS);
  
  if (bots.length > 0) {
    app.use(bots[0].webhookCallback('/telegraf'));
    console.log('✅ Telegram webhook callback подключен по пути /telegraf');
  } else {
    console.error('⚠️ Бот не найден в TELEGRAF_ALL_BOTS');
  }

  const port = process.env.PORT || 4000;
  await app.listen(port, '0.0.0.0');
  
  console.log(`🚀 Application is running on port ${port}`);
}
bootstrap();
