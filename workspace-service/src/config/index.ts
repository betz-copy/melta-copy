import * as env from 'env-var';
import './dotenv';

export const config = {
    service: {
        port: env.get('PORT').required().asPortNumber(),
    },
    mongo: {
        url: env.get('MONGO_URL').required().asString(),
        workspacesCollectionName: env.get('MONGO_WORKSPACES_COLLECTION_NAME').required().asString(),
    },
};
