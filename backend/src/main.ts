import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NextFunction, Request, Response } from 'express';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.setGlobalPrefix('api/v1');
  app.use(helmet());
  app.set('trust proxy', 1);
  app.enableCors({
    origin:
      process.env.CORS_ORIGIN === '*'
        ? true
        : process.env.CORS_ORIGIN?.split(',').map((origin) => origin.trim()),
    credentials: true,
  });
  app.useStaticAssets(
    join(process.cwd(), process.env.UPLOAD_DIR ?? './uploads'),
    {
      prefix: '/uploads/',
    },
  );
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  if (process.env.SWAGGER_ENABLED === 'true') {
    const swaggerUser = process.env.SWAGGER_USER;
    const swaggerPassword = process.env.SWAGGER_PASSWORD;

    if (swaggerUser && swaggerPassword) {
      app.use(
        ['/api/docs', '/api/docs-json'],
        (req: Request, res: Response, next: NextFunction) => {
          const authorization = req.headers.authorization ?? '';
          const [scheme, encodedCredentials] = authorization.split(' ');
          const credentials = Buffer.from(
            encodedCredentials ?? '',
            'base64',
          ).toString('utf8');
          const separatorIndex = credentials.indexOf(':');
          const username = credentials.slice(0, separatorIndex);
          const password = credentials.slice(separatorIndex + 1);

          if (
            scheme === 'Basic' &&
            username === swaggerUser &&
            password === swaggerPassword
          ) {
            next();
            return;
          }

          res.setHeader('WWW-Authenticate', 'Basic realm="API documentation"');
          res.status(401).send('Authentication required');
        },
      );
    }

    const swaggerConfig = new DocumentBuilder()
      .setTitle('Alih Daya Attendance API')
      .setDescription('Absensi dan kegiatan harian perusahaan alih daya')
      .setVersion('1.0.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document);
  }

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
