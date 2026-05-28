import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Role, User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { ChangeSubscriptionDto } from './dto/change-subscription.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async register(dto: RegisterDto) {
    const user = await this.users.create({
      name: dto.name,
      email: dto.email,
      password: dto.password,
    });
    return {
      access_token: this.signToken(user.id, user.email, user.role),
      user,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.users.findByEmailWithPassword(dto.email);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const activated = await this.activateSubscription(user);
    const { password: _omit, ...safe } = activated;

    return {
      access_token: this.signToken(activated.id, activated.email, activated.role),
      user: safe,
    };
  }

  logout() {
    return { message: 'Logout successfully!' };
  }

  refresh(user: Omit<User, 'password'>) {
    return {
      token: this.signToken(user.id, user.email, user.role),
      token_type: 'bearer',
    };
  }

  who(user: Omit<User, 'password'>) {
    return user;
  }

  async changeSubscription(userId: number, dto: ChangeSubscriptionDto) {
    return this.users.update(userId, { planId: dto.planId });
  }

  private signToken(sub: number, email: string, role: Role): string {
    return this.jwt.sign({ sub, email, role });
  }

  private async activateSubscription(user: User): Promise<User> {
    const now = new Date();
    const endDate = new Date(now);
    endDate.setMonth(endDate.getMonth() + 1);

    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: { startDate: now, endDate, subscribed: true },
    });

    this.logger.log({
      msg: 'Subscription activated',
      userId: updated.id,
      endDate: updated.endDate,
    });

    return updated;
  }
}
