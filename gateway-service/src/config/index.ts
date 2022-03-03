import { from, accessors } from 'env-var';
import { OperationTranslator, validateOperationTranslator } from '../utils/operationTranslator';
import './dotenv';

const env = from(process.env, {
    asOperationTranslatorJsonObject: (operationTranslatorAsString) => {
        const operationTranslator = accessors.asJsonObject(operationTranslatorAsString) as OperationTranslator;

        return validateOperationTranslator(operationTranslator);
    },
});

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
    permissionApi: {
        url: env.get('PERMISSION_API_URL').required().asString(),
        getPermissionsRoute: env.get('PERMISSION_API_GET_PERMISSIONS_ROUTE').default('/api/permissions').asString(),
        requestTimeout: env.get('PERMISSION_API_REQUEST_TIMEOUT').default(10000).asIntPositive(),
        checkAuthorizationRoute: env.get('PERMISSION_API_CHECK_AUTHERIZATION_ROUTE').default('authorization').asString(),
    },
    operationToScopeTranslator: env
        .get('OPERATION_TO_SCOPE_TRANSLATOR')
        .default({
            Read: ['GET'],
            Write: ['POST', 'PUT'],
        })
        .asOperationTranslatorJsonObject(),
};

export default config;
