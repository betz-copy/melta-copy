import { IMongoRule } from '../../../externalServices/templates/interfaces/rules';
import { IFormulaCauses } from './formulaWithCauses';
import { ICauseInstance } from './formulaWithCauses/cause';

export type CypherQuery = {
    cypherCalculation: string; // assumes does calculation that gives access to "resultValueVariableName", and "resultCausesVariableName"
    resultValueVariableName: string;
    resultCausesVariableName: string; // assumes in the shape of it's element in IFormula with the addition of causes: Array<{ instance: string; property?: string; value?: any }>
    parameters: Record<string, any>;
};

export interface ICausesOfInstance {
    instance: ICauseInstance;
    properties: string[]; // can be empty array, if the only cause is not related to specific property (i.e. count aggregation)
}

export interface IBrokenRule {
    ruleId: string;
    failures: Array<{ entityId: string; causes: ICausesOfInstance[] }>;
}

export interface IRuleFailure {
    rule: IMongoRule;
    entityId: string;
    formulaCauses: IFormulaCauses;
}
