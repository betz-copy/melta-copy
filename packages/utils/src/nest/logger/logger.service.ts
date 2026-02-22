import { Injectable } from '@nestjs/common';
import type { WinstonModuleOptionsFactory } from 'nest-winston';
import * as winston from 'winston';
import 'winston-daily-rotate-file';
import config from '../../config';

const { logs } = config;

@Injectable()
export class WinstonConfigService implements WinstonModuleOptionsFactory {
    private jsonReplacer = (_key: string, value: unknown) => {
        return value instanceof Error
            ? {
                  stack: value.stack,
                  message: value.message,
                  name: value.name,
              }
            : value;
    };

    private elasticFormat = winston.format.combine(
        winston.format.timestamp(),
        winston.format.ms(),
        winston.format.printf(({ timestamp, level, message, context, ...meta }) => {
            return JSON.stringify(
                {
                    timestamp,
                    level,
                    message,
                    context: context || 'Application',
                    service: logs.extraDefault.serviceName,
                    environment: logs.extraDefault.environment,
                    extra: meta,
                },
                this.jsonReplacer,
            );
        }),
    );

    private devFormat = winston.format.combine(
        winston.format.timestamp(),
        winston.format.ms(),
        winston.format.colorize({ all: true }),
        winston.format.printf(({ timestamp, level, message, context, ms }) => {
            return `${timestamp} [${context || 'App'}] ${level}: ${message} ${ms}`;
        }),
    );

    createWinstonModuleOptions(): winston.LoggerOptions {
        const loggerTransports: winston.transport[] = [];
        const isProduction = logs.extraDefault.environment === 'prod';

        if (logs.enableConsole) {
            loggerTransports.push(
                new winston.transports.Console({
                    format: isProduction ? this.elasticFormat : this.devFormat,
                }),
            );
        }

        if (logs.enableRotateFile) {
            loggerTransports.push(
                new winston.transports.DailyRotateFile({
                    dirname: logs.fileRotateSettings.dirname,
                    datePattern: logs.fileRotateSettings.datePattern,
                    maxSize: logs.fileRotateSettings.maxSize,
                    maxFiles: logs.fileRotateSettings.maxFiles,
                    format: this.elasticFormat,
                }),
            );
        }

        return { transports: loggerTransports };
    }
}
