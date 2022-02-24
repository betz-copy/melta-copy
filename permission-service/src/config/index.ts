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
        port: env.get('PORT').required().asIntPositive(),
    },
    mongo: {
        uri: env.get('MONGO_URI').required().asUrlString(),
        permissionsCollectionName: env.get('MONGO_PERMISSIONS_COLLECTION_NAME').required().asString(),
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
