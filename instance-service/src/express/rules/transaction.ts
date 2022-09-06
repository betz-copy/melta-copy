import { QueryResult, Transaction } from 'neo4j-driver';
import { normalizeRelAndEntitiesForRule, normalizeRuleResult } from '../../utils/neo4j/lib';
import { IMongoRelationshipTemplateRule, IRuleTransactionQuery, IRuleTransactionResult } from './interfaces';
import { isRelationshipLegal } from './lib';

export const getRuleResults = async (transaction: Transaction, ruleQueries: IRuleTransactionQuery[]): Promise<IRuleTransactionResult[]> => {
    const ruleTransactions = ruleQueries.map(async (ruleTransaction) => {
        const { ruleQuery, ruleId, relationshipId } = ruleTransaction;
        const result = await transaction.run(ruleQuery.cypherQuery, ruleQuery.parameters);

        return { doesRuleStillApply: normalizeRuleResult(result), ruleId, relationshipId };
    });

    return Promise.all(ruleTransactions);
};

export const createRuleQuery = (queryResult: QueryResult, rules: IMongoRelationshipTemplateRule[]) => {
    return normalizeRelAndEntitiesForRule(queryResult).map((path) =>
        isRelationshipLegal(path.relationship, path.sourceEntity, path.destinationEntity, rules),
    );
};
