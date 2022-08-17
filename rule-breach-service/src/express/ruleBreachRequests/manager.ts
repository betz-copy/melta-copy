import { RuleBreachRequestDoesNotExistError } from '../error';
import { IRuleBreach } from '../ruleBreaches/interface';
import { IRuleBreachRequestDocument } from './interface';
import RuleBreachRequestsModel from './model';

export class RuleBreachAlertsManager {
    public static async createRuleBreachRequest(ruleBreachRequestData: Omit<IRuleBreach, 'createdAt'>): Promise<IRuleBreachRequestDocument> {
        return RuleBreachRequestsModel.create(ruleBreachRequestData);
    }

    public static async reviewRuleBreachRequest(
        ruleBreachRequestId: string,
        reviewerId: string,
        approved: boolean,
    ): Promise<IRuleBreachRequestDocument> {
        return RuleBreachRequestsModel.findByIdAndUpdate(ruleBreachRequestId, { approved, reviewerId, reviewedAt: new Date() }, { new: true })
            .orFail(new RuleBreachRequestDoesNotExistError(ruleBreachRequestId))
            .exec();
    }
}

export default RuleBreachAlertsManager;
