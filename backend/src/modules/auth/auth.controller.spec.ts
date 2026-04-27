import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import type { Response } from 'express';

describe('AuthController', () => {
  let controller: AuthController;
  const authService = {
    register: jest.fn(),
    login: jest.fn(),
    refreshToken: jest.fn(),
    logout: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    jest.clearAllMocks();
  });

  it('should register and set refresh cookie', async () => {
    authService.register.mockResolvedValue({
      access_token: 'jwt-token',
      refresh_token: 'refresh-token',
      user: {
        id: 'user-id',
        email: 'user@example.com',
        full_name: 'Budi Santoso',
        plan: 'free',
      },
    });

    const res = {
      cookie: jest.fn(),
    } as unknown as Response;

    const result = await controller.register(
      {
        email: 'user@example.com',
        password: 'Password123',
        full_name: 'Budi Santoso',
      },
      res,
    );

    expect(res.cookie).toHaveBeenCalledWith('refresh_token', 'refresh-token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    expect(result).toEqual({
      access_token: 'jwt-token',
      user: {
        id: 'user-id',
        email: 'user@example.com',
        full_name: 'Budi Santoso',
        plan: 'free',
      },
    });
  });

  it('should login and set refresh cookie', async () => {
    authService.login.mockResolvedValue({
      access_token: 'jwt-token',
      refresh_token: 'refresh-token',
      user: {
        id: 'user-id',
        email: 'user@example.com',
        full_name: 'Budi Santoso',
        plan: 'free',
      },
    });

    const res = {
      cookie: jest.fn(),
    } as unknown as Response;

    const result = await controller.login(
      { email: 'user@example.com', password: 'Password123' },
      res,
    );

    expect(res.cookie).toHaveBeenCalled();
    expect(result.access_token).toBe('jwt-token');
  });

  it('should refresh token using cookie', async () => {
    authService.refreshToken.mockResolvedValue({ access_token: 'jwt-token' });

    const req = { cookies: { refresh_token: 'refresh-token' } } as any;
    const result = await controller.refresh(req);

    expect(result).toEqual({ access_token: 'jwt-token' });
  });

  it('should logout and clear cookie', async () => {
    authService.logout.mockResolvedValue(undefined);
    const res = {
      clearCookie: jest.fn(),
    } as unknown as Response;
    const req = { cookies: { refresh_token: 'refresh-token' } } as any;

    const result = await controller.logout(req, res);

    expect(authService.logout).toHaveBeenCalledWith('refresh-token');
    expect(res.clearCookie).toHaveBeenCalledWith('refresh_token', {
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
    });
    expect(result).toEqual({ message: 'Logged out successfully' });
  });
});
