import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, CanActivate, ExecutionContext, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { AuthController } from '../src/modules/auth/auth.controller';
import { AuthService } from '../src/modules/auth/auth.service';
import { UsersController } from '../src/modules/users/users.controller';
import { UsersService } from '../src/modules/users/users.service';
import { JwtAuthGuard } from '../src/shared/guards/jwt-auth.guard';
import { ResponseInterceptor } from '../src/shared/interceptors/response.interceptor';
import { HttpExceptionFilter } from '../src/shared/filters/http-exception.filter';

class MockJwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    request.user = { id: 'user-id' };
    return true;
  }
}

describe('Auth E2E', () => {
  let app: INestApplication;
  const authService = {
    register: jest.fn(),
    login: jest.fn(),
    refreshToken: jest.fn(),
    logout: jest.fn(),
  };
  const usersService = {
    findById: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AuthController, UsersController],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: UsersService, useValue: usersService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useClass(MockJwtAuthGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalInterceptors(new ResponseInterceptor());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('/auth/register (POST) should return access token and set refresh cookie', async () => {
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

    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'user@example.com',
        password: 'Password123',
        full_name: 'Budi Santoso',
      })
      .expect(201);

    expect(response.body).toEqual({
      success: true,
      data: {
        access_token: 'jwt-token',
        user: {
          id: 'user-id',
          email: 'user@example.com',
          full_name: 'Budi Santoso',
          plan: 'free',
        },
      },
    });
    expect(response.headers['set-cookie']).toBeDefined();
    expect(response.headers['set-cookie'][0]).toContain('refresh_token=refresh-token');
  });

  it('/auth/login (POST) should return access token and set refresh cookie', async () => {
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

    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'user@example.com', password: 'Password123' })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.access_token).toBe('jwt-token');
    expect(response.headers['set-cookie']).toBeDefined();
  });

  it('/auth/refresh (POST) should return a new access token', async () => {
    authService.refreshToken.mockResolvedValue({ access_token: 'new-token' });

    const response = await request(app.getHttpServer())
      .post('/auth/refresh')
      .set('Cookie', ['refresh_token=refresh-token'])
      .expect(200);

    expect(response.body).toEqual({ success: true, data: { access_token: 'new-token' } });
  });

  it('/auth/logout (POST) should clear refresh cookie', async () => {
    authService.logout.mockResolvedValue(undefined);

    const response = await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Cookie', ['refresh_token=refresh-token'])
      .expect(200);

    expect(response.body).toEqual({ success: true, data: { message: 'Logged out successfully' } });
    expect(response.headers['set-cookie']).toBeDefined();
    expect(response.headers['set-cookie'][0]).toContain('refresh_token=');
  });

  it('/users/me (GET) should return current user data', async () => {
    usersService.findById.mockResolvedValue({
      id: 'user-id',
      email: 'user@example.com',
      fullName: 'Budi Santoso',
      plan: 'free',
      createdAt: new Date('2026-04-16T00:00:00Z'),
    });

    const response = await request(app.getHttpServer()).get('/users/me').expect(200);

    expect(response.body).toEqual({
      success: true,
      data: {
        id: 'user-id',
        email: 'user@example.com',
        full_name: 'Budi Santoso',
        plan: 'free',
        created_at: '2026-04-16T00:00:00.000Z',
      },
    });
  });
});
