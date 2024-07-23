import { Document, FilterQuery } from 'mongoose';
import { escapeRegExp } from '../../utils';
import DefaultManagerMongo from '../../utils/mongo/manager';
import { ServiceError } from '../error';
import { IRule } from './interfaces';
import RuleModel from './model';

export class RuleManager extends DefaultManagerMongo<IRule> {
    constructor(dbName: string) {
        super(dbName, RuleModel);
    }

    async getRuleById(templateId: string) {
        return this.model.findById(templateId).orFail(new ServiceError(404, 'Rule not found')).lean().exec();
    }

    async updateRuleById(ruleId: string, updatedFields: Pick<IRule, 'name' | 'description'>) {
        return this.model.findByIdAndUpdate(ruleId, updatedFields, { new: true }).orFail(new ServiceError(404, 'Rule not found')).lean().exec();
    }

    async updateRuleStatusById(ruleId: string, disabled: boolean) {
        // todo: (extra feature) if enabling again, same as behaviour as creating new rule.
        // ignoring possible breaches in existing entities. make sure client know (popup)

        return this.model.findByIdAndUpdate(ruleId, { disabled }, { new: true }).orFail(new ServiceError(404, 'Rule not found')).lean().exec();
    }

    async deleteRuleById(ruleId: string) {
        // todo: (extra feature) allow to delete if no existing alerts/requests breaches. or maybe allow to delete them together
        return this.model.findByIdAndDelete(ruleId).orFail(new ServiceError(404, 'Rule not found')).lean().exec();
    }

    async createRule(rule: Omit<IRule, 'disabled'>) {
        // todo: (extra feature) ignoring possible breaches in existing entities. make sure client know (popup)
        return this.model.create({ ...rule, disabled: false });
    }

    async searchRules(searchBody: { search?: string; entityTemplateIds?: string[]; disabled?: boolean; limit: number; skip: number }) {
        const { search, entityTemplateIds, disabled, limit, skip } = searchBody;
        const query: FilterQuery<IRule & Document<any, any, any>> = {};

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
