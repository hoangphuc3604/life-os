import { ConflictException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { User } from '../entities/user.entity';
import { RefreshToken } from '../entities/refresh-token.entity';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerUserDto: RegisterUserDto) {
    const { password, ...userData } = registerUserDto;

    try {
      const user = this.userRepository.create({
        ...userData,
        password_hash: bcrypt.hashSync(password, 10),
      });

      await this.userRepository.save(user);
      const { password_hash, ...result } = user;
      
      return result;
    } catch (error) {
      if (error.code === '23505') {
        throw new ConflictException('User already exists');
      }
      throw new InternalServerErrorException();
    }
  }

  async validateUser(email: string, pass: string): Promise<User | null> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (user && bcrypt.compareSync(pass, user.password_hash)) {
      return user;
    }
    return null;
  }

  async login(loginUserDto: LoginUserDto) {
    const user = await this.validateUser(loginUserDto.email, loginUserDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokenPayload = { email: user.email, sub: user.id, roles: user.roles };
    
    // Create Refresh Token entity first to get the ID (jti)
    const refreshTokenEntity = this.refreshTokenRepository.create({
      user_id: user.id,
      token_hash: 'pending', // Temporary, will update after signing
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });
    
    const savedToken = await this.refreshTokenRepository.save(refreshTokenEntity);

    // Sign Access Token
    const accessToken = this.jwtService.sign(tokenPayload);
    
    // Sign Refresh Token including the JTI (entity ID)
    const refreshTokenPayload = { ...tokenPayload, jti: savedToken.id };
    const refreshToken = this.jwtService.sign(refreshTokenPayload, { expiresIn: '7d' });

    // Update entity with the hash of the actual signed token
    savedToken.token_hash = bcrypt.hashSync(refreshToken, 10);
    await this.refreshTokenRepository.save(savedToken);

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

      const tokenEntity = await this.refreshTokenRepository.findOne({ where: { id: tokenId } });

      if (!tokenEntity) {
        throw new UnauthorizedException('Refresh token not found');
      }

      if (tokenEntity.revoked) {
        // Potential security event: reuse of revoked token! 
        // In a real app, we might want to revoke all user tokens here.
        throw new UnauthorizedException('Refresh token revoked'); 
      }

      const isMatch = bcrypt.compareSync(refreshToken, tokenEntity.token_hash);
      if (!isMatch) {
         throw new UnauthorizedException('Invalid refresh token');
      }

      // Check for expiry (although jwt verify handles this, DB might have different rules)
      if (new Date() > tokenEntity.expires_at) {
        throw new UnauthorizedException('Refresh token expired');
      }

      // Token Rotation: Revoke the used token
      tokenEntity.revoked = true;
      await this.refreshTokenRepository.save(tokenEntity);

      // Issue new tokens
      const user = await this.userRepository.findOne({ where: { id: payload.sub } });
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Reuse login logic or duplicate simplified logic here?
      // Simplified logic for new token generation to avoid infinite recursion or overhead:
      
      const newPayload = { email: user.email, sub: user.id, roles: user.roles };
      const newAccessToken = this.jwtService.sign(newPayload);
      
      const newRefreshTokenEntity = this.refreshTokenRepository.create({
        user_id: user.id,
        token_hash: 'pending',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
      const savedNewToken = await this.refreshTokenRepository.save(newRefreshTokenEntity);
      
      const newRefreshTokenPayload = { ...newPayload, jti: savedNewToken.id };
      const newRefreshToken = this.jwtService.sign(newRefreshTokenPayload, { expiresIn: '7d' });
      
      savedNewToken.token_hash = bcrypt.hashSync(newRefreshToken, 10);
      await this.refreshTokenRepository.save(savedNewToken);

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
      // We decode instead of verify because even if it's expired, we might want to ensure it's revoked in DB
      // But verify is safer to ensure it's our token. 
      // Let's use verify but ignore expiration if possible, or just catch error.
      // For simple logout, if it's expired, it's already useless, so verify is fine.
      const payload = this.jwtService.verify(refreshToken);
      const tokenId = payload.jti;

      if (tokenId) {
        await this.refreshTokenRepository.update(tokenId, { revoked: true });
      }
    } catch (e) {
      // If token is invalid/expired, logout is effectively done or irrelevant
    }
    return { message: 'Logged out' };
  }
}
