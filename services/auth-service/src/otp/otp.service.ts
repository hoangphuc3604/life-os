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

  async generateAndSendOtp(email: string, type: OtpType = 'register', userId?: string): Promise<void> {
    const code = this.generateOtp();
    const expiresMinutes = this.configService.get<number>('OTP_EXPIRATION_MINUTES') || 5;
    const expiresAt = new Date(Date.now() + expiresMinutes * 60 * 1000);

    const codeHash = await bcrypt.hash(code, 10);

    const userIdToSave = userId ?? null;

    await this.prisma.otpCode.create({
      data: {
        email,
        codeHash,
        type,
        expiresAt,
        userId: userIdToSave,
      },
    });

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

    this.logger.log(`OTP sent to ${email} for type: ${type}`);
  }

  async findUserByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async verifyOtp(email: string, code: string, type: OtpType): Promise<void> {
    const record = await this.prisma.otpCode.findFirst({
      where: {
        email,
        type,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
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

    if (type === 'register') {
      await this.prisma.otpCode.delete({ where: { id: record.id } });
      const user = record.user ?? (await this.prisma.user.findUnique({ where: { email } }));
      if (!user) {
        this.logger.error(`OTP verification failed: no account found for email ${email}`);
        throw new BadRequestException(
          'No account found for this email. Please register first.',
        );
      }
      if (user.isEmailVerified) {
        this.logger.warn(`OTP verification skipped: email ${email} already verified`);
        return;
      }
      await this.prisma.user.update({
        where: { id: user.id },
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
