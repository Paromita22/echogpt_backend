import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshDto } from './dto/refresh.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Create a new account' })
  @ApiCreatedResponse({ description: 'User created' })
  @ApiConflictResponse({ description: 'Email already registered' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Log in and get access + refresh tokens' })
  @ApiOkResponse({ description: 'Returns accessToken and refreshToken' })
  @ApiUnauthorizedResponse({ description: 'Invalid email or password' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
    @Post('refresh')
  @HttpCode(200)
  @ApiOperation({ summary: 'Exchange a refresh token for new tokens' })
  refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto);
  }

  @Post('logout')
  @HttpCode(200)
  @ApiOperation({ summary: 'Invalidate a refresh token' })
  logout(@Body() dto: RefreshDto) {
    return this.authService.logout(dto.refreshToken);
  }
}