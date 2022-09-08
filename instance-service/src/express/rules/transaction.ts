import { QueryResult, Transaction } from 'neo4j-driver';
import { normalizeRuleResult } from '../../utils/neo4j/lib';
import { IRuleTransactionQuery, IRuleTransactionResult } from './interfaces';

export const transactionRunAndNormalize = async <T>(
    transaction: Transaction,
    cypherQuery: string,
    normalizeFunction: (queryResult: QueryResult) => T,
    parameters?: Record<string, any>,
): Promise<T> => {
    const result = await transaction.run(cypherQuery, parameters);

    return normalizeFunction(result);
};

export const getRuleResults = async (transaction: Transaction, ruleQueries: IRuleTransactionQuery[]): Promise<IRuleTransactionResult[]> => {
    const ruleTransactions = ruleQueries.map(async (ruleTransaction) => {
        const { ruleQuery, ruleId, relationshipId } = ruleTransaction;
        const doesRuleStillApply = await transactionRunAndNormalize(transaction, ruleQuery.cypherQuery, normalizeRuleResult, ruleQuery.parameters);

        return { doesRuleStillApply, ruleId, relationshipId };
    });

    return Promise.all(ruleTransactions);
};
