import { Injectable } from '@nestjs/common';
import { CurRate, CurrencyService } from './currency.service';
import { Cron } from '@nestjs/schedule';

// const SYMBOLS = ['UAH', 'USD', 'EUR', 'PLN', 'GBP', 'HUF', 'CZK', 'MDL', 'RON', 'CAD', 'JPY', 'CNY', 'CHF', 'EGP', 'ILS',

@Injectable()
export class CurrencyShedulerService {
  constructor(private readonly currencyService: CurrencyService) {}
  private CURRENCY_NBU_URL = process.env.CURRENCY_NBU_URL!;
  private async getRates() {
    const res = await fetch(this.CURRENCY_NBU_URL, { 
      method: 'GET', 
      headers: { 'Content-Type': 'application/json' }
    })

    if(!res.ok) 
      throw new Error('Error fetching currency rates from NBU');
    
    const data = await res.json();

    if (!data || !Array.isArray(data)) 
      throw new Error('Invalid data format from NBU');
    
    return data;
  }


  @Cron('0 0 0 * * *')
  async handleDailyCurrencyUpdate() {
    console.log('Running daily currency update task...');
    const rates = await this.getRates();
    const res = await this.currencyService.updateAllCurrencies(rates);
    return res;
  }
}