import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  console.log('--- STARTING NESTJS BOOTSTRAP ---');
  try {
    console.log('Initializing NestFactory...');
    const app = await NestFactory.create(AppModule);
    console.log('NestFactory initialized.');

    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));

    const config = new DocumentBuilder()
      .setTitle('Auth Service')
      .setDescription('The Auth Service API description')
      .setVersion('1.0')
      .addTag('auth')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);

    const port = process.env.PORT ?? 8080;
    await app.listen(port, '0.0.0.0');
    console.log(`Application is running on: ${await app.getUrl()}`);
  } catch (error) {
    console.error('Failed to start application:', error);
    process.exit(1);
  }
}
bootstrap();
