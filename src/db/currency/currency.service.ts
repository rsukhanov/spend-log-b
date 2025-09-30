import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

export interface CurRate {
  "rate": number;
  "cc": string;
  "exchangedate": string;
}

@Injectable()
export class CurrencyService {
  constructor(private readonly prisma: PrismaService) {}

  private async toUAH(amount: number, fromCC: string) {
    if (fromCC === 'UAH') return amount;

    const rateRecord = await this.prisma.uAH_to_Currency.findUnique({
      where: { cc: fromCC }
    });

    if (!rateRecord) 
      throw new Error(`No exchange rate found for currency code: ${fromCC}`);
    
    return amount * rateRecord.rate;
  }

  private async toCurrencyFromUAH(amount: number, toCC: string) {
    if (toCC === 'UAH') return amount;

    const rateRecord = await this.prisma.uAH_to_Currency.findUnique({
      where: { cc: toCC }
    });

    if (!rateRecord) 
      throw new Error(`No exchange rate found for currency code: ${toCC}`);
    
    return amount / rateRecord.rate;
  }

  async convertCurrency(amount: number, fromCC: string, toCC: string) {
    if (fromCC === toCC) return amount;
    const amountInUAH = await this.toUAH(amount, fromCC);
    return this.toCurrencyFromUAH(amountInUAH, toCC);
  }
    
  
  async getAllRates() {
    return await this.prisma.uAH_to_Currency.findMany();
  }

  async getThisRate(cc: string) {
    return await this.prisma.uAH_to_Currency.findUnique({
      where: { cc }
    });
  }

  private async updateCurrencyRate(rate: CurRate) {
    const dateParts = rate.exchangedate.split('.');
    const formattedDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
    
    return await this.prisma.uAH_to_Currency.upsert({
      create: {
        cc: rate.cc,
        rate: rate.rate,
        updatedAt: (new Date(formattedDate))
      },
      where: { cc: rate.cc },
      update: {
        rate: rate.rate,
        updatedAt: (new Date(formattedDate))
      }
    })
  }

  async updateAllCurrencies(rates: CurRate[]) {
    for (const rate of rates) {
      await this.updateCurrencyRate(rate);
    }

    return await this.getAllRates();
  }
}