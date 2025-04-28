import _groupBy from 'lodash.groupby';
import _difference from 'lodash.difference';
import _mapValues from 'lodash.mapvalues';
import _isEqual from 'lodash.isequal';
import { Transaction } from 'neo4j-driver';
import { IRuleFailure } from './interfaces';
import { generateNeo4jRuleQueryOnEntity } from './generateRuleNeo4jQuery';
import { IMongoRule } from '../../externalServices/templates/interfaces/rules';
import { normalizeRuleResult, runInTransactionAndNormalize } from '../../utils/neo4j/lib';

export const runRuleOnEntity = async (transaction: Transaction, entityId: string, rule: IMongoRule) => {
    const ruleQuery = generateNeo4jRuleQueryOnEntity(rule, entityId);

    const ruleResult = await runInTransactionAndNormalize(transaction, ruleQuery.cypherCalculation, normalizeRuleResult, ruleQuery.parameters);
    console.dir({ ruleQuery, ruleResult }, { depth: null });

    return ruleResult;
};

export const runRulesOnEntity = async (transaction: Transaction, entityId: string, rules: IMongoRule[]): Promise<IRuleFailure[]> => {
    const ruleResultsPromises = rules.map(async (rule) => {
        const ruleResult = await runRuleOnEntity(transaction, entityId, rule);

        return { rule, ruleResult };
    });
    const ruleResults = await Promise.all(ruleResultsPromises);
    console.dir({ ruleResults }, { depth: null });

    const ruleFailures = ruleResults
        .filter(({ ruleResult: { value } }) => !value)
        .map(({ rule, ruleResult: { formulaCauses } }) => ({ rule, entityId, formulaCauses }));

    return ruleFailures;
};
