import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash, randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshDto } from './dto/refresh.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    // stop if the email is already used
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    // scramble the password before saving
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // free plan lasts 30 days from now
    const periodEnd = new Date();
    periodEnd.setDate(periodEnd.getDate() + 30);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        password: hashedPassword,
        role: {
          connectOrCreate: { where: { name: 'USER' }, create: { name: 'USER' } },
        },
        subscription: { create: { periodEnd } },
      },
    });

    // never send the password back
    return { id: user.id, email: user.email, name: user.name };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { role: true },
    });

    // same message for wrong email and wrong password
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const passwordOk = await bcrypt.compare(dto.password, user.password);
    if (!passwordOk) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.createTokens(user.id, user.email, user.role.name);
  }
  async refresh(dto: RefreshDto) {
    let payload: { sub: number; email: string; role: string };
    try {
      payload = await this.jwtService.verifyAsync(dto.refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokenHash = createHash('sha256').update(dto.refreshToken).digest('hex');
    const session = await this.prisma.session.findFirst({
      where: { userId: payload.sub, refreshToken: tokenHash },
    });
    if (!session || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // old session is replaced by a new one (rotation)
    await this.prisma.session.delete({ where: { id: session.id } });
    return this.createTokens(payload.sub, payload.email, payload.role);
  }

  async logout(refreshToken: string) {
    const tokenHash = createHash('sha256').update(refreshToken).digest('hex');
    await this.prisma.session.deleteMany({ where: { refreshToken: tokenHash } });
    return { message: 'Logged out' };
  }
  // makes both tokens and saves a session row
  private async createTokens(userId: number, email: string, role: string) {
    const payload = { sub: userId, email, role };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: '15m',
    });

    // jwtid makes every refresh token unique
    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: '7d',
      jwtid: randomUUID(),
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.session.create({
      data: {
        userId,
        refreshToken: createHash('sha256').update(refreshToken).digest('hex'),
        expiresAt,
      },
    });

    return { accessToken, refreshToken };
  }
}