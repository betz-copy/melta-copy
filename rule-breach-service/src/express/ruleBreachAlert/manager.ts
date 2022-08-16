import { IRuleBreach } from '../ruleBreaches/interface';
import { IRuleBreachAlertDocument } from './interface';
import RuleBreachAlertsModel from './model';

export class RuleBreachAlertsManager {
    public static async createRuleBreachAlert(ruleBreachesAlertData: Omit<IRuleBreach, 'createdAt'>): Promise<IRuleBreachAlertDocument> {
        return RuleBreachAlertsModel.create(ruleBreachesAlertData);
    }
}

export default RuleBreachAlertsManager;
