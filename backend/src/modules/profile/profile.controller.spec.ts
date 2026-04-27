import { Test, TestingModule } from '@nestjs/testing';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';

describe('ProfileController', () => {
  let controller: ProfileController;
  let service: ProfileService;

  const mockProfile = {
    id: 'profile-1',
    userId: 'user-1',
    targetRole: 'Software Engineer',
    phone: '08123456789',
    location: 'Jakarta',
    summary: 'Experienced developer',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProfileController],
      providers: [
        {
          provide: ProfileService,
          useValue: {
            getByUserId: jest.fn().mockResolvedValue(mockProfile),
            upsert: jest.fn().mockResolvedValue(mockProfile),
          },
        },
      ],
    }).compile();

    controller = module.get<ProfileController>(ProfileController);
    service = module.get<ProfileService>(ProfileService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      const result = await controller.getProfile('user-1');
      expect(result).toEqual(mockProfile);
      expect(service.getByUserId).toHaveBeenCalledWith('user-1');
    });
  });

  describe('updateProfile', () => {
    it('should update and return profile', async () => {
      const dto = { target_role: 'Senior Developer' };
      const result = await controller.updateProfile('user-1', dto);
      expect(result).toEqual(mockProfile);
      expect(service.upsert).toHaveBeenCalledWith('user-1', dto);
    });
  });
});
