import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));
  
  app.enableCors();
  
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 3002;
  
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Knowledge Service API')
    .setDescription('API for Knowledge Module - Notes & Folders Management')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, document);
  
  await app.listen(port);
  console.log(`Knowledge Service running on port ${port}`);
}
bootstrap();
