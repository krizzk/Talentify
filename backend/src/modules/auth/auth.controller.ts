import {
  Controller,
  Post,
  Body,
  Res,
  UseGuards,
  Req,
  HttpCode,
  BadRequestException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterAuthDto } from './dto/register-auth.dto';
import { LoginAuthDto } from './dto/login-auth.dto';
import type { Response, Request } from 'express';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private getCookieMaxAge(duration: string | undefined, fallbackMs: number) {
    if (!duration) {
      return fallbackMs;
    }

    const match = duration.trim().match(/^(\d+)(ms|s|m|h|d)$/i);
    if (!match) {
      return fallbackMs;
    }

    const value = Number(match[1]);
    const unit = match[2].toLowerCase();
    const multipliers: Record<string, number> = {
      ms: 1,
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };

    return value * (multipliers[unit] ?? 1);
  }

  private isSecureRequest(req: Request) {
    const forwardedProto = req.headers['x-forwarded-proto'];
    const proto = Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto;
    const cookieSecure = process.env.COOKIE_SECURE;

    if (cookieSecure === 'true') {
      return true;
    }

    if (cookieSecure === 'false') {
      return false;
    }

    return proto === 'https' || req.secure;
  }

  private setAuthCookies(req: Request, res: Response, tokens: { access_token: string; refresh_token: string }) {
    const secure = this.isSecureRequest(req);

    res.cookie('access_token', tokens.access_token, {
      httpOnly: true,
      secure,
      sameSite: 'strict',
      maxAge: this.getCookieMaxAge(process.env.JWT_EXPIRATION, 15 * 60 * 1000),
    });

    res.cookie('refresh_token', tokens.refresh_token, {
      httpOnly: true,
      secure,
      sameSite: 'strict',
      maxAge: this.getCookieMaxAge(process.env.JWT_REFRESH_EXPIRATION, 7 * 24 * 60 * 60 * 1000),
    });
  }

  private clearAuthCookies(req: Request, res: Response) {
    const secure = this.isSecureRequest(req);

    res.clearCookie('access_token', {
      httpOnly: true,
      sameSite: 'strict',
      secure,
    });

    res.clearCookie('refresh_token', {
      httpOnly: true,
      sameSite: 'strict',
      secure,
    });
  }

  @Post('register')
  @HttpCode(201)
  async register(
    @Body() dto: RegisterAuthDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.register(dto);
    this.setAuthCookies(req, res, result);
    return { access_token: result.access_token, user: result.user };
  }

  @Post('login')
  @HttpCode(200)
  async login(
    @Body() dto: LoginAuthDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(dto);
    this.setAuthCookies(req, res, result);
    return { access_token: result.access_token, user: result.user };
  }

  @Post('refresh')
  @HttpCode(200)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const cookieToken = req.cookies?.refresh_token;
    const result = await this.authService.refreshToken(cookieToken);
    res.cookie('access_token', result.access_token, {
      httpOnly: true,
      secure: this.isSecureRequest(req),
      sameSite: 'strict',
      maxAge: this.getCookieMaxAge(process.env.JWT_EXPIRATION, 15 * 60 * 1000),
    });
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(200)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const cookieToken = req.cookies?.refresh_token;
    await this.authService.logout(cookieToken);
    this.clearAuthCookies(req, res);
    return { message: 'Logged out successfully' };
  }

  @Post('google')
  @HttpCode(200)
  async googleLogin(
    @Body() body: { token: string },
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (!body.token) {
      throw new BadRequestException('No token provided');
    }

    const result = await this.authService.googleLogin(body.token);
    this.setAuthCookies(req, res, result);
    return { access_token: result.access_token, user: result.user };
  }
}
