import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { RegisterAuthDto } from './dto/register-auth.dto';
import { LoginAuthDto } from './dto/login-auth.dto';
import { RefreshToken } from '../users/entities/refresh-token.entity';
import { Repository, IsNull, MoreThan } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserPlan } from '../users/entities/user.entity';
import { OAuth2Client } from 'google-auth-library';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    @InjectRepository(RefreshToken)
    private readonly refreshRepo: Repository<RefreshToken>,
  ) {}

  async register(dto: RegisterAuthDto) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new BadRequestException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.usersService.create({
      email: dto.email,
      passwordHash,
      fullName: dto.full_name,
      plan: UserPlan.FREE,
    });
    const accessToken = this.signAccessToken(user.id, user.email);
    const refreshToken = await this.createRefreshToken(user);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.fullName,
        public_slug: user.publicSlug,
        plan: user.plan,
        role: user.role,
      },
    };
  }

  async login(dto: LoginAuthDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const accessToken = this.signAccessToken(user.id, user.email);
    const refreshToken = await this.createRefreshToken(user);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.fullName,
        public_slug: user.publicSlug,
        plan: user.plan,
        role: user.role,
      },
    };
  }

  async refreshToken(cookieToken: string) {
    if (!cookieToken) {
      throw new UnauthorizedException('Refresh token not found');
    }

    const tokens = await this.refreshRepo.find({
      where: {
        revokedAt: IsNull(),
        expiresAt: MoreThan(new Date()),
      },
    });
    for (const token of tokens) {
      const match = await bcrypt.compare(cookieToken, token.tokenHash);
      if (match) {
        const user = await this.usersService.findById(token.userId);
        return { access_token: this.signAccessToken(user.id, user.email) };
      }
    }

    throw new UnauthorizedException('Refresh token is invalid');
  }

  async logout(cookieToken: string) {
    if (!cookieToken) {
      return;
    }
    const tokens = await this.refreshRepo.find({
      where: {
        revokedAt: IsNull(),
        expiresAt: MoreThan(new Date()),
      },
    });
    for (const token of tokens) {
      const match = await bcrypt.compare(cookieToken, token.tokenHash);
      if (match) {
        token.revokedAt = new Date();
        await this.refreshRepo.save(token);
      }
    }
  }

  async googleLogin(idToken: string) {
    try {
      const googleClientId = process.env.GOOGLE_CLIENT_ID;

      if (!googleClientId) {
        throw new Error('Google client ID not configured');
      }

      // Verifying an ID token only needs the Google client ID as audience.
      const client = new OAuth2Client(googleClientId);
      const ticket = await client.verifyIdToken({
        idToken,
        audience: googleClientId,
      });

      const payload = ticket.getPayload();
      if (!payload) {
        throw new Error('Invalid token payload');
      }

      const { email, name, picture, sub: googleId } = payload;

      if (!email) {
        throw new Error('Email not available from Google');
      }

      // Find or create user
      let user = await this.usersService.findByEmail(email);

      if (!user) {
        // Auto-create user from Google data
        user = await this.usersService.create({
          email,
          passwordHash: null, // OAuth user, no password
          fullName: name || email.split('@')[0],
          plan: UserPlan.FREE,
        });
      }

      // Generate tokens
      const accessToken = this.signAccessToken(user.id, user.email);
      const refreshToken = await this.createRefreshToken(user);

      return {
        access_token: accessToken,
        refresh_token: refreshToken,
        user: {
          id: user.id,
          email: user.email,
          full_name: user.fullName,
          public_slug: user.publicSlug,
          plan: user.plan,
          role: user.role,
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Google login failed';
      throw new UnauthorizedException(`Google authentication failed: ${message}`);
    }
  }

  private signAccessToken(userId: string, email: string) {
    return this.jwtService.sign({ sub: userId, email });
  }

  private async createRefreshToken(user: User) {
    const rawToken = `${user.id}.${Date.now()}.${Math.random().toString(36).slice(2)}`;
    const tokenHash = await bcrypt.hash(rawToken, 12);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const entity = this.refreshRepo.create({
      tokenHash,
      user,
      userId: user.id,
      expiresAt,
      revokedAt: null,
    });
    await this.refreshRepo.save(entity);
    return rawToken;
  }
}
