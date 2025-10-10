import { Controller, Post, Body, Get, Head, Headers, Res } from '@nestjs/common';
import { WebappService } from './webapp.service';
import { ok } from 'assert';
import { UserService } from 'src/db/user/user.service';
import { json } from 'stream/consumers';
import { JwtService } from '@nestjs/jwt';
import type { Response } from 'express';

@Controller('webapp')
export class WebappController {
  constructor(private readonly webappService: WebappService, private readonly userService: UserService, private readonly jwtService: JwtService) {}

  @Post('verify')
  async verify(@Body('rawInitData') initData: string, @Res({ passthrough: true }) res: Response) {
    const valid = this.webappService.verifyInitData(initData);
    if (valid.ok) {
      try {
        const userData = JSON.parse(valid.data.user);
        userData.id = (userData.id).toString();

        const user = await this.userService.findUpdateOrRegisterUser(userData);
        if (!user) return {ok: false, error: 'Failed to get user inforamtion!'}

        const token = this.jwtService.sign({
          id: user.id
        });
        
        res.cookie('auth-token', token, {
          httpOnly: true,
          secure: true,
          maxAge: 24 * 60 * 60 * 1000,
          path: '/'
        });
        return { ok: true, user };
      } catch (e) {
        return { ok: false, error: (e as Error).message };
      }
    } else {
      return valid;
    }    
  }
}



  