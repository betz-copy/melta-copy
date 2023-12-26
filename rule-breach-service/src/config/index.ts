import * as env from 'env-var';
import './dotenv';

const config = {
    service: {
        port: env.get('PORT').required().asPortNumber(),
    },
    mongo: {
        uri: env.get('MONGO_URI').required().asString(),
        ruleBreachAlertsCollectionName: env.get('MONGO_RULE_BREACH_ALERTS_COLLECTION_NAME').default('ruleBreachAlerts').asString(),
        ruleBreachRequestsCollectionName: env.get('MONGO_RULE_BREACH_REQUESTS_COLLECTION_NAME').default('ruleBreachRequests').asString(),
    },
};

export default config;
