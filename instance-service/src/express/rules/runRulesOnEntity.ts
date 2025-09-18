import _groupBy from 'lodash.groupby';
import _difference from 'lodash.difference';
import _mapValues from 'lodash.mapvalues';
import _isEqual from 'lodash.isequal';
import { Transaction } from 'neo4j-driver';
import { IMongoRule, IMongoEntityTemplate } from '@microservices/shared';
import { IRuleFailure } from './interfaces';
import { generateNeo4jRuleQueryOnEntitiesOfTemplate, generateNeo4jRuleQueryOnEntity } from './generateRuleNeo4jQuery';
import { normalizeRuleResultOnEntity, normalizeRuleResultsOnEntitiesOfTemplate, runInTransactionAndNormalize } from '../../utils/neo4j/lib';

export const runRuleOnEntity = async (transaction: Transaction, entityId: string, rule: IMongoRule, entityTemplate: IMongoEntityTemplate) => {
    const ruleQuery = generateNeo4jRuleQueryOnEntity(rule, entityId, entityTemplate);

    return runInTransactionAndNormalize(transaction, ruleQuery.cypherCalculation, normalizeRuleResultOnEntity, ruleQuery.parameters);
};

export const runRuleOnEntitiesOfTemplate = async (
    transaction: Transaction,
    rule: IMongoRule,
    entityTemplate: IMongoEntityTemplate,
    getTodayFuncValue: Date = new Date(),
    returnOnlyFailedResults: boolean = true,
) => {
    const ruleQuery = generateNeo4jRuleQueryOnEntitiesOfTemplate(rule, entityTemplate, getTodayFuncValue, returnOnlyFailedResults);

    return runInTransactionAndNormalize(transaction, ruleQuery.cypherCalculation, normalizeRuleResultsOnEntitiesOfTemplate, ruleQuery.parameters);
};

export const runRulesOnEntity = async (
    transaction: Transaction,
    entityId: string,
    rules: IMongoRule[],
    entityTemplate: IMongoEntityTemplate,
): Promise<IRuleFailure[]> => {
    const ruleResultsPromises = rules.map(async (rule) => {
        const ruleResult = await runRuleOnEntity(transaction, entityId, rule, entityTemplate);

        return { rule, ruleResult };
    });
    const ruleResults = await Promise.all(ruleResultsPromises);

    const ruleFailures = ruleResults
        .filter(({ ruleResult: { value } }) => !value)
        .map(({ rule, ruleResult: { formulaCauses } }) => ({ rule, entityId, formulaCauses }));
    return ruleFailures;
};
