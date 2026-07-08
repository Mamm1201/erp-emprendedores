import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import { createHmac, randomUUID, timingSafeEqual } from 'crypto';
import * as bcrypt from 'bcrypt';
import type { StringValue } from 'ms';
import { UserRole } from '../../generated/prisma/client';
import { UsersService } from '../users/users.service';

// ─── Tipos públicos ────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
}

interface JwtAccessPayload {
  sub: string;
  email: string;
  role: UserRole;
  jti: string;
}

interface JwtRefreshPayload {
  sub: string;
  jti: string;
}

// ─── Constante de sesión ───────────────────────────────────────────────────────
// Una única sesión activa por usuario. El refreshTokenHash se sobrescribe en
// cada login, invalidando la sesión anterior.
//
// Deuda técnica planificada:
//   - Rotación de refresh tokens (renovar hash en cada /auth/refresh)
//   - Múltiples sesiones simultáneas (tabla sessions con jti + deviceInfo)
//   - Consolidar clearRefreshCookie en logout(userId, res) para que el contrato
//     de cierre de sesión viva íntegramente en AuthService (actualmente el
//     controller llama logout() y clearRefreshCookie() por separado)
// Las tres son extensiones sin cambio en la interfaz pública de AuthService.

const REFRESH_COOKIE = 'refresh_token';
const REFRESH_COOKIE_PATH = '/auth/refresh';
const REFRESH_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  // ─── Métodos públicos ────────────────────────────────────────────────────────

  async validateUser(
    email: string,
    password: string,
  ): Promise<{ id: string; email: string; name: string; role: UserRole; isActive: boolean } | null> {
    const user = await this.usersService.findByEmail(email);

    // Mismo 401 para todos los casos — evita enumeración de usuarios
    if (!user || !user.isActive) return null;

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return null;

    return user;
  }

  async login(
    user: { id: string; email: string; name: string; role: UserRole; isActive: boolean },
    res: Response,
  ): Promise<{ accessToken: string }> {
    const { accessToken, refreshToken } = this.generateTokens(user);
    await this.usersService.storeRefreshTokenHash(user.id, this.hashRefreshToken(refreshToken));
    this.setRefreshCookie(res, refreshToken);
    return { accessToken };
  }

  async refresh(refreshToken: string): Promise<{ accessToken: string }> {
    let payload: JwtRefreshPayload;
    try {
      payload = this.jwtService.verify<JwtRefreshPayload>(refreshToken, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException();
    }

    const user = await this.usersService.findById(payload.sub);
    if (!user || !user.isActive) throw new UnauthorizedException();

    // null === usuario sin sesión activa (logout previo)
    if (!user.refreshTokenHash) throw new UnauthorizedException();

    const valid = this.verifyRefreshTokenHash(refreshToken, user.refreshTokenHash);
    if (!valid) throw new UnauthorizedException();

    const { accessToken } = this.generateTokens(user);
    return { accessToken };
  }

  async logout(userId: string): Promise<void> {
    await this.usersService.clearRefreshTokenHash(userId);
  }

  clearRefreshCookie(res: Response): void {
    res.clearCookie(REFRESH_COOKIE, { path: REFRESH_COOKIE_PATH });
  }

  // ─── Métodos privados ────────────────────────────────────────────────────────

  private generateTokens(user: {
    id: string;
    email: string;
    role: UserRole;
  }): { accessToken: string; refreshToken: string } {
    const accessPayload: JwtAccessPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      jti: randomUUID(),
    };

    const refreshPayload: JwtRefreshPayload = {
      sub: user.id,
      jti: randomUUID(),
    };

    const accessToken = this.jwtService.sign(accessPayload, {
      secret: this.configService.getOrThrow<string>('JWT_SECRET'),
      expiresIn: this.configService.getOrThrow<string>('JWT_EXPIRES_IN') as StringValue,
    });

    const refreshToken = this.jwtService.sign(refreshPayload, {
      secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.getOrThrow<string>('JWT_REFRESH_EXPIRES_IN') as StringValue,
    });

    return { accessToken, refreshToken };
  }

  // HMAC-SHA256: correcto para tokens de alta entropía.
  // timingSafeEqual previene timing attacks durante la comparación.
  private hashRefreshToken(token: string): string {
    return createHmac(
      'sha256',
      this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
    )
      .update(token)
      .digest('hex');
  }

  private verifyRefreshTokenHash(token: string, storedHash: string): boolean {
    const computed = this.hashRefreshToken(token);
    try {
      return timingSafeEqual(
        Buffer.from(computed, 'hex'),
        Buffer.from(storedHash, 'hex'),
      );
    } catch {
      return false;
    }
  }

  private setRefreshCookie(res: Response, token: string): void {
    res.cookie(REFRESH_COOKIE, token, {
      httpOnly: true,
      secure: this.configService.get<string>('COOKIE_SECURE') === 'true',
      sameSite: (this.configService.get<string>('COOKIE_SAME_SITE') ?? 'lax') as
        | 'lax'
        | 'strict'
        | 'none',
      domain: this.configService.get<string>('COOKIE_DOMAIN') || undefined,
      maxAge: REFRESH_MAX_AGE_MS,
      path: REFRESH_COOKIE_PATH,
    });
  }
}
