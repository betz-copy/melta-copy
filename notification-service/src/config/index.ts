import * as env from 'env-var';
import './dotenv';

const config = {
    service: {
        port: env.get('PORT').required().asPortNumber(),
        dbHeaderName: env.get('DB_HEADER_NAME').default('dbName').asString(),
    },
    mongo: {
        url: env.get('MONGO_URL').required().asString(),
        notificationsCollectionName: env.get('MONGO_NOTIFICATIONS_COLLECTION_NAME').default('notifications').asString(),
        maxFindLimit: env.get('MONGO_MAX_FIND_LIMIT').default(500).asIntPositive(),
    },
    rabbit: {
        url: env.get('RABBIT_URL').required().asString(),
        queueName: env.get('RABBIT_QUEUE_NAME').default('notifications-queue').asString(),
        retryOptions: {
            minTimeout: env.get('RABBIT_RETRY_MIN_TIMEOUT').default(1000).asIntPositive(),
            retries: env.get('RABBIT_RETRY_RETRIES').default(10).asIntPositive(),
            factor: env.get('RABBIT_RETRY_FACTOR').default(1.8).asFloatPositive(),
        },
    },
};

export default config;
