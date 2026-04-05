import * as Handlebars from 'handlebars';
import { ApiProperty } from '@nestjs/swagger';

export interface OtpEmailData {
  otpCode: string;
  expiresMinutes: number;
  email: string;
}

export function compileOtpEmailTemplate(data: OtpEmailData): string {
  const template = Handlebars.compile(OTP_EMAIL_HTML);
  return template(data);
}

export class OtpEmailDto {
  @ApiProperty({ example: 'user@example.com', description: 'Email address to send OTP to' })
  email!: string;

  @ApiProperty({ example: '123456', description: 'The 6-digit OTP code' })
  otpCode!: string;

  @ApiProperty({ example: 5, description: 'OTP expiration time in minutes' })
  expiresMinutes!: number;
}

const OTP_EMAIL_HTML = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Xác minh email - LifeOS</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5; color: #333;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 32px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: 1px;">LifeOS</h1>
              <p style="margin: 8px 0 0; color: rgba(255,255,255,0.85); font-size: 14px;">Personal Knowledge & Resource Planning</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px 40px 32px;">
              <h2 style="margin: 0 0 12px; font-size: 22px; font-weight: 600; color: #1a1a2e;">Xin chào,</h2>
              <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #555;">
                Chúng tôi đã nhận được yêu cầu xác minh email cho tài khoản <strong>{{ email }}</strong>.
                Dưới đây là mã xác minh của bạn:
              </p>

              <!-- OTP Code Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                <tr>
                  <td align="center" style="background-color: #f0f1ff; border: 2px dashed #667eea; border-radius: 12px; padding: 28px 20px;">
                    <p style="margin: 0 0 8px; font-size: 13px; color: #666; text-transform: uppercase; letter-spacing: 1.5px;">Mã xác minh</p>
                    <p style="margin: 0; font-size: 42px; font-weight: 800; color: #667eea; letter-spacing: 12px; font-family: 'Courier New', Courier, monospace;">{{ otpCode }}</p>
                  </td>
                </tr>
              </table>

              <!-- Expiry Notice -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fff7e6; border-left: 4px solid #f59e0b; border-radius: 6px; padding: 12px 16px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 12px 16px;">
                    <p style="margin: 0; font-size: 14px; color: #92400e;">
                      <strong>Mã này có hiệu lực trong {{ expiresMinutes }} phút.</strong> Vui lòng không chia sẻ mã này với bất kỳ ai.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Security Notice -->
              <p style="margin: 0; font-size: 13px; color: #999; line-height: 1.5; border-top: 1px solid #eee; padding-top: 20px;">
                Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này. Để bảo vệ tài khoản, không chia sẻ mã xác minh với người khác, kể cả nhân viên LifeOS.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 20px 40px; border-top: 1px solid #eee; text-align: center;">
              <p style="margin: 0 0 4px; font-size: 13px; color: #888;">
                Email này được gửi tự động bởi LifeOS. Vui lòng không trả lời trực tiếp email này.
              </p>
              <p style="margin: 0; font-size: 12px; color: #bbb;">
                &copy; {{ year }} LifeOS. Mọi quyền được bảo lưu.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
