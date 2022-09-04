import axios from 'axios';
import { trycatch } from '../../utils/lib';
import { ValidationError } from '../error';
import { IMongoRelationshipTemplateRule, IRuleRequestSchema } from './interfaces';
import { RuleTransactionResult } from '../relationships/interface';
import config from '../../config';

const { relationshipManager } = config;
const { url, searchRulesRoute, timeout } = relationshipManager;

export const searchRuleTemplates = async (ruleRequest: IRuleRequestSchema) => {
    const { result, err } = await trycatch(() => axios.post<IMongoRelationshipTemplateRule[]>(`${url}${searchRulesRoute}`, ruleRequest, { timeout }));

    if (err || !result) {
        throw new ValidationError(`Failed to fetch rule template schema.`);
    }

    return result.data;
};

export const areAllRulesLegal = (ruleResults: RuleTransactionResult[]) => ruleResults.every((ruleResult) => ruleResult.doesRuleStillApply);
