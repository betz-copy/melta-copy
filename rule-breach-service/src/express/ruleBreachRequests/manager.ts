import { translateAgGridFilterModel, translateAgGridSortModel } from '../../utils/agGrid';
import { ActionTypes, IActionMetadata } from '../../utils/interfaces/actionMetadata';
import { IAgGridRequest } from '../../utils/interfaces/agGrid';
import { IBrokenRule, IRuleBreach } from '../../utils/interfaces/ruleBreach';
import { RuleBreachDoesNotExistError } from '../error';
import { IRuleBreachRequest } from './interface';
import RuleBreachRequestsModel from './model';

export class RuleBreachRequestsManager {
    public static async searchRuleBreachRequests(agGridRequest: IAgGridRequest) {
        const { startRow, endRow, sortModel, filterModel } = agGridRequest;

        const sort = translateAgGridSortModel(sortModel);
        const query = translateAgGridFilterModel(filterModel);

        const [rows, lastRowIndex] = await Promise.all([
            RuleBreachRequestsModel.find(query, {}, { skip: startRow, limit: endRow - startRow, sort }).lean(),
            RuleBreachRequestsModel.count(query),
        ]);

        return { rows, lastRowIndex };
    }

    public static async createRuleBreachRequest(ruleBreachRequestData: Omit<IRuleBreach, 'createdAt'>): Promise<IRuleBreachRequest> {
        return RuleBreachRequestsModel.create(ruleBreachRequestData);
    }

    public static async reviewRuleBreachRequest(ruleBreachRequestId: string, reviewerId: string, approved: boolean): Promise<IRuleBreachRequest> {
        return RuleBreachRequestsModel.findByIdAndUpdate(ruleBreachRequestId, { approved, reviewerId, reviewedAt: new Date() }, { new: true })
            .orFail(new RuleBreachDoesNotExistError(ruleBreachRequestId, 'request'))
            .lean();
    }

    public static async updateRuleBreachRequestActionMetadata(
        ruleBreachRequestId: string,
        actionType: ActionTypes,
        actionMetadata: IActionMetadata,
    ): Promise<IRuleBreachRequest> {
        return RuleBreachRequestsModel.findByIdAndUpdate(ruleBreachRequestId, { actionType, actionMetadata }, { new: true })
            .orFail(new RuleBreachDoesNotExistError(ruleBreachRequestId, 'request'))
            .lean();
    }

    public static async updateRuleBreachRequestBrokenRules(ruleBreachRequestId: string, brokenRules: IBrokenRule[]): Promise<IRuleBreachRequest> {
        return RuleBreachRequestsModel.findByIdAndUpdate(ruleBreachRequestId, { brokenRules }, { new: true })
            .orFail(new RuleBreachDoesNotExistError(ruleBreachRequestId, 'request'))
            .lean();
    }

    public static async getRuleBreachRequestById(ruleBreachRequestId: string): Promise<IRuleBreachRequest> {
        return RuleBreachRequestsModel.findById(ruleBreachRequestId).orFail(new RuleBreachDoesNotExistError(ruleBreachRequestId, 'request')).exec();
    }

    public static async getRuleBreachRequestsByRuleId(ruleId: string): Promise<IRuleBreachRequest[]> {
        return RuleBreachRequestsModel.find({ 'brokenRules.ruleId': ruleId }).lean();
    }
}

export default RuleBreachRequestsManager;
