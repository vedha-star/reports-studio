/* eslint-disable @typescript-eslint/no-floating-promises */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
~
  const origins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.replace(/["']/g, '').split(',').map(o => o.trim())
    : 'http://localhost:3000';

  app.enableCors({
    origin: origins,
    credentials: true,
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`Backend is running on: http://localhost:${port}`);
  console.log(`Allowed CORS Origins: ${origins}`);
}
bootstrap();
