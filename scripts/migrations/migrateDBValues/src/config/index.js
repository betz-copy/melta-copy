import env from 'env-var';
import './dotenv.js';

const config = {
    mongo: {
        uri: env.get('MONGO_URI').required().asString(),
        targetCollection: env.get('TARGET_COLLECTION').required().asString(), // in renamePermissionsUserIdToRelatedId script it's permissions
        targetDatabase: env.get('TARGET_DATABASE').default('global').asString(), // in renamePermissionsUserIdToRelatedId script it's global
    },
    neo: {
        uri: env.get('NEO_URI').asString(),
        user: env.get('NEO_USER').asString(),
        password: env.get('PASSWORD').asString(),
    },
};

export default config;
