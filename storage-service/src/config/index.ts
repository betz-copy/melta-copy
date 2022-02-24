import 'dotenv/config';
import * as env from 'env-var';

export const config = {
    multer: {
        fileKeyName: 'file',
    },
    service: {
        port: env.get('PORT').default(8000).asPortNumber(),
    },
    minio: {
        uri: env.get('MINIO_ENDPOINT').default('localhost').asString(),
        port: env.get('MINIO_PORT').default(9000).asPortNumber(),
        accessKey: env.get('MINIO_ACCESS_KEY').default('minioadmin').asString(),
        secretKey: env.get('MINIO_SECRET_KEY').default('minioadmin').asString(),
        bucketName: env.get('MINIO_BUCKET_NAME').default('bucket').asString(),
        useSSL: false,
    },
    rabbit: {
        uri: env.get('RABBIT_URI').default('amqp://localhost').asUrlString(),
        deleteExchangeName: env.get('DELETE_FILES_EXCHANGE_NAME').default('terminal-mock-delete-file-exchange').asString(),
        deleteQueueName: env.get('DELETE_FILES_QUEUE_NAME').default('terminal-mock-delete-file-queue').asString(),
        deleteDelay: env.get('DELETE_FILES_DELAY').required().asIntPositive(),
        deleteWithoutDelayQueueName: env
            .get('DELETE_FILES_WITHOUT_DELAY_QUEUE_NAME')
            .default('terminal-mock-delete-file-without-delay-queue')
            .asString(),
        deleteWithoutDelayExchangeName: env
            .get('DELETE_FILES_WITHOUT_DELAY_EXCHANGE_NAME')
            .default('terminal-mock-delete-file-without-delay-exchange')
            .asString(),
        deleteDelayDeadLetterRoutingKey: env.get('DELETE_DELAY_DEAD_LETTER_ROUTING_KEY').default('please-delete-me-wo-delay').asString(),
        retryOptions: {
            minTimeout: env.get('RABBIT_RETRY_MIN_TIMEOUT').default(1000).asIntPositive(),
            retries: env.get('RABBIT_RETRY_RETRIES').default(10).asIntPositive(),
            factor: env.get('RABBIT_RETRY_FACTOR').default(1.8).asFloatPositive(),
        },
    },
};
