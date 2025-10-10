import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class MainMiddleware implements NestMiddleware {
  constructor(private readonly jwtService: JwtService) {}
  use(req: Request, res: Response, next: NextFunction) {
    try {
      const cookieHeader = req.headers?.cookie;
      if (!cookieHeader) throw new UnauthorizedException('No cookies');

      const token = cookieHeader.split('; ').find(row => row.startsWith('auth-token='))?.split('=')[1];
      if (!token) throw new UnauthorizedException('No auth token');

      const decoded = this.jwtService.verify(token);
      req['user'] = decoded;

      next();
    } catch (err) {
      console.log('Middleware error', err)
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
