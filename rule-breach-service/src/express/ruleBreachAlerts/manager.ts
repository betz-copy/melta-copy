import { IRuleBreach } from '../ruleBreaches/interface';
import { IRuleBreachAlertDocument } from './interface';
import RuleBreachAlertsModel from './model';

export class RuleBreachAlertsManager {
    public static async createRuleBreachAlert(ruleBreachAlertData: Omit<IRuleBreach, 'createdAt'>): Promise<IRuleBreachAlertDocument> {
        return RuleBreachAlertsModel.create(ruleBreachAlertData);
    }
}

export default RuleBreachAlertsManager;
