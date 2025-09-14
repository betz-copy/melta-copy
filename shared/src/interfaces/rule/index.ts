import { IEntity } from '../entity';
import { IEntityTemplatePopulated } from '../entityTemplate';
import { IMongoRelationshipTemplate } from '../relationshipTemplate';
import { IFormula } from './formula';

export enum ActionOnFail {
    WARNING = 'WARNING',
    ENFORCEMENT = 'ENFORCEMENT',
    INDICATOR = 'INDICATOR',
}

export interface IRuleMail {
    display: boolean;
    title: string;
    body: string;
    sendPermissionUsers: boolean;
    sendAssociatedUsers: boolean;
}

export interface IBulkRuleMail extends IRuleMail {
    entity: IEntity;
}

export interface IRule {
    name: string;
    description: string;
    actionOnFail: ActionOnFail;
    entityTemplateId: string;
    formula: IFormula;
    disabled: boolean;
    fieldColor?: { display: boolean; field: string; color: string };
    mail?: IRuleMail;
}
export interface IMongoRule extends IRule {
    _id: string;
}
export type IRuleMap = Map<string, IMongoRule>;

export interface ISearchRulesBody {
    search?: string;
    entityTemplateIds?: string[];
    disabled?: boolean;
    limit?: number;
    skip?: number;
}

export interface IRelevantTemplates {
    entityTemplate: IEntityTemplatePopulated;
    connectionsTemplatesOfEntityTemplate: Array<{
        relationshipTemplate: IMongoRelationshipTemplate;
        otherEntityTemplate: IEntityTemplatePopulated;
    }>;
}

export * from './formula';
