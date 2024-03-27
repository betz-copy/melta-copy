import { Document, FilterQuery } from 'mongoose';
import RuleModel from './model';
import { IRule } from './interfaces';
import { ServiceError } from '../error';
import { escapeRegExp } from '../../utils';

export class RuleManager {
    static getRuleById(templateId: string) {
        return RuleModel.findById(templateId).orFail(new ServiceError(404, 'Rule not found')).lean().exec();
    }

    static async updateRuleById(ruleId: string, updatedFields: Pick<IRule, 'name' | 'description'>) {
        return RuleModel.findByIdAndUpdate(ruleId, updatedFields, { new: true }).orFail(new ServiceError(404, 'Rule not found')).lean().exec();
    }

    static async updateRuleStatusById(ruleId: string, disabled: boolean) {
        // todo: (extra feature) if enabling again, same as behaviour as creating new rule.
        // ignoring possible breaches in existing entities. make sure client know (popup)

        return RuleModel.findByIdAndUpdate(ruleId, { disabled }, { new: true }).orFail(new ServiceError(404, 'Rule not found')).lean().exec();
    }

    static async deleteRuleById(ruleId: string) {
        // todo: (extra feature) allow to delete if no existing alerts/requests breaches. or maybe allow to delete them together
        return RuleModel.findByIdAndDelete(ruleId).orFail(new ServiceError(404, 'Rule not found')).lean().exec();
    }

    static async createRule(rule: Omit<IRule, 'disabled'>) {
        // todo: (extra feature) ignoring possible breaches in existing entities. make sure client know (popup)
        return RuleModel.create({ ...rule, disabled: false });
    }

    static async getAllRules() {
        return RuleModel.find();
    }

    static searchRules(searchBody: {
        search?: string;
        relationshipTemplateIds?: string[];
        pinnedEntityTemplateIds?: string[];
        unpinnedEntityTemplateIds?: string[];
        disabled?: boolean;
        limit: number;
        skip: number;
    }) {
        const { search, relationshipTemplateIds, pinnedEntityTemplateIds, unpinnedEntityTemplateIds, disabled, limit, skip } = searchBody;
        const query: FilterQuery<IRule & Document<any, any, any>> = {};

        if (disabled !== undefined) {
            query.disabled = disabled;
        }

        if (search) {
            query.name = { $regex: escapeRegExp(search) };
        }

        if (relationshipTemplateIds) {
            query.relationshipTemplateId = { $in: relationshipTemplateIds };
        }

        if (pinnedEntityTemplateIds) {
            query.pinnedEntityTemplateId = { $in: pinnedEntityTemplateIds };
        }

        if (unpinnedEntityTemplateIds) {
            query.unpinnedEntityTemplateId = { $in: unpinnedEntityTemplateIds };
        }

        return RuleModel.find(query).limit(limit).skip(skip).lean().exec();
    }
}
