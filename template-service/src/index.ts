import apm from 'elastic-apm-node';
export const apmAgent = apm.start();

import { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { RmqOptions, Transport } from '@nestjs/microservices';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppLogger, MenashDeserializer } from '@packages/utils';
import helmet from 'helmet';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { AppModule } from './app.module';
import config from './config';

const { server, rabbit, swagger, logger } = config;

const setupLogger = async (app: INestApplication) => {
    const nestLogger = app.get(WINSTON_MODULE_NEST_PROVIDER);
    app.useLogger(nestLogger);

    const logger = await app.resolve(AppLogger);
    logger.setContext('Bootstrap');

    return logger;
};

const setupSecurity = async (app: NestExpressApplication, limit: string) => {
    app.use(helmet());
    app.enableCors();
    app.set('query parser', 'extended');
    app.useBodyParser('json', { limit });
    app.useBodyParser('urlencoded', { limit, extended: true });
};

const setupSwagger = (app: INestApplication) => {
    if (!swagger.enabled) return;

    const path = swagger.path ?? 'docs';
    const title = swagger.title ?? `${logger.extraDefault.serviceName} API`;
    const description = swagger.description ?? 'API documentation';
    const version = swagger.version ?? '1.0';

    const swaggerConfig = new DocumentBuilder()
        .setTitle(title)
        .setDescription(description)
        .setVersion(version)
        .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'jwt')
        .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup(path, app, document);
};

export const retryStartMicroservices = async (app: INestApplication, logger: AppLogger, retries: number, minTimeout: number, factor: number) => {
    let attempt = 0;
    let delay = minTimeout;

    while (attempt <= retries) {
        try {
            logger.log('Starting RabbitMQ microservice...');
            await app.startAllMicroservices();
            logger.log('RabbitMQ microservice initialized');
            return;
        } catch (err) {
            attempt++;
            if (attempt > retries) {
                logger.error(`Failed to start microservice after ${retries} retries`);
                throw err;
            }
            logger.warn(`Microservice start failed (attempt ${attempt}/${retries}), retrying in ${delay}ms...`);
            await new Promise((res) => setTimeout(res, delay));
            delay = Math.floor(delay * factor);
        }
    }
};

async function bootstrap() {
    const app = await NestFactory.create<NestExpressApplication>(AppModule, { bufferLogs: true });
    const logger = await setupLogger(app);

    app.connectMicroservice<RmqOptions>({
        transport: Transport.RMQ,
        options: {
            urls: [rabbit.url],
            queue: rabbit.queues.updateSearchIndexQueue,
            queueOptions: { durable: true },
            deserializer: new MenashDeserializer(rabbit.queues.updateSearchIndexQueue),
            socketOptions: {
                connectionOptions: {
                    timeout: rabbit.clientRetryOptions.minTimeout,
                },
            },
            noAck: false,
        },
    });

    await retryStartMicroservices(
        app,
        logger,
        rabbit.clientRetryOptions.retries,
        rabbit.clientRetryOptions.minTimeout,
        rabbit.clientRetryOptions.factor,
    );

    setupSwagger(app);
    app.enableShutdownHooks();
    await setupSecurity(app, server.maxRequestSize);
    await app.listen(server.port);
    logger.info(`Application is running on: ${await app.getUrl()}`);

    return { app, logger };
}

if (require.main === module)
    bootstrap()
        .then(({ app, logger }) => {
            process
                .on('unhandledRejection', async (reason, p) => {
                    logger.error(`Unhandled Rejection at Promise: ${p} - ${reason}`);
                    await app.close();
                    process.exit(1);
                })
                .on('uncaughtException', async (err) => {
                    logger.error(`Uncaught Exception thrown: ${err.message}`, err instanceof Error ? err.stack : String(err));
                    await app.close();
                    process.exit(1);
                });
        })
        .catch((err: unknown) => {
            console.log('process failed with error: ', err);
            process.exit(1);
        });
