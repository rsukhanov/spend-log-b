import { Module } from '@nestjs/common';
import { CurrencyService } from './currency.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ScheduleModule } from '@nestjs/schedule';
import { CurrencyShedulerService } from './currencySheduler.service';

@Module({
  imports: [
    PrismaModule,
    ScheduleModule.forRoot(),
  ],
  providers: [
    CurrencyService, 
    CurrencyShedulerService],
  exports: [CurrencyService, CurrencyShedulerService],
})
export class CurrencyModule {}
