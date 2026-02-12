import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { RefreshToken } from '../entities/refresh-token.entity';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';

// Mock bcrypt completely to avoid import * issues with spyOn
jest.mock('bcrypt', () => ({
  hashSync: jest.fn(),
  compareSync: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: {
    create: jest.Mock;
    save: jest.Mock;
    findOne: jest.Mock;
  };
  let refreshTokenRepository: {
    create: jest.Mock;
    save: jest.Mock;
    findOne: jest.Mock;
    update: jest.Mock;
  };
  let jwtService: {
    sign: jest.Mock;
    verify: jest.Mock;
  };

  const mockUser = {
    id: 'user-id',
    email: 'test@example.com',
    password_hash: 'hashedpassword',
    roles: ['user'],
  } as unknown as User;

  const mockRefreshToken = {
    id: 'token-id',
    user_id: 'user-id',
    token_hash: 'hashedrefreshtoken',
    revoked: false,
    expires_at: new Date(Date.now() + 100000), // Future
  } as unknown as RefreshToken;

  beforeEach(async () => {
    // Reset mocks default behavior
    (bcrypt.hashSync as jest.Mock).mockReturnValue('hashed_password');
    (bcrypt.compareSync as jest.Mock).mockReturnValue(true);

    userRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
    };

    refreshTokenRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
    };

    jwtService = {
      sign: jest.fn().mockReturnValue('token'),
      verify: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: userRepository,
        },
        {
          provide: getRepositoryToken(RefreshToken),
          useValue: refreshTokenRepository,
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
      const dto = { email: 'test@example.com', password: 'password', username: 'testuser' };
      userRepository.create.mockReturnValue(mockUser);
      userRepository.save.mockResolvedValue(mockUser);
      
      const result = await service.register(dto);
      
      expect(userRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ roles: ['user'] }),
      );
      expect(userRepository.save).toHaveBeenCalled();
      expect(result).toEqual(expect.objectContaining({ email: 'test@example.com' }));
      expect(result).not.toHaveProperty('password_hash');
    });

    it('should throw ConflictException if user exists', async () => {
      const dto = { email: 'test@example.com', password: 'password', username: 'testuser' };
      userRepository.create.mockReturnValue(mockUser);
      const error = Object.assign(new Error('Conflict'), { code: '23505' });
      userRepository.save.mockRejectedValue(error);

      await expect(service.register(dto)).rejects.toThrow(ConflictException);
    });

    it('should throw InternalServerErrorException on other errors', async () => {
      const dto = { email: 'test@example.com', password: 'password', username: 'testuser' };
      userRepository.create.mockReturnValue(mockUser);
      userRepository.save.mockRejectedValue(new Error('DB Error'));

      await expect(service.register(dto)).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('validateUser', () => {
    it('should return user if credentials match', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);
      (bcrypt.compareSync as jest.Mock).mockReturnValue(true);

      const result = await service.validateUser('testuser', 'password');
      expect(result).toEqual(mockUser);
    });

    it('should return null if password mismatch', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);
      (bcrypt.compareSync as jest.Mock).mockReturnValue(false);

      const result = await service.validateUser('testuser', 'wrongpassword');
      expect(result).toBeNull();
    });

    it('should return null if user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);
      const result = await service.validateUser('testuser', 'password');
      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return access and refresh tokens', async () => {
      const loginDto = { username: 'testuser', password: 'password' };
      // Spy on validateUser since it's a method on the same class
      jest.spyOn(service, 'validateUser').mockResolvedValue(mockUser);
      
      refreshTokenRepository.create.mockReturnValue(mockRefreshToken);
      refreshTokenRepository.save.mockResolvedValue(mockRefreshToken); // Initial save
      
      // We expect a second save for token hash, make sure it resolves too
      refreshTokenRepository.save.mockResolvedValue(mockRefreshToken); 
      
      jwtService.sign.mockReturnValue('signed-token');
      (bcrypt.hashSync as jest.Mock).mockReturnValue('hashed-token');

      const result = await service.login(loginDto);
      
      expect(result).toEqual({
        access_token: 'signed-token',
        refresh_token: 'signed-token',
      });
      // Initial save + update with hash = 2 saves
      expect(refreshTokenRepository.save).toHaveBeenCalledTimes(2);
    });

    it('should throw UnauthorizedException if validation fails', async () => {
      jest.spyOn(service, 'validateUser').mockResolvedValue(null);
      await expect(service.login({ username: 'a', password: 'b' })).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refresh', () => {
    it('should rotate tokens successfully', async () => {
      jwtService.verify.mockReturnValue({ jti: 'token-id', sub: 'user-id' });
      refreshTokenRepository.findOne.mockResolvedValue(mockRefreshToken);
      (bcrypt.compareSync as jest.Mock).mockReturnValue(true);
      userRepository.findOne.mockResolvedValue(mockUser);
      
      refreshTokenRepository.create.mockReturnValue(mockRefreshToken);
      refreshTokenRepository.save.mockResolvedValue(mockRefreshToken);
      jwtService.sign.mockReturnValue('new-token');

      const result = await service.refresh('refresh-token');

      expect(result).toEqual({
        access_token: 'new-token',
        refresh_token: 'new-token',
      });
      expect(mockRefreshToken.revoked).toBe(true);
      expect(refreshTokenRepository.save).toHaveBeenCalled();
    });

    it('should throw if refresh token is revoked', async () => {
       jwtService.verify.mockReturnValue({ jti: 'token-id' });
       const revokedToken = { ...mockRefreshToken, revoked: true };
       refreshTokenRepository.findOne.mockResolvedValue(revokedToken);
       
       await expect(service.refresh('token')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw if refresh token hash mismatch', async () => {
      jwtService.verify.mockReturnValue({ jti: 'token-id' });
      refreshTokenRepository.findOne.mockResolvedValue(mockRefreshToken);
      (bcrypt.compareSync as jest.Mock).mockReturnValue(false);

      await expect(service.refresh('token')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw if refresh token is expired', async () => {
      jwtService.verify.mockReturnValue({ jti: 'token-id' });
      const expiredToken = { ...mockRefreshToken, expires_at: new Date(Date.now() - 1000) };
      refreshTokenRepository.findOne.mockResolvedValue(expiredToken);
      (bcrypt.compareSync as jest.Mock).mockReturnValue(true);

      await expect(service.refresh('token')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw if user not found', async () => {
      jwtService.verify.mockReturnValue({ jti: 'token-id', sub: 'user-id' });
      refreshTokenRepository.findOne.mockResolvedValue(mockRefreshToken);
      (bcrypt.compareSync as jest.Mock).mockReturnValue(true);
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.refresh('token')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw if refresh token not found in DB', async () => {
      jwtService.verify.mockReturnValue({ jti: 'token-id' });
      refreshTokenRepository.findOne.mockResolvedValue(null);

      await expect(service.refresh('token')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw if token payload has no jti', async () => {
      jwtService.verify.mockReturnValue({ sub: 'user-id' }); // No jti

      await expect(service.refresh('token')).rejects.toThrow(UnauthorizedException);
    });

    it('should catch generic errors during refresh', async () => {
      jwtService.verify.mockImplementation(() => { throw new Error('Verify failed'); });
      await expect(service.refresh('token')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('should revoke the refresh token', async () => {
      jwtService.verify.mockReturnValue({ jti: 'token-id' });
      // auth.service.ts logout calls: update(tokenId, { revoked: true })
      await service.logout('token');
      expect(refreshTokenRepository.update).toHaveBeenCalledWith('token-id', { revoked: true });
    });

    it('should handle errors gracefully during logout', async () => {
      jwtService.verify.mockImplementation(() => { throw new Error('Verify failed'); });
      await service.logout('token');
      // Should not throw
      expect(refreshTokenRepository.update).not.toHaveBeenCalled();
    });
  });
});
