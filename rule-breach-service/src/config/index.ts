import * as env from 'env-var';
import './dotenv';

const config = {
    service: {
        port: env.get('PORT').required().asPortNumber(),
    },
    mongo: {
        uri: env.get('MONGO_URI').required().asString(),
        ruleBreachesCollectionName: env.get('MONGO_RULE_BREACHES_COLLECTION_NAME').default('ruleBreaches').asString(),
        ruleBreachAlertsSubCollectionName: env.get('MONGO_RULE_BREACH_ALERTS_SUB_COLLECTION_NAME').default('ruleBreachAlert').asString(),
        ruleBreachRequestsSubCollectionName: env.get('MONGO_RULE_BREACH_REQUESTS_SUB_COLLECTION_NAME').default('ruleBreachRequest').asString(),
        maxFindLimit: env.get('MONGO_MAX_FIND_LIMIT').default(500).asIntPositive(),
    },
};

export default config;
