import {
    IRuleBreachRequest,
    RuleBreachRequestStatus,
    ActionTypes,
    IActionMetadata,
    IBrokenRule,
    IRuleBreach,
    IAgGridRequest,
    DefaultManagerMongo,
} from '@microservices/shared';
import config from '../../config';
import { translateAgGridFilterModel, translateAgGridSortModel } from '../../utils/agGrid';
import { RuleBreachDoesNotExistError } from '../error';
import RuleBreachRequestsSchema from './model';

export default class RuleBreachRequestsManager extends DefaultManagerMongo<IRuleBreachRequest> {
    constructor(workspaceId: string) {
        super(workspaceId, config.mongo.ruleBreachRequestsCollectionName, RuleBreachRequestsSchema);
    }

    public async searchRuleBreachRequests(agGridRequest: IAgGridRequest) {
        const { startRow, endRow, sortModel, filterModel } = agGridRequest;

        const sort = translateAgGridSortModel(sortModel || []);
        const query = translateAgGridFilterModel(filterModel);

        const [rows, lastRowIndex] = await Promise.all([
            this.model.find(query, {}, { skip: startRow, limit: endRow - startRow, sort }).lean(),
            this.model.countDocuments(query),
        ]);

        return { rows, lastRowIndex };
    }

    public async getManyRuleBreachRequests(ids: string[]) {
        return this.model.find({ _id: { $in: ids } });
    }

    public async createRuleBreachRequest(ruleBreachRequestData: Omit<IRuleBreach, '_id' | 'createdAt' | 'status'>): Promise<IRuleBreachRequest> {
        return this.model.create({ ...ruleBreachRequestData, status: RuleBreachRequestStatus.Pending });
    }

    public async updateManyRuleBreachRequestsStatusesByRelatedEntityId(
        entityId: string,
        status: RuleBreachRequestStatus,
    ): Promise<IRuleBreachRequest[]> {
        const statusFilter = { status: RuleBreachRequestStatus.Pending };
        const brokenRulesEntityIdConditions = [
            { 'failures.entityId': entityId },
            { 'failures.causes.instance.entityId': entityId },
            { 'failures.causes.instance.aggregatedRelationship.otherEntityId': entityId },
        ];
        const actionsEntityIdConditions = [
            { 'actionMetadata.sourceEntityId': entityId },
            { 'actionMetadata.destinationEntityId': entityId },
            { 'actionMetadata.properties._id': entityId },
            { 'actionMetadata.entityIdToDuplicate': entityId },
            { 'actionMetadata.entityId': entityId },
        ];
        const filter = {
            $and: [
                statusFilter,
                {
                    $or: [
                        {
                            brokenRules: {
                                $elemMatch: {
                                    failures: {
                                        $elemMatch: {
                                            $or: brokenRulesEntityIdConditions,
                                        },
                                    },
                                },
                            },
                        },
                        {
                            actions: {
                                $elemMatch: {
                                    $or: actionsEntityIdConditions,
                                },
                            },
                        },
                    ],
                },
            ],
        };

        return this.model.updateMany(filter, { status, new: true }).lean<IRuleBreachRequest[]>();
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

    public async updateRuleBreachRequestActionsMetadatas(
        ruleBreachRequestId: string,
        actions: {
            actionType: ActionTypes;
            actionMetadata: IActionMetadata;
        }[],
    ): Promise<IRuleBreachRequest> {
        return this.model
            .findByIdAndUpdate(ruleBreachRequestId, { actions }, { new: true })
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
