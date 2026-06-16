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
  const emerald = '\x1b[38;2;16;185;129m';
  const mint = '\x1b[38;2;52;211;153m';
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
  console.log(art.map((line) => `${bold}${emerald}${line}${reset}`).join('\n'));
  console.log(`   ${mint}Backend${reset} ${dim}·${reset} NestJS API`);
  console.log(`   ${dim}➜${reset} ${bold}${url}${reset}\n`);
}
bootstrap().catch((e) => {
  console.error('Failed to start server:', e);
  process.exit(1);
});
