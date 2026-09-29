import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtGuard } from '../auth/jwt/jwt.guard';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import type { Request } from 'express';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  getProfile(@Req() req: Request) {
    return this.usersService.getProfile((req as any).user.sub);
  }

  @Patch('me')
  updateProfile(@Req() req: Request, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile((req as any).user.sub, dto);
  }

  @Patch('me/password')
  changePassword(@Req() req: Request, @Body() dto: ChangePasswordDto) {
    return this.usersService.changePassword((req as any).user.sub, dto);
  }

  @Delete('me')
  deleteAccount(@Req() req: Request) {
    return this.usersService.deleteAccount((req as any).user.sub);
  }
}