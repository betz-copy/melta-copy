import * as env from 'env-var';
import './dotenv';

const config = {
    service: {
        port: env.get('PORT').required().asIntPositive(),
    },
    mongo: {
        url: env.get('MONGO_URL').required().asString(),
        permissionsCollectionName: env.get('MONGO_PERMISSIONS_COLLECTION_NAME').default('permissions').asString(),
    },
};

export default config;
