import { Controller, Get } from '@nestjs/common';

@Controller('ping')
export class PingController {
  constructor() {}
  @Get()
  ping() {
    console.log('Pong received');
    return { ok: true, message: 'pong' };
  }
}
