import * as env from 'env-var';
import './dotenv';

const config = {
    service: {
        port: env.get('PORT').required().asPortNumber(),
    },
    authentication: {
        tokenSecret: env.get('TOKEN_SECRET').required().asString(),
        isRequired: env.get('IS_AUTHENTICATION_REQUIRED').default('true').asBool(),
    },
    entityTemplateManager: {
        uri: env.get('ENTITY_TEMPLATE_MANAGER_URI').required().asUrlString(),
    },
    storageService: {
        uri: env.get('STORAGE_SERVICE_URI').required().asUrlString(),
    },
};

export default config;
