import { PrismaClient } from '@prisma/client';
import { IUser, ICreateUserDto, IUpdateUserDto, IUserRepository } from '../interfaces/IUser';

export class UserRepository implements IUserRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: number): Promise<IUser | null> {
    const user = await this.prisma.user.findUnique({
      where: { id }
    });
    return user;
  }

  async findByEmail(email: string): Promise<IUser | null> {
    const user = await this.prisma.user.findUnique({
      where: { email }
    });
    return user;
  }

  async create(userData: ICreateUserDto): Promise<IUser> {
    // Password hashing should be handled by the service layer before calling this method
    const user = await this.prisma.user.create({
      data: userData
    });
    return user;
  }

  async update(id: number, userData: IUpdateUserDto): Promise<IUser> {
    const user = await this.prisma.user.update({
      where: { id },
      data: userData
    });
    return user;
  }

  async delete(id: number): Promise<void> {
    await this.prisma.user.delete({
      where: { id }
    });
  }

  async updateLastLogin(id: number): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { 
        lastLoginAt: new Date(),
        loginAttempts: 0, // Reset login attempts on successful login
        lockedUntil: null // Clear any lock
      }
    });
  }

  async incrementLoginAttempts(id: number): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { 
        loginAttempts: { increment: 1 }
      }
    });
  }

  async lockAccount(id: number, lockUntil: Date): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { 
        lockedUntil: lockUntil
      }
    });
  }

  async setPasswordResetToken(id: number, token: string, expires: Date): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { 
        passwordResetToken: token,
        passwordResetExpires: expires
      }
    });
  }

  async clearPasswordResetToken(id: number): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { 
        passwordResetToken: null,
        passwordResetExpires: null
      }
    });
  }

  async findByPasswordResetToken(token: string): Promise<IUser | null> {
    const user = await this.prisma.user.findFirst({
      where: { 
        passwordResetToken: token,
        passwordResetExpires: { gt: new Date() } // Token must not be expired
      }
    });
    return user;
  }

  async setRefreshToken(userId: number, refreshToken: string, expires: Date, family: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        refreshToken,
        refreshTokenExpires: expires,
        refreshTokenFamily: family
      }
    });
  }

  async clearRefreshToken(userId: number): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        refreshToken: null,
        refreshTokenExpires: null,
        refreshTokenFamily: null
      }
    });
  }

  async findByRefreshToken(refreshToken: string): Promise<IUser | null> {
    const user = await this.prisma.user.findFirst({
      where: {
        refreshToken,
        refreshTokenExpires: {
          gt: new Date()
        },
        isActive: true
      }
    });

    return user;
  }

  async revokeRefreshTokenFamily(family: string): Promise<void> {
    await this.prisma.user.updateMany({
      where: {
        refreshTokenFamily: family
      },
      data: {
        refreshToken: null,
        refreshTokenExpires: null,
        refreshTokenFamily: null
      }
    });
  }
}
