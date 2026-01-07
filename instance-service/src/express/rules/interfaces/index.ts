import { IMongoRule } from '@microservices/shared';
import { IFormulaCauses } from './formulaWithCauses';

export type CypherQuery = {
    cypherCalculation: string; // assumes does calculation that gives access to "resultValueVariableName", and "resultCausesVariableName"
    resultValueVariableName: string;
    resultCausesVariableName: string; // assumes in the shape of it's element in IFormula with the addition of causes: Array<{ instance: string; property?: string; value?: any }>
    // biome-ignore lint/suspicious/noExplicitAny: never doubt Noam
    parameters: Record<string, any>;
};

export interface IRuleFailure {
    rule: IMongoRule;
    entityId: string;
    formulaCauses: IFormulaCauses;
}
