import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {}

  async sendEmail(to: string, subject: string, html: string): Promise<void> {
    const from = this.configService.get<string>('EMAIL_FROM');
    await this.mailerService.sendMail({
      from,
      to,
      subject,
      html,
    });
  }
}
