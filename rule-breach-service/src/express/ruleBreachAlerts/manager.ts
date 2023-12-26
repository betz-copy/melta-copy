import { translateAgGridFilterModel, translateAgGridSortModel } from '../../utils/agGrid';
import { IAgGridRequest } from '../../utils/interfaces/agGrid';
import { IRuleBreach } from '../../utils/interfaces/ruleBreach';
import { RuleBreachDoesNotExistError } from '../error';
import { IRuleBreachAlertDocument } from './interface';
import RuleBreachAlertsModel from './model';

export class RuleBreachAlertsManager {
    public static async searchRuleBreachAlerts(agGridRequest: IAgGridRequest) {
        const { startRow, endRow, sortModel, filterModel } = agGridRequest;

        const sort = translateAgGridSortModel(sortModel);
        const query = await translateAgGridFilterModel(filterModel);

        const [rows, lastRowIndex] = await Promise.all([
            RuleBreachAlertsModel.find(query, {}, { skip: startRow, limit: endRow - startRow, sort }).lean(),
            RuleBreachAlertsModel.count(query),
        ]);

        return { rows, lastRowIndex };
    }

    public static async createRuleBreachAlert(ruleBreachAlertData: Omit<IRuleBreach, 'createdAt'>): Promise<IRuleBreachAlertDocument> {
        return RuleBreachAlertsModel.create(ruleBreachAlertData);
    }

    public static async getRuleBreachAlertsById(ruleBreachAlertId: string): Promise<IRuleBreachAlertDocument> {
        return RuleBreachAlertsModel.findById(ruleBreachAlertId).orFail(new RuleBreachDoesNotExistError(ruleBreachAlertId, 'alert')).exec();
    }

    public static async getRuleBreachAlertsByRuleId(ruleId: string): Promise<IRuleBreachAlertDocument> {
        return RuleBreachAlertsModel.find({ 'brokenRules.ruleId': ruleId }).lean();
    }
}

export default RuleBreachAlertsManager;
