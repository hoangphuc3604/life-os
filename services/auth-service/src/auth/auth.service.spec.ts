import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt', () => ({
  hashSync: jest.fn(),
  compareSync: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let prisma: {
    user: {
      create: jest.Mock;
      findUnique: jest.Mock;
    };
    refreshToken: {
      create: jest.Mock;
      update: jest.Mock;
      findUnique: jest.Mock;
    };
  };
  let jwtService: {
    sign: jest.Mock;
    verify: jest.Mock;
  };

  const mockUser = {
    id: 'user-id',
    email: 'test@example.com',
    passwordHash: 'hashedpassword',
    roles: ['user'],
    username: 'testuser',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRefreshToken = {
    id: 'token-id',
    userId: 'user-id',
    tokenHash: 'hashedrefreshtoken',
    revoked: false,
    expiresAt: new Date(Date.now() + 100000),
  };

  beforeEach(async () => {
    (bcrypt.hashSync as jest.Mock).mockReturnValue('hashed_password');
    (bcrypt.compareSync as jest.Mock).mockReturnValue(true);

    prisma = {
      user: {
        create: jest.fn(),
        findUnique: jest.fn(),
      },
      refreshToken: {
        create: jest.fn(),
        update: jest.fn(),
        findUnique: jest.fn(),
      },
    };

    jwtService = {
      sign: jest.fn().mockReturnValue('token'),
      verify: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
        {
          provide: JwtService,
          useValue: jwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should successfully register a user', async () => {
      prisma.user.create.mockResolvedValue(mockUser);

      const result = await service.register({ email: 'test@example.com', password: 'password', username: 'testuser' });

      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ roles: ['user'] }) }),
      );
      expect(result).toEqual(expect.objectContaining({ email: 'test@example.com' }));
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('should throw ConflictException if user exists', async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '5.0.0',
      });
      prisma.user.create.mockRejectedValue(prismaError);

      await expect(service.register({ email: 'test@example.com', password: 'password', username: 'testuser' })).rejects.toThrow(ConflictException);
    });
  });

  describe('validateUser', () => {
    it('should return user if credentials match', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.validateUser('testuser', 'password');
      expect(result).toEqual(expect.objectContaining({ id: 'user-id' }));
    });

    it('should return null if password mismatch', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compareSync as jest.Mock).mockReturnValue(false);

      const result = await service.validateUser('testuser', 'wrongpassword');
      expect(result).toBeNull();
    });

    it('should return null if user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await service.validateUser('testuser', 'password');
      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return access and refresh tokens', async () => {
      jest.spyOn(service, 'validateUser').mockResolvedValue(mockUser);
      prisma.refreshToken.create.mockResolvedValue(mockRefreshToken);

      const result = await service.login({ username: 'testuser', password: 'password' });

      expect(result).toEqual({
        access_token: 'token',
        refresh_token: 'token',
      });
    });

    it('should throw UnauthorizedException if validation fails', async () => {
      jest.spyOn(service, 'validateUser').mockResolvedValue(null);

      await expect(service.login({ username: 'a', password: 'b' })).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refresh', () => {
    it('should rotate tokens successfully', async () => {
      jwtService.verify.mockReturnValue({ jti: 'token-id', sub: 'user-id', email: 'test@example.com', roles: ['user'] });
      prisma.refreshToken.findUnique.mockResolvedValue(mockRefreshToken);
      (bcrypt.compareSync as jest.Mock).mockReturnValue(true);
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.refreshToken.create.mockResolvedValue(mockRefreshToken);

      const result = await service.refresh('refresh-token');

      expect(result).toEqual({
        access_token: 'token',
        refresh_token: 'token',
      });
    });

    it('should throw if refresh token is revoked', async () => {
      jwtService.verify.mockReturnValue({ jti: 'token-id' });
      prisma.refreshToken.findUnique.mockResolvedValue({ ...mockRefreshToken, revoked: true });

      await expect(service.refresh('token')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw if refresh token not found', async () => {
      jwtService.verify.mockReturnValue({ jti: 'token-id' });
      prisma.refreshToken.findUnique.mockResolvedValue(null);

      await expect(service.refresh('token')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('should revoke the refresh token', async () => {
      jwtService.verify.mockReturnValue({ jti: 'token-id' });

      await service.logout('token');
      expect(prisma.refreshToken.update).toHaveBeenCalledWith({
        where: { id: 'token-id' },
        data: { revoked: true },
      });
    });
  });
});
