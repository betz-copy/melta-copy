import * as env from 'env-var';
import './dotenv';

const config = {
    service: {
        port: env.get('PORT').required().asIntPositive(),
    },
    mongo: {
        uri: env.get('MONGO_URI').required().asString(),
        permissionsCollectionName: env.get('MONGO_PERMISSIONS_COLLECTION_NAME').required().asString(),
    }
};

export default config;
