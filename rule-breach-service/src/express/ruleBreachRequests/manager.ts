import config from '../../config';
import { translateAgGridFilterModel, translateAgGridSortModel } from '../../utils/agGrid';
import { ActionTypes, IActionMetadata } from '../../utils/interfaces/actionMetadata';
import { IAgGridRequest } from '../../utils/interfaces/agGrid';
import { IBrokenRule, IRuleBreach } from '../../utils/interfaces/ruleBreach';
import { DefaultManagerMongo } from '../../utils/mongo/manager';
import { RuleBreachDoesNotExistError } from '../error';
import { IRuleBreachRequest, RuleBreachRequestStatus } from './interface';
import { RuleBreachRequestsSchema } from './model';

export default class RuleBreachRequestsManager extends DefaultManagerMongo<IRuleBreachRequest> {
    constructor(dbName: string) {
        super(dbName, config.mongo.ruleBreachRequestsCollectionName, RuleBreachRequestsSchema);
    }

    public async searchRuleBreachRequests(agGridRequest: IAgGridRequest) {
        const { startRow, endRow, sortModel, filterModel } = agGridRequest;

        const sort = translateAgGridSortModel(sortModel);
        const query = translateAgGridFilterModel(filterModel);

        const [rows, lastRowIndex] = await Promise.all([
            this.model.find(query, {}, { skip: startRow, limit: endRow - startRow, sort }).lean(),
            this.model.count(query),
        ]);

        return { rows, lastRowIndex };
    }

    public static async getManyRuleBreachRequests(ids: string[]) {
        return RuleBreachRequestsModel.find({ _id: { $in: ids } });
    }

    public static async createRuleBreachRequest(
        ruleBreachRequestData: Omit<IRuleBreach, '_id' | 'createdAt' | 'status'>,
    ): Promise<IRuleBreachRequest> {
        return RuleBreachRequestsModel.create({ ...ruleBreachRequestData, status: RuleBreachRequestStatus.Pending });
    }

    public async updateRuleBreachRequestStatus(
        ruleBreachRequestId: string,
        reviewerId: string,
        status: RuleBreachRequestStatus,
    ): Promise<IRuleBreachRequest> {
        return this.model
            .findByIdAndUpdate(ruleBreachRequestId, { status, reviewerId, reviewedAt: new Date() }, { new: true })
            .orFail(new RuleBreachDoesNotExistError(ruleBreachRequestId, 'request'))
            .lean();
    }

    public static async updateRuleBreachRequestActionsMetadatas(
        ruleBreachRequestId: string,
        actions: {
            actionType: ActionTypes;
            actionMetadata: IActionMetadata;
        }[],
    ): Promise<IRuleBreachRequest> {
        return RuleBreachRequestsModel.findByIdAndUpdate(ruleBreachRequestId, { actions }, { new: true })
            .orFail(new RuleBreachDoesNotExistError(ruleBreachRequestId, 'request'))
            .lean();
    }

    public async updateRuleBreachRequestBrokenRules(ruleBreachRequestId: string, brokenRules: IBrokenRule[]): Promise<IRuleBreachRequest> {
        return this.model
            .findByIdAndUpdate(ruleBreachRequestId, { brokenRules }, { new: true })
            .orFail(new RuleBreachDoesNotExistError(ruleBreachRequestId, 'request'))
            .lean();
    }

    public async getRuleBreachRequestById(ruleBreachRequestId: string): Promise<IRuleBreachRequest> {
        return this.model.findById(ruleBreachRequestId).orFail(new RuleBreachDoesNotExistError(ruleBreachRequestId, 'request')).exec();
    }

    public async getRuleBreachRequestsByRuleId(ruleId: string): Promise<IRuleBreachRequest[]> {
        return this.model.find({ 'brokenRules.ruleId': ruleId }).lean();
    }
}
