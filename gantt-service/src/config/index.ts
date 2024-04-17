import * as env from 'env-var';
import './dotenv';

const config = {
    service: {
        port: env.get('PORT').required().asPortNumber(),
    },
    mongo: {
        url: env.get('MONGO_URL').required().asString(),
        ganttsCollectionName: env.get('MONGO_GANTTS_COLLECTION_NAME').required().asString(),
    },
    errorCodes: {
        failedToDeleteField: 'FAILED_DELETE_FIELD',
    },
};

export default config;
