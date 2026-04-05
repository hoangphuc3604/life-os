import { ConflictException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { OtpService } from '../otp/otp.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly otpService: OtpService,
  ) {}

  async register(registerUserDto: RegisterUserDto) {
    const { password, ...userData } = registerUserDto;

    const existingUser = await this.prisma.user.findUnique({
      where: { email: userData.email },
    });

    if (existingUser) {
      if (!existingUser.isEmailVerified) {
        await this.otpService.generateAndSendOtp(userData.email, 'register');
        return { message: 'Verification email sent. Please check your inbox.' };
      }
      throw new ConflictException('User already exists');
    }

    try {
      const user = await this.prisma.user.create({
        data: {
          ...userData,
          passwordHash: bcrypt.hashSync(password, 10),
          roles: ['user'],
        },
      });

      await this.otpService.generateAndSendOtp(user.email, 'register');

      const { passwordHash, ...result } = user;
      return { ...result, message: 'Verification email sent. Please check your inbox.' };
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException('User already exists');
      }
      throw new InternalServerErrorException();
    }
  }

  async validateUser(username: string, pass: string) {
    const user = await this.prisma.user.findUnique({ where: { username } });
    if (user && bcrypt.compareSync(pass, user.passwordHash)) {
      const { passwordHash, ...result } = user;
      return result;
    }
    return null;
  }

  async login(loginUserDto: LoginUserDto) {
    const user = await this.validateUser(loginUserDto.username, loginUserDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokenPayload = { email: user.email, sub: user.id, roles: user.roles };

    const refreshTokenEntity = await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: 'pending',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const accessToken = this.jwtService.sign(tokenPayload);

    const refreshTokenPayload = { ...tokenPayload, jti: refreshTokenEntity.id };
    const refreshToken = this.jwtService.sign(refreshTokenPayload, { expiresIn: '7d' });

    await this.prisma.refreshToken.update({
      where: { id: refreshTokenEntity.id },
      data: { tokenHash: bcrypt.hashSync(refreshToken, 10) },
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken);
      const tokenId = payload.jti;

      if (!tokenId) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const tokenEntity = await this.prisma.refreshToken.findUnique({ where: { id: tokenId } });

      if (!tokenEntity) {
        throw new UnauthorizedException('Refresh token not found');
      }

      if (tokenEntity.revoked) {
        throw new UnauthorizedException('Refresh token revoked');
      }

      const isMatch = bcrypt.compareSync(refreshToken, tokenEntity.tokenHash);
      if (!isMatch) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      if (new Date() > tokenEntity.expiresAt) {
        throw new UnauthorizedException('Refresh token expired');
      }

      await this.prisma.refreshToken.update({
        where: { id: tokenId },
        data: { revoked: true },
      });

      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      const newPayload = { email: user.email, sub: user.id, roles: user.roles };
      const newAccessToken = this.jwtService.sign(newPayload);

      const newRefreshTokenEntity = await this.prisma.refreshToken.create({
        data: {
          userId: user.id,
          tokenHash: 'pending',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      const newRefreshTokenPayload = { ...newPayload, jti: newRefreshTokenEntity.id };
      const newRefreshToken = this.jwtService.sign(newRefreshTokenPayload, { expiresIn: '7d' });

      await this.prisma.refreshToken.update({
        where: { id: newRefreshTokenEntity.id },
        data: { tokenHash: bcrypt.hashSync(newRefreshToken, 10) },
      });

      return {
        access_token: newAccessToken,
        refresh_token: newRefreshToken,
      };
    } catch (e) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken);
      const tokenId = payload.jti;

      if (tokenId) {
        await this.prisma.refreshToken.update({
          where: { id: tokenId },
          data: { revoked: true },
        });
      }
    } catch (e) {
    }
    return { message: 'Logged out' };
  }
}
