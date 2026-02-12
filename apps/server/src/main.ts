import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: true, // Reflect the request origin (works for chrome-extension:// and https://)
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  );
  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
  console.log(`Server running on http://localhost:${process.env.PORT ?? 3000}`);
}
bootstrap().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
