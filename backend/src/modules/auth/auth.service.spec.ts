import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RefreshToken } from '../users/entities/refresh-token.entity';
import { UsersService } from '../users/users.service';
import { User, UserPlan } from '../users/entities/user.entity';
import * as bcrypt from 'bcrypt';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;
  const usersService = {
    findByEmail: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
  };
  const refreshRepo = {
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };
  const jwtService = {
    sign: jest.fn().mockReturnValue('jwt-token'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: JwtService, useValue: jwtService },
        { provide: UsersService, useValue: usersService },
        { provide: getRepositoryToken(RefreshToken), useValue: refreshRepo },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  it('should register a new user and return tokens', async () => {
    usersService.findByEmail.mockResolvedValue(null);
    usersService.create.mockImplementation(async (payload) => ({
      id: 'user-id',
      email: payload.email,
      fullName: payload.fullName,
      plan: payload.plan,
      passwordHash: payload.passwordHash,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
    refreshRepo.create.mockImplementation((payload) => payload);
    refreshRepo.save.mockImplementation(async (entity) => entity);

    const result = await service.register({
      email: 'user@example.com',
      password: 'Password123',
      full_name: 'Budi Santoso',
    });

    expect(result.access_token).toBe('jwt-token');
    expect(typeof result.refresh_token).toBe('string');
    expect(result.user).toEqual({
      id: 'user-id',
      email: 'user@example.com',
      full_name: 'Budi Santoso',
      plan: UserPlan.FREE,
    });
    expect(usersService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'user@example.com',
        fullName: 'Budi Santoso',
        plan: UserPlan.FREE,
      }),
    );
  });

  it('should throw when registering with duplicate email', async () => {
    usersService.findByEmail.mockResolvedValue({} as User);

    await expect(
      service.register({
        email: 'user@example.com',
        password: 'Password123',
        full_name: 'Budi Santoso',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should login a valid user', async () => {
    const passwordHash = await bcrypt.hash('Password123', 12);
    usersService.findByEmail.mockResolvedValue({
      id: 'user-id',
      email: 'user@example.com',
      fullName: 'Budi Santoso',
      passwordHash,
      plan: UserPlan.FREE,
    } as User);
    refreshRepo.create.mockImplementation((payload) => payload);
    refreshRepo.save.mockImplementation(async (entity) => entity);

    const result = await service.login({
      email: 'user@example.com',
      password: 'Password123',
    });

    expect(result.access_token).toBe('jwt-token');
    expect(result.user.email).toBe('user@example.com');
    expect(refreshRepo.save).toHaveBeenCalled();
  });

  it('should throw unauthorized when login email is invalid', async () => {
    usersService.findByEmail.mockResolvedValue(null);

    await expect(
      service.login({
        email: 'wrong@example.com',
        password: 'Password123',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should throw unauthorized when login password is invalid', async () => {
    const passwordHash = await bcrypt.hash('Password123', 12);
    usersService.findByEmail.mockResolvedValue({
      id: 'user-id',
      email: 'user@example.com',
      fullName: 'Budi Santoso',
      passwordHash,
      plan: UserPlan.FREE,
    } as User);

    await expect(
      service.login({
        email: 'user@example.com',
        password: 'WrongPassword',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should refresh access token with valid refresh token', async () => {
    const tokenHash = await bcrypt.hash('refresh-token', 12);
    refreshRepo.find.mockResolvedValue([
      {
        tokenHash,
        userId: 'user-id',
        expiresAt: new Date(Date.now() + 10000),
        revokedAt: null,
      },
    ]);
    usersService.findById.mockResolvedValue({
      id: 'user-id',
      email: 'user@example.com',
    } as User);

    const result = await service.refreshToken('refresh-token');

    expect(result).toEqual({ access_token: 'jwt-token' });
  });

  it('should throw unauthorized when refresh token is missing', async () => {
    await expect(service.refreshToken(null as unknown as string)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should throw unauthorized when refresh token is invalid', async () => {
    refreshRepo.find.mockResolvedValue([]);

    await expect(service.refreshToken('invalid-token')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should revoke refresh token on logout', async () => {
    const tokenHash = await bcrypt.hash('refresh-token', 12);
    const token = {
      tokenHash,
      userId: 'user-id',
      expiresAt: new Date(Date.now() + 10000),
      revokedAt: null,
      save: jest.fn(),
    };
    refreshRepo.find.mockResolvedValue([token]);
    refreshRepo.save.mockImplementation(async (entity) => entity);

    await service.logout('refresh-token');

    expect(refreshRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ revokedAt: expect.any(Date) }),
    );
  });
});
