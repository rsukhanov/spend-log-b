import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { TELEGRAF_ALL_BOTS } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.use(cookieParser());
   app.enableCors({
    origin: [
       'http://localhost:3000',
      'https://your-frontend-domain.vercel.app',
      'https://spend-log-b.vercel.app',
    ].filter(Boolean),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  });

  app.useGlobalPipes(new ValidationPipe({
    transform: true, 
    whitelist: true, 
  }));

  const port = process.env.PORT || 4000;
  await app.listen(port, '0.0.0.0');
  
  console.log(`🚀 Application is running on port ${port}`);
}

bootstrap().catch(err => {
  console.error('Failed to start application:', err);
  process.exit(1);
});