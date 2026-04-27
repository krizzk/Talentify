import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;
  const usersService = {
    findById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: usersService }],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    jest.clearAllMocks();
  });

  it('should return the current user shape', async () => {
    usersService.findById.mockResolvedValue({
      id: 'user-id',
      email: 'user@example.com',
      fullName: 'Budi Santoso',
      plan: 'free',
      createdAt: new Date('2026-04-16T00:00:00Z'),
    });

    const result = await controller.me('user-id');

    expect(result).toEqual({
      id: 'user-id',
      email: 'user@example.com',
      full_name: 'Budi Santoso',
      plan: 'free',
      created_at: '2026-04-16T00:00:00.000Z',
    });
  });
});
