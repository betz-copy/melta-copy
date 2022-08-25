import { translateAgGridFilterModel, translateAgGridSortModel } from '../../utils/agGrid';
import { ActionTypes, IActionMetadata } from '../../utils/interfaces/actionMetadata';
import { IAgGridRequest } from '../../utils/interfaces/agGrid';
import { IRuleBreach } from '../../utils/interfaces/ruleBreach';
import { RuleBreachDoesNotExistError } from '../error';
import { IRuleBreachRequestDocument } from './interface';
import RuleBreachRequestsModel from './model';

export class RuleBreachRequestsManager {
    public static async searchRuleBreachRequests(agGridRequest: IAgGridRequest): Promise<IRuleBreachRequestDocument[]> {
        const { startRow, endRow, sortModel, filterModel } = agGridRequest;

        const sort = translateAgGridSortModel(sortModel);
        const query = await translateAgGridFilterModel(filterModel);

        return RuleBreachRequestsModel.find(query, {}, { skip: startRow, limit: endRow - startRow, sort }).exec();
    }

    public static async createRuleBreachRequest(ruleBreachRequestData: Omit<IRuleBreach, 'createdAt'>): Promise<IRuleBreachRequestDocument> {
        return RuleBreachRequestsModel.create(ruleBreachRequestData);
    }

    public static async reviewRuleBreachRequest(
        ruleBreachRequestId: string,
        reviewerId: string,
        approved: boolean,
    ): Promise<IRuleBreachRequestDocument> {
        return RuleBreachRequestsModel.findByIdAndUpdate(ruleBreachRequestId, { approved, reviewerId, reviewedAt: new Date() }, { new: true })
            .orFail(new RuleBreachDoesNotExistError(ruleBreachRequestId, 'request'))
            .exec();
    }

    public static async updateRuleBreachRequestActionMetadata(
        ruleBreachRequestId: string,
        actionType: ActionTypes,
        actionMetadata: IActionMetadata,
    ): Promise<IRuleBreachRequestDocument> {
        return RuleBreachRequestsModel.findByIdAndUpdate(ruleBreachRequestId, { actionType, actionMetadata }, { new: true })
            .orFail(new RuleBreachDoesNotExistError(ruleBreachRequestId, 'request'))
            .exec();
    }

    public static async getRuleBreachRequestById(ruleBreachRequestId: string): Promise<IRuleBreachRequestDocument> {
        return RuleBreachRequestsModel.findById(ruleBreachRequestId).orFail(new RuleBreachDoesNotExistError(ruleBreachRequestId, 'request')).exec();
    }
}

export default RuleBreachRequestsManager;
