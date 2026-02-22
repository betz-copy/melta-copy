import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import {
    ApmInterceptor,
    AppClsModule,
    apmAgentProvider,
    ClsService,
    CorrelationIdInterceptor,
    GlobalExceptionFilter,
    LoggerModule,
    MongoModule,
    MorganInterceptor,
    WorkspaceInterceptor,
} from '@packages/utils';
import { ZodSerializerInterceptor, ZodValidationPipe } from 'nestjs-zod';
import config from './config';
import { ActivityLogModule } from './nest/activityLog/activityLog.module';
import { HealthModule } from './nest/health/health.module';

const { throttle } = config;

@Module({
    imports: [
        AppClsModule,
        LoggerModule,
        MongoModule.register({
            uri: config.mongo.url,
            connectionOptions: config.mongo.connectionOptions,
        }),
        ActivityLogModule,
        HealthModule,
        ThrottlerModule.forRootAsync({
            useFactory: () => [
                {
                    ttl: throttle.ttl,
                    limit: throttle.limit,
                },
            ],
        }),
    ],
    providers: [
        {
            provide: APP_PIPE,
            useClass: ZodValidationPipe,
        },
        {
            provide: APP_FILTER,
            useClass: GlobalExceptionFilter,
        },
        {
            provide: APP_GUARD,
            useClass: ThrottlerGuard,
        },
        {
            provide: APP_INTERCEPTOR,
            useClass: CorrelationIdInterceptor,
        },
        {
            provide: APP_INTERCEPTOR,
            useClass: MorganInterceptor,
        },
        {
            provide: APP_INTERCEPTOR,
            useClass: ApmInterceptor,
        },
        {
            provide: APP_INTERCEPTOR,
            useClass: ZodSerializerInterceptor,
        },
        {
            provide: APP_INTERCEPTOR,
            useFactory: (clsService: ClsService) => new WorkspaceInterceptor(clsService, [config.server.paths.base, config.server.paths.health]),
            inject: [ClsService],
        },
        apmAgentProvider,
    ],
})
export class AppModule {}
