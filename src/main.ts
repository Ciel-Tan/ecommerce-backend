import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { parseEnvOrigins } from './utils/parse-env-origins';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';

const getCorsAllowList = (config: ConfigService) => {
  return parseEnvOrigins(
    config.get<string>('CLIENT_URL'),
    config.get<string>('CORS_OTHER_URL'),
  );
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));

  // frontend sends requests with credentials (cookie)
  // change cookie from string to object
  app.use(cookieParser());

  const config = app.get(ConfigService);
  const logger = app.get(Logger);

  // enable cors
  const allowList = getCorsAllowList(config);
  app.enableCors({
    origin: (requestOrigin: string, callback) => {
      if (!requestOrigin) {
        callback(null, true);
        return;
      }

      if (allowList.includes(requestOrigin)) {
        callback(null, true);
        return;
      }

      // log warning
      logger.warn(
        `CORS: blocked request from origin "${requestOrigin}" (not in allow list)`,
      );

      callback(null, false);
    },
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'X-Requested-With',
    ],
    credentials: true,
  });

  // validationPipe
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, // change request data to instance of DTO
      transformOptions: { enableImplicitConversion: true }, // change type of request data to type of DTO
      whitelist: true, // remove properties that are not in DTO
      forbidNonWhitelisted: true, // throw error (400) if request data has properties that are not in DTO
    }),
  );

  // API versioning
  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  const port = config.get<number>('PORT') ?? 8080;
  await app.listen(port);
  logger.log(`Server running on port ${port}`);
}
bootstrap();
