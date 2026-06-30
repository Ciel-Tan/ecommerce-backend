import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { IncomingMessage } from 'http';
import { LoggerModule } from 'nestjs-pino';
import { CORRELATION_ID_HEADER } from '../../constants/correlation-id';

@Module({
  imports: [
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const isDev = config.get('NODE_ENV') === 'development';
        return {
          pinoHttp: {
            level: isDev ? 'debug' : 'info',
            transport: isDev
              ? {
                  target: 'pino-pretty',
                  options: {
                    singleLine: true,
                    translateTime: 'SYS:standard', // this mean use system time
                    ignore: 'pid,hostname',
                  },
                }
              : undefined,
            genReqId: (req, res) => {
              const existing = req.headers[CORRELATION_ID_HEADER];
              const id = existing ?? randomUUID();
              req.headers[CORRELATION_ID_HEADER] = id;
              res.setHeader(CORRELATION_ID_HEADER, id);
              return id;
            },
            redact: {
              // redact is used to hide sensitive information
              paths: [
                'req.headers.authorization',
                'req.headers.cookies',
                'req.body.password',
                'req.headers["set-cookie"]',
              ],
              censor: '[REDACTED]',
            },
            customProps: (req: IncomingMessage) => ({
              userId: (req as IncomingMessage & { user?: { id: string } }).user
                ?.id,
            }),
          },
        };
      },
    }),
  ],
  exports: [LoggerModule],
})
export class PinoLoggerModule {}
