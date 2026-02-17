import { Logger, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import config from '../config';

const { url, connectionOptions } = config.mongo;

@Module({
    imports: [
        MongooseModule.forRootAsync({
            useFactory: () => {
                const logger = new Logger('MongooseModule');

                return {
                    uri: url,
                    maxIdleTimeMS: connectionOptions.maxIdleTimeMS,
                    socketTimeoutMS: connectionOptions.socketTimeoutMS,
                    serverSelectionTimeoutMS: connectionOptions.serverSelectionTimeoutMS,
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
})
class MongoModule {}

export default MongoModule;
