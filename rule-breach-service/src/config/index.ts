import * as env from 'env-var';
import './dotenv';

const config = {
    service: {
        port: env.get('PORT').required().asPortNumber(),
    },
    mongo: {
        url: env.get('MONGO_URL').required().asString(),
        ruleBreachAlertsCollectionName: env.get('MONGO_RULE_BREACH_ALERTS_COLLECTION_NAME').default('rule-breach-alerts').asString(),
        ruleBreachRequestsCollectionName: env.get('MONGO_RULE_BREACH_REQUESTS_COLLECTION_NAME').default('rule-breach-requests').asString(),
    },
};

export default config;
