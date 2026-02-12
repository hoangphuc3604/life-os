import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../src/entities/user.entity';
import { RefreshToken } from '../src/entities/refresh-token.entity';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let userRepository;
  let refreshTokenRepository;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    userRepository = moduleFixture.get(getRepositoryToken(User));
    refreshTokenRepository = moduleFixture.get(getRepositoryToken(RefreshToken));

    // Cleanup before tests
    await refreshTokenRepository.query('DELETE FROM refresh_token');
    await userRepository.query('DELETE FROM "user"');
  });

  afterAll(async () => {
    await app.close();
  });

  const registerDto = {
    username: 'testuser',
    email: 'test@example.com',
    password: 'password123',
  };

  it('/auth/register (POST)', () => {
    return request(app.getHttpServer())
      .post('/auth/register')
      .send(registerDto)
      .expect(201)
      .expect((res) => {
        expect(res.body.id).toBeDefined();
        expect(res.body.email).toEqual(registerDto.email);
        expect(res.body.password_hash).toBeUndefined();
      });
  });

  it('/auth/register (POST) - Duplicate Email', async () => {
    await request(app.getHttpServer()).post('/auth/register').send(registerDto);

    return request(app.getHttpServer())
      .post('/auth/register')
      .send(registerDto)
      .expect(409);
  });

  it('/auth/login (POST)', async () => {
    await request(app.getHttpServer()).post('/auth/register').send(registerDto);

    return request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: registerDto.email, password: registerDto.password })
      .expect(201) // Login usually returns 201 or 200 depending on controller
      .expect((res) => {
        expect(res.body.access_token).toBeDefined();
        expect(res.body.refresh_token).toBeDefined();
      });
  });

  it('/auth/login (POST) - Invalid Credentials', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: registerDto.email, password: 'wrongpassword' })
      .expect(401);
  });

  it('Full Flow: Register -> Login -> Refresh -> Profile -> Logout', async () => {
    // 1. Register
    await request(app.getHttpServer()).post('/auth/register').send(registerDto).expect(201);

    // 2. Login
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: registerDto.email, password: registerDto.password })
      .expect(201);

    const { access_token, refresh_token } = loginRes.body;

    // 3. Get Profile (Protected)
    await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${access_token}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.email).toEqual(registerDto.email);
      });

    // 4. Refresh Token
    const refreshRes = await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refresh_token })
      .expect(201);

    const { access_token: newAccessToken, refresh_token: newRefreshToken } = refreshRes.body;
    expect(newAccessToken).toBeDefined();
    expect(newRefreshToken).toBeDefined();

    // 5. Logout
    await request(app.getHttpServer())
      .post('/auth/logout')
      .send({ refresh_token: newRefreshToken }) // Use new refresh token
      .expect(201);

    // 6. Try to refresh again (should fail because revoked)
    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refresh_token: newRefreshToken })
      .expect(401);
  });
});
