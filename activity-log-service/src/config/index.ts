import * as env from 'env-var';
import './dotenv';

const config = {
    service: {
        port: env.get('PORT').required().asPortNumber(),
        dbHeaderName: env.get('DB_HEADER_NAME').default('dbName').asString(),
        maxRequestSize: env.get('MAX_REQUEST_BYTE_SIZE').required().asInt(),
    },
    mongo: {
        url: env.get('MONGO_URL').required().asString(),
        activitiesCollectionName: env.get('MONGO_ACTIVITIES_COLLECTION_NAME').required().asString(),
    },
};

export default config;
