import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService;

  beforeEach(async () => {
    authService = {
      register: jest.fn(),
      login: jest.fn(),
      refresh: jest.fn(),
      logout: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should call authService.register', async () => {
      const dto = { username: 'testuser', email: 'test@example.com', password: 'password' };
      authService.register.mockResolvedValue({ id: '1', ...dto });
      
      const result = await controller.register(dto);
      
      expect(authService.register).toHaveBeenCalledWith(dto);
      expect(result).toEqual({ id: '1', ...dto });
    });
  });

  describe('login', () => {
    it('should call authService.login', async () => {
      const dto = { username: 'testuser', password: 'password' };
      const tokens = { access_token: 'access', refresh_token: 'refresh' };
      authService.login.mockResolvedValue(tokens);
      
      const result = await controller.login(dto);
      
      expect(authService.login).toHaveBeenCalledWith(dto);
      expect(result).toEqual(tokens);
    });
  });

  describe('refresh', () => {
    it('should call authService.refresh', async () => {
      const dto = { refresh_token: 'refresh' };
      const tokens = { access_token: 'new_access', refresh_token: 'new_refresh' };
      authService.refresh.mockResolvedValue(tokens);
      
      const result = await controller.refresh(dto);
      
      expect(authService.refresh).toHaveBeenCalledWith(dto.refresh_token);
      expect(result).toEqual(tokens);
    });
  });

  describe('logout', () => {
    it('should call authService.logout', async () => {
      const dto = { refresh_token: 'refresh' };
      authService.logout.mockResolvedValue({ message: 'Logged out' });
      
      const result = await controller.logout(dto);
      
      expect(authService.logout).toHaveBeenCalledWith(dto.refresh_token);
      expect(result).toEqual({ message: 'Logged out' });
    });
  });

  describe('getProfile', () => {
    it('should return user from request', () => {
      const req = { user: { id: 'user-id', email: 'test@example.com' } };
      const result = controller.getProfile(req);
      expect(result).toEqual(req.user);
    });
  });

  describe('validate', () => {
    it('should set headers and return undefined', () => {
      const req = { user: { userId: 'user-id', email: 'test@example.com' } };
      const res = { setHeader: jest.fn() } as any;
      
      const result = controller.validate(req, res);
      
      expect(res.setHeader).toHaveBeenCalledWith('X-User-Id', 'user-id');
      expect(res.setHeader).toHaveBeenCalledWith('X-User-Email', 'test@example.com');
      expect(result).toBeUndefined();
    });
  });
});
