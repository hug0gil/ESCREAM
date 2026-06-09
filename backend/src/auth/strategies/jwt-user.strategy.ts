import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Role } from '@prisma/client';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../../users/users.service';

interface JwtUserPayload {
  sub: number;
  email: string;
  role: Role;
}

@Injectable()
export class JwtUserStrategy extends PassportStrategy(Strategy, 'jwt-user') {
  constructor(private readonly users: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // busca: Authorization: Bearer <token>
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_USER_SECRET as string,
    });
  }

  async validate(payload: JwtUserPayload) {
    const user = await this.users.findById(payload.sub).catch(() => null);
    if (!user) throw new UnauthorizedException();
    return user;
  }
}
