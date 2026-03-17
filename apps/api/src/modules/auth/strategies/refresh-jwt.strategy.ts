// PATH: apps/api/src/modules/auth/strategies/refresh-jwt.strategy.ts
// DESC: Estrategia Passport para validar refresh tokens con secret independiente

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { JwtPayload } from './jwt.strategy';

@Injectable()
export class RefreshJwtStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(private readonly config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_REFRESH_SECRET', ''),
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: JwtPayload) {
    const body = req.body as { refreshToken?: string };
    const refreshToken = body.refreshToken;
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token requerido');
    }
    return { ...payload, refreshToken };
  }
}
