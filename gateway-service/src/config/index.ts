import * as env from 'env-var';
import './dotenv';

const config = {
    service: {
        port: env.get('PORT').required().asPortNumber(),
        entityTemplateManagerUrl: env.get('ENTITY_TEMPLATE_MANAGER_URL').required().asString(),
    },
    authentication: {
        tokenSecret: env.get('TOKEN_SECRET').required().asString(),
        isRequired: env.get('IS_AUTHENTICATION_REQUIRED').default('true').asBool(),
    },
};

export default config;
