import { Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtGuard } from '../auth/jwt/jwt.guard';
import { SubscriptionsService } from './subscriptions.service';

@ApiTags('subscriptions')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('subscription')
export class SubscriptionsController {
  constructor(private subscriptionsService: SubscriptionsService) {}

  @Get()
  getStatus(@Req() req: Request) {
    return this.subscriptionsService.getStatus((req as any).user.sub);
  }

  @Post('upgrade')
  upgrade(@Req() req: Request) {
    return this.subscriptionsService.upgrade((req as any).user.sub);
  }

  @Post('downgrade')
  downgrade(@Req() req: Request) {
    return this.subscriptionsService.downgrade((req as any).user.sub);
  }
}