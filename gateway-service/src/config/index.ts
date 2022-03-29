import * as env from 'env-var';
import './dotenv';

const config = {
    service: {
        port: env.get('PORT').required().asPortNumber(),
        systemUnavailableURL: env.get('SYSTEM_UNAVAILABLE_URL').required().asString(),
    },
    authentication: {
        tokenSecret: env.get('TOKEN_SECRET').required().asString(),
        isRequired: env.get('IS_AUTHENTICATION_REQUIRED').default('true').asBool(),
        callbackURL: env.get('CALLBACK_URL').required().asString(),
        shragaURL: env.get('SHRAGA_URL').required().asString(),
        useEnrichId: env.get('USE_ENRICH_ID').default('true').asBool(),
        sessionSecret: env.get('SESSION_SECRET').default('secret').asString(),
        shragaTokenSecret: env.get('SHRAGA_TOKEN_SECRET').default('secret').asString(),
        accessTokenName: env.get('ACCESS_TOKEN_NAME').required().asString(),
        accessTokenExpirationTime: env.get('ACCESS_TOKEN_EXPIRATION_TIME').default('1d').asString(),
    },
    entityTemplateManager: {
        uri: env.get('ENTITY_TEMPLATE_MANAGER_URI').required().asUrlString(),
    },
    relationshipTemplateManager: {
        uri: env.get('RELATIONSHIP_TEMPLATE_MANAGER_URI').required().asUrlString(),
    },
    storageService: {
        uri: env.get('STORAGE_SERVICE_URI').required().asUrlString(),
    },
    instanceManager: {
        uri: env.get('INSTANCE_MANAGER_URI').required().asUrlString(),
    },
};

export default config;
