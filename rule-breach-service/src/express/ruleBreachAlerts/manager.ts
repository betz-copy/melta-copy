import config from '../../config';
import { translateAgGridFilterModel, translateAgGridSortModel } from '../../utils/agGrid';
import { IAgGridRequest } from '../../utils/interfaces/agGrid';
import { IRuleBreach } from '../../utils/interfaces/ruleBreach';
import { DefaultManagerMongo } from '../../utils/mongo/manager';
import { RuleBreachDoesNotExistError } from '../error';
import { IRuleBreachAlert } from './interface';
import { RuleBreachAlertsSchema } from './model';

export default class RuleBreachAlertsManager extends DefaultManagerMongo<IRuleBreachAlert> {
    constructor(workspaceId: string) {
        super(workspaceId, config.mongo.ruleBreachAlertsCollectionName, RuleBreachAlertsSchema);
    }

    public async searchRuleBreachAlerts(agGridRequest: IAgGridRequest) {
        const { startRow, endRow, sortModel, filterModel } = agGridRequest;

        const sort = translateAgGridSortModel(sortModel);
        const query = translateAgGridFilterModel(filterModel);

        const [rows, lastRowIndex] = await Promise.all([
            this.model.find(query, {}, { skip: startRow, limit: endRow - startRow, sort }).lean(),
            this.model.count(query),
        ]);

        return { rows, lastRowIndex };
    }

    public async createRuleBreachAlert(ruleBreachAlertData: Omit<IRuleBreach, 'createdAt'>) {
        return this.model.create(ruleBreachAlertData);
    }

    public async getRuleBreachAlertsById(ruleBreachAlertId: string) {
        return this.model.findById(ruleBreachAlertId).orFail(new RuleBreachDoesNotExistError(ruleBreachAlertId, 'alert')).exec();
    }

    public async getRuleBreachAlertsByRuleId(ruleId: string) {
        return this.model.find({ 'brokenRules.ruleId': ruleId }).lean();
    }
}
