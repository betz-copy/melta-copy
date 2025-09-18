import { IBrokenRule } from '@microservices/shared';
import config from '../../config';
import DefaultExternalServiceRabbit from '../../utils/rabbit/manager';

const { rabbit } = config;

class GatewayServiceProducer extends DefaultExternalServiceRabbit {
    async createAlertForRuleWithTodayFunc(brokenRule: IBrokenRule) {
        return this.sendToQueue(rabbit.createAlertForRuleWithTodayFuncQueue, brokenRule);
    }
}

export default GatewayServiceProducer;
