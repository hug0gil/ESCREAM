import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Role, User, VerificationTokenType } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { ChangeSubscriptionDto } from './dto/change-subscription.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RequestEmailChangeDto } from './dto/request-email-change.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly emailVerificationMinutes = 24 * 60;
  private readonly passwordResetMinutes = 60;
  private readonly emailChangeMinutes = 60;

  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  async register(dto: RegisterDto) {
    const user = await this.users.create({
      name: dto.name,
      email: dto.email,
      password: dto.password,
    });

    const token = await this.createVerificationToken(
      user.id,
      VerificationTokenType.EMAIL_VERIFICATION,
      this.emailVerificationMinutes,
    );
    await this.mail.sendVerificationEmail(user.email, token);

    this.logger.log({
      msg: 'User registered',
      userId: user.id,
      email: user.email,
    });

    return {
      user,
      message: 'User registered. Check your email to verify the account.',
    };
  }

  async login(dto: LoginDto) {
    const user = await this.users.findByEmailWithPassword(dto.email);
    if (!user) {
      this.logger.warn({
        msg: 'Login failed',
        reason: 'user_not_found',
        email: dto.email,
      });
      throw new UnauthorizedException('Invalid credentials');
    }
    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) {
      this.logger.warn({
        msg: 'Login failed',
        reason: 'invalid_password',
        userId: user.id,
      });
      throw new UnauthorizedException('Invalid credentials');
    }
    if (!user.emailVerifiedAt) {
      this.logger.warn({
        msg: 'Login blocked',
        reason: 'email_not_verified',
        userId: user.id,
      });
      throw new UnauthorizedException('Email not verified');
    }

    const activated = await this.activateSubscription(user);
    const { password: _omit, ...safe } = activated;

    return {
      access_token: this.signToken(
        activated.id,
        activated.email,
        activated.role,
      ),
      user: safe,
    };
  }

  logout() {
    return { message: 'Logout successfully!' };
  }

  // Omit es un tipo de TS que crea un objeto igual sin la propiedad que se indique
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
    const now = new Date();
    const endDate = new Date(now);
    endDate.setMonth(endDate.getMonth() + 1);

    const user = await this.users.update(userId, {
      planId: dto.planId,
      startDate: now.toISOString(),
      endDate: endDate.toISOString(),
      subscribed: true,
    });

    this.logger.log({
      msg: 'Subscription changed',
      userId,
      planId: dto.planId,
      endDate,
    });

    return user;
  }

  async verifyEmail(dto: VerifyEmailDto) {
    const record = await this.getValidVerificationToken(
      dto.token,
      VerificationTokenType.EMAIL_VERIFICATION,
    );

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: record.userId },
        data: { emailVerifiedAt: new Date() },
      }),
      this.prisma.verificationToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
    ]);

    this.logger.log({
      msg: 'Email verified',
      userId: record.userId,
      tokenId: record.id,
    });

    return { message: 'Email verified successfully.' };
  }

  async resendVerificationEmail(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || user.emailVerifiedAt) {
      this.logger.log({
        msg: 'Verification resend skipped',
        email,
        reason: !user ? 'user_not_found' : 'already_verified',
      });
      return {
        message: 'If the account needs verification, an email was sent.',
      };
    }

    const token = await this.createVerificationToken(
      user.id,
      VerificationTokenType.EMAIL_VERIFICATION,
      this.emailVerificationMinutes,
    );
    await this.mail.sendVerificationEmail(user.email, token);

    this.logger.log({
      msg: 'Verification email resent',
      userId: user.id,
      email: user.email,
    });

    return { message: 'If the account needs verification, an email was sent.' };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (user) {
      const token = await this.createVerificationToken(
        user.id,
        VerificationTokenType.PASSWORD_RESET,
        this.passwordResetMinutes,
      );
      await this.mail.sendPasswordResetEmail(user.email, token);
      this.logger.log({
        msg: 'Password reset requested',
        userId: user.id,
        email: user.email,
      });
    } else {
      this.logger.log({
        msg: 'Password reset requested',
        reason: 'user_not_found',
        email: dto.email,
      });
    }

    return {
      message: 'If the email exists, password reset instructions were sent.',
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const record = await this.getValidVerificationToken(
      dto.token,
      VerificationTokenType.PASSWORD_RESET,
    );

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: record.userId },
        data: { password: await bcrypt.hash(dto.password, 10) },
      }),
      this.prisma.verificationToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
    ]);

    this.logger.log({
      msg: 'Password reset completed',
      userId: record.userId,
      tokenId: record.id,
    });

    return { message: 'Password changed successfully.' };
  }

  async requestEmailChange(userId: number, dto: RequestEmailChangeDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.currentPassword, user.password);
    if (!valid) {
      this.logger.warn({
        msg: 'Email change rejected',
        reason: 'invalid_password',
        userId,
      });
      throw new UnauthorizedException('Invalid credentials');
    }
    if (user.email === dto.newEmail) {
      throw new BadRequestException('New email must be different.');
    }

    const existing = await this.prisma.user.findUnique({
      where: { email: dto.newEmail },
    });
    if (existing) throw new ConflictException('Email already in use');

    const token = await this.createVerificationToken(
      user.id,
      VerificationTokenType.EMAIL_CHANGE,
      this.emailChangeMinutes,
      dto.newEmail,
    );
    await this.mail.sendEmailChangeVerification(dto.newEmail, token);

    this.logger.log({
      msg: 'Email change requested',
      userId,
      currentEmail: user.email,
      newEmail: dto.newEmail,
    });

    return { message: 'Check your new email to confirm the change.' };
  }

  async confirmEmailChange(dto: VerifyEmailDto) {
    const record = await this.getValidVerificationToken(
      dto.token,
      VerificationTokenType.EMAIL_CHANGE,
    );
    if (!record.newEmail) {
      throw new BadRequestException('Invalid email change token');
    }

    const existing = await this.prisma.user.findUnique({
      where: { email: record.newEmail },
    });
    if (existing && existing.id !== record.userId) {
      throw new ConflictException('Email already in use');
    }

    const [updated] = await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: record.userId },
        data: {
          email: record.newEmail,
          emailVerifiedAt: new Date(),
        },
        omit: { password: true },
      }),
      this.prisma.verificationToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
    ]);

    this.logger.log({
      msg: 'Email changed',
      userId: record.userId,
      newEmail: record.newEmail,
      tokenId: record.id,
    });

    return { message: 'Email changed successfully.', user: updated };
  }

  private signToken(sub: number, email: string, role: Role): string {
    return this.jwt.sign({ sub, email, role });
  }

  private async createVerificationToken(
    userId: number,
    type: VerificationTokenType,
    ttlMinutes: number,
    newEmail?: string,
  ) {
    await this.prisma.verificationToken.updateMany({
      where: { userId, type, usedAt: null },
      data: { usedAt: new Date() },
    });

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

    await this.prisma.verificationToken.create({
      data: {
        userId,
        type,
        newEmail,
        expiresAt,
        tokenHash: this.hashToken(token),
      },
    });

    this.logger.log({
      msg: 'Verification token created',
      userId,
      type,
      expiresAt,
      hasNewEmail: newEmail !== undefined,
    });

    return token;
  }

  private async getValidVerificationToken(
    token: string,
    type: VerificationTokenType,
  ) {
    const record = await this.prisma.verificationToken.findUnique({
      where: { tokenHash: this.hashToken(token) },
    });

    if (!record || record.type !== type || record.usedAt) {
      this.logger.warn({
        msg: 'Invalid verification token',
        type,
      });
      throw new BadRequestException('Invalid or expired token');
    }
    if (record.expiresAt < new Date()) {
      this.logger.warn({
        msg: 'Expired verification token',
        tokenId: record.id,
        type,
        userId: record.userId,
      });
      throw new BadRequestException('Invalid or expired token');
    }

    return record;
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
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
