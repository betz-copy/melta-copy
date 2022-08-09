import * as env from 'env-var';
import './dotenv';

const config = {
    service: {
        port: env.get('PORT').required().asPortNumber(),
    },
    mongo: {
        uri: env.get('MONGO_URI').required().asString(),
        alertCollectionName: env.get('MONGO_ALERT_COLLECTION_NAME').default('alerts').asString(),
        requestCollectionName: env.get('MONGO_REQUEST_COLLECTION_NAME').default('requests').asString(),
        responseCollectionName: env.get('MONGO_RESPONSE_COLLECTION_NAME').default('responses').asString(),
        maxFindLimit: env.get('MONGO_MAX_FIND_LIMIT').default(100).asIntPositive(),
    },
    rabbit: {
        uri: env.get('RABBIT_URI').required().asString(),
        retryOptions: {
            minTimeout: env.get('RABBIT_RETRY_MIN_TIMEOUT').default(1000).asIntPositive(),
            retries: env.get('RABBIT_RETRY_RETRIES').default(10).asIntPositive(),
            factor: env.get('RABBIT_RETRY_FACTOR').default(1.8).asFloatPositive(),
        },
    },
};

export default config;
