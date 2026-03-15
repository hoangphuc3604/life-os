import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { PrismaModule } from './prisma/prisma.module';
import { FoldersModule } from './folders/folders.module';
import { NotesModule } from './notes/notes.module';
import { BlocksModule } from './blocks/blocks.module';
import { SearchModule } from './search/search.module';
import { UploadModule } from './upload/upload.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ServeStaticModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => [{
        rootPath: join(process.cwd(), configService.get<string>('UPLOAD_DIR', './uploads')),
        serveRoot: '/uploads',
        serve: false,
      }],
      inject: [ConfigService],
    }),
    PrismaModule,
    AuthModule,
    FoldersModule,
    NotesModule,
    BlocksModule,
    SearchModule,
    UploadModule,
  ],
})
export class AppModule {}
