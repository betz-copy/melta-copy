import axios from 'axios';
import _groupBy from 'lodash.groupby';
import _difference from 'lodash.difference';
import { trycatch } from '../../utils/lib';
import { ValidationError } from '../error';
import { IBrokenRule, IMongoRelationshipTemplateRule, IRuleRequestSchema, IRuleTransactionResult } from './interfaces';
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

export const getBrokenRules = (ruleResults: IRuleTransactionResult[]) => {
    const resultsByRuleId = _groupBy(
        ruleResults.filter((ruleResult) => !ruleResult.doesRuleStillApply),
        'ruleId',
    );

    const brokenRules = Object.entries(resultsByRuleId).map(([ruleId, ruleTransactionResults]) => {
        const relationshipIds = ruleTransactionResults.map((ruleTransactionResult) => ruleTransactionResult.relationshipId);

        return { ruleId, relationshipIds };
    });

    return brokenRules;
};

export const areAllBrokenRulesIgnored = (brokenRules: IBrokenRule[], ignoredRules: IBrokenRule[]) => {
    return brokenRules.every((brokenRule) => {
        const ignoredRule = ignoredRules.find(({ ruleId }) => ruleId === brokenRule.ruleId);

        if (!ignoredRule) {
            return false;
        }

        return _difference(brokenRule.relationshipIds, ignoredRule.relationshipIds).length === 0;
    });
};
