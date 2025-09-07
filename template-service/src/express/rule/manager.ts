import { DefaultManagerMongo, IMongoRule, IRule, NotFoundError } from '@microservices/shared';
import { FilterQuery } from 'mongoose';
import config from '../../config';
import { escapeRegExp } from '../../utils';
import RuleTemplateSchema from './model';

class RuleManager extends DefaultManagerMongo<IMongoRule> {
    constructor(workspaceId: string) {
        super(workspaceId, config.mongo.ruleCollectionName, RuleTemplateSchema);
    }

    async getRuleById(ruleId: string) {
        return this.model.findById(ruleId).orFail(new NotFoundError('Rule not found')).lean().exec();
    }

    async getManyRulesByIds(rulesIds: string[]) {
        return this.model
            .find({ _id: { $in: rulesIds } })
            .lean()
            .exec();
    }

    async updateRuleById(ruleId: string, updatedFields: Omit<IRule, 'formula' | 'entityTemplateId' | 'disabled'>) {
        return this.model.findByIdAndUpdate(ruleId, updatedFields, { new: true }).orFail(new NotFoundError('Rule not found')).lean().exec();
    }

    async updateRuleStatusById(ruleId: string, disabled: boolean) {
        // todo: (extra feature) if enabling again, same as behaviour as creating new rule.
        // ignoring possible breaches in existing entities. make sure client know (popup)

        return this.model.findByIdAndUpdate(ruleId, { disabled }, { new: true }).orFail(new NotFoundError('Rule not found')).lean().exec();
    }

    async deleteRuleById(ruleId: string) {
        // todo: (extra feature) allow to delete if no existing alerts/requests breaches. or maybe allow to delete them together
        return this.model.findByIdAndDelete(ruleId).orFail(new NotFoundError('Rule not found')).lean().exec();
    }

    async createRule(rule: Omit<IRule, 'disabled'>) {
        // todo: (extra feature) ignoring possible breaches in existing entities. make sure client know (popup)
        return this.model.create({ ...rule, disabled: false });
    }

    async searchRules(searchBody: { search?: string; entityTemplateIds?: string[]; disabled?: boolean; limit: number; skip: number }) {
        const { search, entityTemplateIds, disabled, limit, skip } = searchBody;
        const query: FilterQuery<IMongoRule> = {};

        if (disabled !== undefined) {
            query.disabled = disabled;
        }

        if (search) {
            query.name = { $regex: escapeRegExp(search) };
        }

        if (entityTemplateIds) {
            query.entityTemplateId = { $in: entityTemplateIds };
        }

        return this.model.find(query).limit(limit).skip(skip).lean().exec();
    }
}

export default RuleManager;
