import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, BadRequestException, CanActivate, ExecutionContext } from '@nestjs/common';
import request from 'supertest';
import { CVController } from '../src/modules/cv/cv.controller';
import { CVService } from '../src/modules/cv/cv.service';
import { JwtAuthGuard } from '../src/shared/guards/jwt-auth.guard';

class MockJwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    req.user = { id: 'test-user-id' };
    return true;
  }
}

describe('CV E2E (Mocked)', () => {
  let app: INestApplication;
  const userId = 'test-user-id';

  const mockCvService = {
    findAll: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue({
      id: 'cv-1',
      userId,
      title: 'Test CV',
      type: 'GENERATED',
      status: 'DRAFT',
    }),
    update: jest.fn().mockResolvedValue({
      id: 'cv-1',
      userId,
      title: 'Updated CV',
      status: 'PUBLISHED',
    }),
    remove: jest.fn().mockResolvedValue(undefined),
    generate: jest.fn().mockResolvedValue({
      id: 'cv-new',
      userId,
      title: 'New CV',
      type: 'GENERATED',
      status: 'DRAFT',
      content: { summary: 'Test summary' },
    }),
    tailor: jest.fn().mockResolvedValue({
      id: 'cv-tailored',
      userId,
      title: 'CV (Tailored)',
      type: 'TAILORED',
      status: 'DRAFT',
      parentCvId: 'cv-1',
    }),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [CVController],
      providers: [{ provide: CVService, useValue: mockCvService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useClass(MockJwtAuthGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/cv', () => {
    it('should list all CVs for user', async () => {
      mockCvService.findAll.mockResolvedValue([
        { id: 'cv-1', userId, title: 'CV 1' },
        { id: 'cv-2', userId, title: 'CV 2' },
      ]);

      const res = await request(app.getHttpServer()).get('/api/cv');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(2);
      expect(mockCvService.findAll).toHaveBeenCalled();
    });

    it('should call findAll with user ID', async () => {
      mockCvService.findAll.mockClear();
      await request(app.getHttpServer()).get('/api/cv');

      expect(mockCvService.findAll).toHaveBeenCalledWith(userId);
    });
  });

  describe('POST /api/cv/generate', () => {
    beforeEach(() => {
      mockCvService.generate.mockClear();
    });

    it('should generate a new CV', async () => {
      const res = await request(app.getHttpServer()).post('/api/cv/generate');

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.type).toBe('GENERATED');
      expect(mockCvService.generate).toHaveBeenCalledWith(userId);
    });

    it('should handle free tier limit error', async () => {
      mockCvService.generate.mockRejectedValueOnce(
        new BadRequestException('Batas CV generation untuk FREE plan'),
      );

      const res = await request(app.getHttpServer()).post('/api/cv/generate');

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Batas CV generation');
    });
  });

  describe('GET /api/cv/:id', () => {
    it('should retrieve a single CV', async () => {
      mockCvService.findOne.mockClear();
      const res = await request(app.getHttpServer()).get('/api/cv/cv-1');

      expect(res.status).toBe(200);
      expect(res.body.id).toBe('cv-1');
      expect(mockCvService.findOne).toHaveBeenCalledWith('cv-1', userId);
    });
  });

  describe('PUT /api/cv/:id', () => {
    it('should update a CV', async () => {
      mockCvService.update.mockClear();
      const res = await request(app.getHttpServer()).put('/api/cv/cv-1').send({
        title: 'Updated CV',
        status: 'PUBLISHED',
      });

      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Updated CV');
      expect(mockCvService.update).toHaveBeenCalledWith(
        'cv-1',
        userId,
        expect.any(Object),
      );
    });
  });

  describe('DELETE /api/cv/:id', () => {
    it('should delete a CV', async () => {
      mockCvService.remove.mockClear();
      const res = await request(app.getHttpServer()).delete('/api/cv/cv-1');

      expect(res.status).toBe(200);
      expect(mockCvService.remove).toHaveBeenCalledWith('cv-1', userId);
    });
  });

  describe('POST /api/cv/:id/tailor', () => {
    it('should tailor a CV', async () => {
      mockCvService.tailor.mockClear();
      const res = await request(app.getHttpServer())
        .post('/api/cv/cv-1/tailor')
        .send({
          job_description: 'Senior engineer role',
        });
2
      expect(res.status).toBe(201);
      expect(res.body.type).toBe('TAILORED');
      expect(res.body.parentCvId).toBe('cv-1');
      expect(mockCvService.tailor).toHaveBeenCalledWith(
        'cv-1',
        userId,
        expect.any(Object),
      );
    });
  });
});