import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { JwtSignOptions } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';

type TokenPayload = {
  sub: string;
  email: string;
  role: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const tokens = await this.issueTokens({
      sub: user.id,
      email: user.email,
      role: user.role.name,
    });

    await this.storeRefreshToken(user.id, tokens.refreshToken);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return {
      user: this.usersService.toPublicUser(user),
      ...tokens,
    };
  }

  async refresh(userId: string, refreshToken: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      include: { role: true },
    });

    if (!user?.refreshTokenHash || !user.isActive) {
      throw new ForbiddenException('Refresh token is not active');
    }

    const isRefreshTokenValid = await bcrypt.compare(
      refreshToken,
      user.refreshTokenHash,
    );

    if (!isRefreshTokenValid) {
      throw new ForbiddenException('Invalid refresh token');
    }

    const tokens = await this.issueTokens({
      sub: user.id,
      email: user.email,
      role: user.role.name,
    });

    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return tokens;
  }

  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: null },
    });

    return { message: 'Logged out successfully' };
  }

  async verifyRefreshToken(refreshToken: string) {
    try {
      return await this.jwtService.verifyAsync<TokenPayload>(refreshToken, {
        secret:
          this.configService.get<string>('JWT_REFRESH_SECRET') ??
          'change_this_refresh_secret',
      });
    } catch {
      throw new ForbiddenException('Invalid refresh token');
    }
  }

  private async issueTokens(payload: TokenPayload) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret:
          this.configService.get<string>('JWT_SECRET') ?? 'change_this_secret',
        expiresIn: (this.configService.get<string>('JWT_EXPIRES_IN') ??
          '1d') as JwtSignOptions['expiresIn'],
      }),
      this.jwtService.signAsync(payload, {
        secret:
          this.configService.get<string>('JWT_REFRESH_SECRET') ??
          'change_this_refresh_secret',
        expiresIn: (this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') ??
          '7d') as JwtSignOptions['expiresIn'],
      }),
    ]);

    return {
      tokenType: 'Bearer',
      accessToken,
      refreshToken,
    };
  }

  private async storeRefreshToken(userId: string, refreshToken: string) {
    const refreshTokenHash = await bcrypt.hash(refreshToken, 12);

    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash },
    });
  }
}
