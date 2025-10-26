import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    methods: 'GET,POST,PATCH,DELETE,OPTIONS,PUT',
    allowedHeaders: 'Content-Type, Authorization',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,   // <— add this line
      whitelist: true,   // <— optional but recommended for security
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
