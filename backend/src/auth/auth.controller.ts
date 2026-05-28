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
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
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
