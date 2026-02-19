import { DynamicModule, Logger, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import config from '../config';

const { connectionOptions: defaultConnectionOptions } = config.mongo;

type MongoModuleOptions = {
    uri: string;
    connectionOptions?: {
        maxIdleTimeMS?: number;
        socketTimeoutMS?: number;
        serverSelectionTimeoutMS?: number;
    };
};

@Module({})
class MongoModule {
    static register(options: MongoModuleOptions): DynamicModule {
        const mergedConnectionOptions = {
            ...defaultConnectionOptions,
            ...options.connectionOptions,
        };

        return {
            module: MongoModule,
            imports: [
                MongooseModule.forRootAsync({
                    useFactory: () => {
                        const logger = new Logger('MongooseModule');

                        return {
                            uri: options.uri,
                            maxIdleTimeMS: mergedConnectionOptions.maxIdleTimeMS,
                            socketTimeoutMS: mergedConnectionOptions.socketTimeoutMS,
                            serverSelectionTimeoutMS: mergedConnectionOptions.serverSelectionTimeoutMS,
                            retryWrites: true,
                            retryReads: true,
                            connectionFactory: (connection) => {
                                connection.on('connected', () => {
                                    logger.log('MongoDB connected successfully');
                                });

                                connection.on('disconnected', () => {
                                    logger.warn('MongoDB disconnected');
                                });

                                connection.on('error', (error: Error) => {
                                    logger.error(`MongoDB connection error: ${error.message}`);
                                });

                                connection.on('reconnected', () => {
                                    logger.log('MongoDB reconnected');
                                });

                                return connection;
                            },
                        };
                    },
                }),
            ],
            exports: [MongooseModule],
        };
    }
}

export default MongoModule;
