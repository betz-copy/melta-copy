import { ActionOnFail, IBrokenRule, IMongoRule } from '@microservices/shared';
import pLimit from 'p-limit';
import { getNeo4jDateTime, normalizeReturnedEntity, runInTransactionAndNormalize } from '../../utils/neo4j/lib';
import Neo4jClient from '../../utils/neo4j';
import config from '../../config';

const {
    neo4j: { colorPropertySuffix, updateColorsForRulesWithTodayFuncParallelLimit },
} = config;

const getColoredFields = (indicatorRules: IMongoRule[]) => {
    return indicatorRules.reduce<Record<string, string>>((acc, rule) => {
        acc[`${rule.fieldColor!.field}${colorPropertySuffix}`] = rule.fieldColor!.color;
        return acc;
    }, {});
};

const getIndicatorRulesByEntityId = (rules: Map<string, IMongoRule>, brokenRules: IBrokenRule[]) => {
    return brokenRules.reduce<Record<string, IMongoRule[]>>((indicatorRulesByEntityId, brokenRule) => {
        const rule = rules.get(brokenRule.ruleId)!;
        if (rule.actionOnFail !== ActionOnFail.INDICATOR) return indicatorRulesByEntityId;

        brokenRule.failures.forEach((ruleFailure) => {
            if (!indicatorRulesByEntityId[ruleFailure.entityId]) {
                // eslint-disable-next-line no-param-reassign
                indicatorRulesByEntityId[ruleFailure.entityId] = [rule];
            }

            indicatorRulesByEntityId[ruleFailure.entityId].push(rule);
        });

        return indicatorRulesByEntityId;
    }, {});
};

export const updateColorsForIndicatorRulesWithTodayFunc = (neo4jClient: Neo4jClient, rules: Map<string, IMongoRule>, brokenRules: IBrokenRule[]) => {
    const parallelLimit = pLimit(updateColorsForRulesWithTodayFuncParallelLimit);

    const indicatorRulesByEntityId = getIndicatorRulesByEntityId(rules, brokenRules);

    return neo4jClient.performComplexTransaction('writeTransaction', async (transaction) => {
        const updateEntitiesPromises = Object.entries(indicatorRulesByEntityId).map(async ([entityId, indicatorRules]) => {
            const updatedColoredFields = getColoredFields(indicatorRules);

            await parallelLimit(() =>
                runInTransactionAndNormalize(
                    transaction,
                    `MATCH (e {_id: '${entityId}'})
                         SET e += $props
                         RETURN e`,
                    normalizeReturnedEntity('singleResponseNotNullable'),
                    {
                        props: {
                            ...updatedColoredFields,
                            updatedAt: getNeo4jDateTime(),
                        },
                    },
                ),
            );
        });

        return Promise.all(updateEntitiesPromises);
    });
};
