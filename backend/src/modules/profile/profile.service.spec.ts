import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ProfileService } from './profile.service';
import { Profile } from './entities/profile.entity';
import { Education } from './entities/education.entity';
import { Experience } from './entities/experience.entity';
import { Skill } from './entities/skill.entity';
import { NotFoundException } from '@nestjs/common';

describe('ProfileService', () => {
  let service: ProfileService;
  let profileRepo: Repository<Profile>;
  let dataSource: DataSource;

  const mockProfile = {
    id: 'profile-1',
    userId: 'user-1',
    targetRole: 'Software Engineer',
    phone: '08123456789',
    location: 'Jakarta',
    summary: 'Experienced developer',
    educations: [],
    experiences: [],
    skills: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfileService,
        {
          provide: getRepositoryToken(Profile),
          useValue: {
            findOne: jest.fn().mockResolvedValue(mockProfile),
          },
        },
        {
          provide: getRepositoryToken(Education),
          useValue: {},
        },
        {
          provide: getRepositoryToken(Experience),
          useValue: {},
        },
        {
          provide: getRepositoryToken(Skill),
          useValue: {},
        },
        {
          provide: DataSource,
          useValue: {
            transaction: jest.fn((cb) => cb({
              findOne: jest.fn().mockResolvedValue(mockProfile),
              create: jest.fn().mockReturnValue(mockProfile),
              save: jest.fn().mockResolvedValue(mockProfile),
              delete: jest.fn().mockResolvedValue({ affected: 0 }),
            })),
          },
        },
      ],
    }).compile();

    service = module.get<ProfileService>(ProfileService);
    profileRepo = module.get<Repository<Profile>>(getRepositoryToken(Profile));
    dataSource = module.get<DataSource>(DataSource);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getByUserId', () => {
    it('should return profile for valid user', async () => {
      const result = await service.getByUserId('user-1');
      expect(result).toEqual(mockProfile);
      expect(profileRepo.findOne).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        relations: ['educations', 'experiences', 'skills'],
      });
    });

    it('should throw NotFoundException if profile not found', async () => {
      jest.spyOn(profileRepo, 'findOne').mockResolvedValueOnce(null);
      await expect(service.getByUserId('user-2')).rejects.toThrow(NotFoundException);
    });
  });

  describe('upsert', () => {
    it('should update existing profile', async () => {
      const dto = { target_role: 'Senior Developer', phone: '08987654321' };
      const result = await service.upsert('user-1', dto);
      expect(result).toEqual(mockProfile);
      expect(dataSource.transaction).toHaveBeenCalled();
    });

    it('should create new profile if not exists', async () => {
      const dto = { target_role: 'Frontend Developer' };
      const result = await service.upsert('user-2', dto);
      expect(result).toBeDefined();
    });
  });
});
