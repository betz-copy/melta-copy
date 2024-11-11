import { IFormula } from './formula';

export interface IRule {
    name: string;
    description: string;
    actionOnFail: 'WARNING' | 'ENFORCEMENT';
    entityTemplateId: string;
    formula: IFormula;
    disabled: boolean;
}

export interface IMongoRule extends IRule {
    _id: string;
}
