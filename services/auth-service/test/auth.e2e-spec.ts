import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

jest.mock('bcrypt', () => ({
  hashSync: jest.fn(() => 'hashed'),
  compareSync: jest.fn(() => true),
}));

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let prisma: any;

  beforeEach(async () => {
    process.env.JWT_SECRET = 'test-secret-for-e2e';
    process.env.JWT_EXPIRATION = '15m';

    const mockPrisma = {
      user: {
        create: jest.fn(),
        findUnique: jest.fn(),
      },
      refreshToken: {
        create: jest.fn().mockResolvedValue({ id: 'token-id' }),
        update: jest.fn().mockResolvedValue({}),
        findUnique: jest.fn(),
        deleteMany: jest.fn().mockResolvedValue({}),
      },
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrisma)
      .compile();

    app = moduleFixture.createNestApplication();
    prisma = mockPrisma;
    
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  const registerDto = {
    username: 'testuser',
    email: 'test@example.com',
    password: 'password123',
  };

  it('/auth/register (POST)', async () => {
    prisma.user.create.mockResolvedValue({
      id: 'user-id',
      username: registerDto.username,
      email: registerDto.email,
      passwordHash: 'hashed',
      roles: ['user'],
    });

    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send(registerDto)
      .expect(201);

    expect(res.body.id).toBeDefined();
    expect(res.body.email).toEqual(registerDto.email);
  });

  it('/auth/register (POST) - Duplicate Email', async () => {
    const { PrismaClientKnownRequestError } = require('@prisma/client');
    prisma.user.create.mockRejectedValue(
      new PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '5.0.0',
      })
    );

    await request(app.getHttpServer())
      .post('/auth/register')
      .send(registerDto)
      .expect(409);
  });

  it('/auth/login (POST)', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-id',
      username: registerDto.username,
      email: registerDto.email,
      passwordHash: 'hashedpassword',
      roles: ['user'],
    });

    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: registerDto.username, password: registerDto.password })
      .expect(200);

    expect(res.body.access_token).toBeDefined();
    expect(res.body.refresh_token).toBeDefined();
  });

  it('/auth/login (POST) - Invalid Credentials', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: registerDto.username, password: 'wrongpassword' })
      .expect(401);
  });
});
