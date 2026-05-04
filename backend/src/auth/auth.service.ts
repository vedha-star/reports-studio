import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(name: string, email: string, password: string) {
    try {
      const existing = await this.prisma.user.findUnique({ where: { email } });
      if (existing) {
        throw new ConflictException(
          'An account with this email already exists.',
        );
      }
      const hashed = await bcrypt.hash(password, 10);
      const user = await this.prisma.user.create({
        data: { name, email, password: hashed },
      });
      const token = this.jwtService.sign({
        sub: user.id,
        email: user.email,
        role: user.role,
      });
      return {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      };
    } catch (error) {
      console.error('CRITICAL: Signup failed in AuthService:', error);
      throw error;
    }
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw new UnauthorizedException('Invalid email or password.');
    }
    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  async refresh(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
    return { token, user };
  }

  async updateProfile(userId: string, data: { name?: string; email?: string; preferences?: any }) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data,
    });
    return user;
  }

  async changePassword(userId: string, oldPass: string, newPass: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();

    const valid = await bcrypt.compare(oldPass, user.password);
    if (!valid) throw new BadRequestException('Invalid old password');

    const hashed = await bcrypt.hash(newPass, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashed },
    });
    return { success: true };
  }

  async deleteAccount(userId: string) {
    // Delete related data first
    await this.prisma.runHistory.deleteMany({ where: { userId } });
    await this.prisma.schedule.deleteMany({ where: { userId } });
    await this.prisma.report.deleteMany({ where: { authorId: userId } });
    
    await this.prisma.user.delete({ where: { id: userId } });
    return { success: true };
  }
}
