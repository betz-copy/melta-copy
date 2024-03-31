import * as env from 'env-var';
import './dotenv';

const config = {
    service: {
        port: env.get('PORT').required().asPortNumber(),
        maxRequestSize: env.get('MAX_REQUEST_BYTE_SIZE').required().asInt(),
    },
    mongo: {
        url: env.get('MONGO_URL').required().asString(),
        ganttsCollectionName: env.get('MONGO_GANTTS_COLLECTION_NAME').required().asString(),
    },
};

export default config;
