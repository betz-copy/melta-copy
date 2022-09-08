import { translateAgGridFilterModel, translateAgGridSortModel } from '../../utils/agGrid';
import { IAgGridRequest } from '../../utils/interfaces/agGrid';
import { IRuleBreach } from '../../utils/interfaces/ruleBreach';
import { RuleBreachDoesNotExistError } from '../error';
import { IRuleBreachAlertDocument } from './interface';
import RuleBreachAlertsModel from './model';

export class RuleBreachAlertsManager {
    public static async searchRuleBreachAlerts(agGridRequest: IAgGridRequest): Promise<IRuleBreachAlertDocument[]> {
        const { startRow, endRow, sortModel, filterModel } = agGridRequest;

        const sort = translateAgGridSortModel(sortModel);
        const query = await translateAgGridFilterModel(filterModel);

        return RuleBreachAlertsModel.find(query, {}, { skip: startRow, limit: endRow - startRow, sort }).exec();
    }

    public static async createRuleBreachAlert(ruleBreachAlertData: Omit<IRuleBreach, 'createdAt'>): Promise<IRuleBreachAlertDocument> {
        return RuleBreachAlertsModel.create(ruleBreachAlertData);
    }

    public static async getRuleBreachAlertById(ruleBreachAlertId: string): Promise<IRuleBreachAlertDocument> {
        return RuleBreachAlertsModel.findById(ruleBreachAlertId).orFail(new RuleBreachDoesNotExistError(ruleBreachAlertId, 'alert')).exec();
    }
}

export default RuleBreachAlertsManager;
