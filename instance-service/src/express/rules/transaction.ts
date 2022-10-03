import { Transaction } from 'neo4j-driver';
import { normalizeRuleResult, runInTransactionAndNormalize } from '../../utils/neo4j/lib';
import { IRuleTransactionQuery, IRuleTransactionResult } from './interfaces';

export const getRuleResults = async (transaction: Transaction, ruleQueries: IRuleTransactionQuery[]): Promise<IRuleTransactionResult[]> => {
    const ruleTransactions = ruleQueries.map(async (ruleTransaction) => {
        const { ruleQuery, ruleId, relationshipId } = ruleTransaction;
        const doesRuleStillApply = await runInTransactionAndNormalize(transaction, ruleQuery.cypherQuery, normalizeRuleResult, ruleQuery.parameters);

        return { doesRuleStillApply, ruleId, relationshipId };
    });

    return Promise.all(ruleTransactions);
};
