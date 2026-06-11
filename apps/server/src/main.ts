import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { json, Request, Response, NextFunction } from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(json({ limit: '50mb' }));
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Access-Control-Allow-Private-Network', 'true');
    next();
  });

  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: 'Content-Type, Accept, Authorization, X-Requested-With',
  });
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  );
  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
  printBanner(await app.getUrl());
}

function printBanner(url: string) {
  const indigo = '\x1b[38;2;99;102;241m';
  const violet = '\x1b[38;2;167;139;250m';
  const dim = '\x1b[90m';
  const bold = '\x1b[1m';
  const reset = '\x1b[0m';
  const art = [
    '   ███████╗██╗     ██╗   ██╗██╗  ██╗',
    '   ██╔════╝██║     ██║   ██║╚██╗██╔╝',
    '   █████╗  ██║     ██║   ██║ ╚███╔╝ ',
    '   ██╔══╝  ██║     ██║   ██║ ██╔██╗ ',
    '   ██║     ███████╗╚██████╔╝██╔╝ ██╗',
    '   ╚═╝     ╚══════╝ ╚═════╝ ╚═╝  ╚═╝',
  ];
  console.log('');
  console.log(art.map((line) => `${bold}${indigo}${line}${reset}`).join('\n'));
  console.log(`   ${violet}Backend${reset} ${dim}·${reset} NestJS API`);
  console.log(`   ${dim}➜${reset} ${bold}${url}${reset}\n`);
}
bootstrap().catch((e) => {
  console.error('Failed to start server:', e);
  process.exit(1);
});
