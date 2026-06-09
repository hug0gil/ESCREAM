import {
  Body,
  Controller,
  Get,
  HttpCode,
  Patch,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { User } from '@prisma/client';
import { LogRequestsInterceptor } from '../common/interceptors/log-requests.interceptor';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { ChangeSubscriptionDto } from './dto/change-subscription.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RequestEmailChangeDto } from './dto/request-email-change.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { JwtUserAuthGuard } from './guards/jwt-user-auth.guard';

@UseInterceptors(LogRequestsInterceptor)
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Post('verify-email')
  @HttpCode(200)
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.auth.verifyEmail(dto);
  }

  @Post('resend-verification')
  @HttpCode(200)
  resendVerificationEmail(@Body() dto: ForgotPasswordDto) {
    return this.auth.resendVerificationEmail(dto.email);
  }

  @Post('forgot-password')
  @HttpCode(200)
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.auth.forgotPassword(dto);
  }

  @Post('reset-password')
  @HttpCode(200)
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.auth.resetPassword(dto);
  }

  @ApiBearerAuth('user-jwt')
  @UseGuards(JwtUserAuthGuard)
  @Post('request-email-change')
  @HttpCode(200)
  requestEmailChange(
    @CurrentUser() user: Omit<User, 'password'>,
    @Body() dto: RequestEmailChangeDto,
  ) {
    return this.auth.requestEmailChange(user.id, dto);
  }

  @Post('confirm-email-change')
  @HttpCode(200)
  confirmEmailChange(@Body() dto: VerifyEmailDto) {
    return this.auth.confirmEmailChange(dto);
  }

  @ApiBearerAuth('user-jwt')
  @UseGuards(JwtUserAuthGuard)
  @Post('logout')
  @HttpCode(200)
  logout() {
    return this.auth.logout();
  }

  @ApiBearerAuth('user-jwt')
  @UseGuards(JwtUserAuthGuard)
  @Post('refresh')
  @HttpCode(200)
  refresh(@CurrentUser() user: Omit<User, 'password'>) {
    return this.auth.refresh(user);
  }

  @ApiBearerAuth('user-jwt')
  @UseGuards(JwtUserAuthGuard)
  @Patch('changeSubscription')
  changeSubscription(
    @CurrentUser() user: Omit<User, 'password'>,
    @Body() dto: ChangeSubscriptionDto,
  ) {
    return this.auth.changeSubscription(user.id, dto);
  }

  @ApiBearerAuth('user-jwt')
  @UseGuards(JwtUserAuthGuard)
  @Get('who')
  who(@CurrentUser() user: Omit<User, 'password'>) {
    return this.auth.who(user);
  }
}
