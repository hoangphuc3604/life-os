import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { compileOtpEmailTemplate } from '../email/email.templates';
import { OtpType } from '../common/types/otp.types';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  private generateOtp(): string {
    return crypto.randomInt(100000, 999999).toString();
  }

  async generateAndSendOtp(email: string, type: OtpType = 'register'): Promise<void> {
    const code = this.generateOtp();
    const expiresMinutes = this.configService.get<number>('OTP_EXPIRATION_MINUTES') || 5;
    const expiresAt = new Date(Date.now() + expiresMinutes * 60 * 1000);

    const codeHash = await bcrypt.hash(code, 10);

    await this.prisma.otpCode.create({
      data: {
        email,
        codeHash,
        type,
        expiresAt,
      },
    });

    this.logger.log(`OTP sent to ${email} for type: ${type}`);

    const html = compileOtpEmailTemplate({
      otpCode: code,
      expiresMinutes,
      email,
    });

    await this.emailService.sendEmail(
      email,
      'Mã xác minh LifeOS - Verification Code',
      html,
    );
  }

  async verifyOtp(email: string, code: string, type: OtpType): Promise<void> {
    const record = await this.prisma.otpCode.findFirst({
      where: {
        email,
        type,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!record) {
      this.logger.warn(`OTP verification failed for ${email}: no valid record found`);
      throw new BadRequestException('Invalid or expired OTP code');
    }

    const isValid = await bcrypt.compare(code, record.codeHash);
    if (!isValid) {
      this.logger.warn(`OTP verification failed for ${email}: invalid code`);
      throw new BadRequestException('Invalid or expired OTP code');
    }

    await this.prisma.otpCode.delete({ where: { id: record.id } });

    if (type === 'register') {
      await this.prisma.user.update({
        where: { email },
        data: { isEmailVerified: true },
      });
    }

    this.logger.log(`OTP verified successfully for ${email}, type: ${type}`);
  }

  @Cron('0 0 * * *')
  async cleanupExpiredOtps(): Promise<void> {
    const result = await this.prisma.otpCode.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });
    if (result.count > 0) {
      this.logger.log(`Cleaned up ${result.count} expired OTP records`);
    }
  }
}
