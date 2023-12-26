import * as env from 'env-var';
import './dotenv';

const config = {
    service: {
        port: env.get('PORT').required().asPortNumber(),
    },
    mongo: {
        uri: env.get('MONGO_URI').required().asString(),
        ganttsCollectionName: env.get('MONGO_GANTTS_COLLECTION_NAME').required().asString(),
    },
};

export default config;
