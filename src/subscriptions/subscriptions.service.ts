import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const PLAN_LIMITS = { FREE: 50, PREMIUM: 1000 };

@Injectable()
export class SubscriptionsService {
  constructor(private prisma: PrismaService) {}

  async getStatus(userId: number) {
    const sub = await this.prisma.subscription.findUnique({
      where: { userId },
    });
    if (!sub) throw new NotFoundException('Subscription not found');
    return {
      plan: sub.plan,
      status: sub.status,
      requestLimit: sub.requestLimit,
      requestsUsed: sub.requestsUsed,
      remainingRequests: sub.requestLimit - sub.requestsUsed,
      periodEnd: sub.periodEnd,
    };
  }

  async upgrade(userId: number) {
    const sub = await this.prisma.subscription.update({
      where: { userId },
      data: { plan: 'PREMIUM', requestLimit: PLAN_LIMITS.PREMIUM },
    });
    return { message: 'Upgraded to PREMIUM', plan: sub.plan };
  }

  async downgrade(userId: number) {
    const sub = await this.prisma.subscription.update({
      where: { userId },
      data: { plan: 'FREE', requestLimit: PLAN_LIMITS.FREE },
    });
    return { message: 'Downgraded to FREE', plan: sub.plan };
  }
}