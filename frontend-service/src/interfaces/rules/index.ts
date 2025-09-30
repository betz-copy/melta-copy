import { IFormula } from './formula';

export enum ActionOnFail {
    WARNING = 'WARNING',
    ENFORCEMENT = 'ENFORCEMENT',
    INDICATOR = 'INDICATOR',
}

export interface IRule {
    name: string;
    description: string;
    actionOnFail: ActionOnFail;
    entityTemplateId: string;
    formula: IFormula;
    disabled: boolean;
    fieldColor?: { display: boolean; field: string; color: string };
    mail?: { display: boolean; title: string; body: string; sendPermissionUsers: boolean; sendAssociatedUsers: boolean };
    doesFormulaHaveTodayFunc: boolean;
}

export interface IMongoRule extends IRule {
    _id: string;
}

export type IRuleMap = Map<string, IMongoRule>;

export interface ISearchRuleBody {
    search?: string;
    entityTemplateIds?: string[];
    disabled?: boolean;
    limit: number;
    skip: number;
}
