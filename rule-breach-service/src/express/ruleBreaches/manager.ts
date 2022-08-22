/* eslint-disable default-case */
import { translateAgGridFilterModel, translateAgGridSortModel } from '../../utils/agGrid';
import { IActionMetadata } from '../../utils/interfaces';
import { IAgGridRequest } from '../../utils/interfaces/agGrid';
import { RuleBreachDoesNotExistError } from '../error';
import { IRuleBreachDocument } from './interface';
import RuleBreachesModel from './model';

export class RuleBreachesManager {
    public static async searchRuleBreaches(originUserId: string, agGridRequest: IAgGridRequest): Promise<IRuleBreachDocument[]> {
        const { startRow, endRow, sortModel, filterModel } = agGridRequest;

        const limit = endRow - startRow;
        const skip = startRow;

        const sort = translateAgGridSortModel(sortModel);

        const query = await translateAgGridFilterModel(filterModel);
        if (originUserId) query.originUserId = originUserId;

        return RuleBreachesModel.find(query, {}, { skip, limit, sort }).exec();
    }

    public static async updateRuleBreachActionMetadata(ruleBreachId: string, actionMetadata: IActionMetadata): Promise<IRuleBreachDocument> {
        return RuleBreachesModel.findByIdAndUpdate(ruleBreachId, { actionMetadata }).orFail(new RuleBreachDoesNotExistError(ruleBreachId)).exec();
    }

    public static async getRuleBreachById(ruleBreachId: string): Promise<IRuleBreachDocument> {
        return RuleBreachesModel.findById(ruleBreachId).orFail(new RuleBreachDoesNotExistError(ruleBreachId)).exec();
    }
}

export default RuleBreachesManager;
