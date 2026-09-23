import { ConflictException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

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
}