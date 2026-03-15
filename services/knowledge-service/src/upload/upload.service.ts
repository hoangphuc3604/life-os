import { promises as fs } from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UploadService {
  private uploadDir: string;

  constructor(private configService: ConfigService) {
    this.uploadDir = this.configService.get<string>('UPLOAD_DIR', './uploads');
  }

  async uploadFile(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException('Invalid file type. Only images are allowed.');
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException('File too large. Maximum size is 5MB.');
    }

    const ext = path.extname(file.originalname);
    const filename = `${crypto.randomUUID()}${ext}`;
    const filepath = path.join(this.uploadDir, filename);
    await fs.writeFile(filepath, file.buffer);

    return {
      url: `/uploads/${filename}`,
      filename,
    };
  }
}
