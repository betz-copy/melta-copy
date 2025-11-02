import { IEntity } from '../entities';
import { IRelationshipPopulated } from '../relationships';
import { IUser } from '../users';
import { IAction, IActionPopulated } from './actionMetadata';

export interface ICauseInstance {
    // same format of IVariable in Formula interfaces, but with instance ids
    entityId: string;
    aggregatedRelationship?: {
        relationshipId: string;
        otherEntityId: string;
    };
}

export interface ICausesOfInstance {
    instance: ICauseInstance;
    properties: string[]; // can be empty array, if the only cause is not related to specific property (i.e. count aggregation)
}

export interface IBrokenRule {
    ruleId: string;
    failures: Array<{ entityId: string; causes: ICausesOfInstance[] }>;
}

export interface IRuleBreach {
    _id: string;
    originUserId: string;
    actions: IAction[];
    brokenRules: IBrokenRule[];
    createdAt: Date;
}

export type IEntityForBrokenRules = IEntity | string | null;
export type IRelationshipForBrokenRules = IRelationshipPopulated | string | null;

export interface ICauseInstancePopulated {
    entity: IEntityForBrokenRules;
    aggregatedRelationship?: {
        relationship: IRelationshipForBrokenRules;
        otherEntity: IEntityForBrokenRules;
    };
}

export interface ICausesOfInstancePopulated {
    instance: ICauseInstancePopulated;
    properties: string[];
}

export interface IBrokenRulePopulated extends Omit<IBrokenRule, 'failures'> {
    ruleId: string;
    failures: Array<{
        entity: IEntityForBrokenRules;
        causes: ICausesOfInstancePopulated[];
    }>;
}

export interface IRuleBreachPopulated {
    _id: string;
    originUser: IUser;
    brokenRules: IBrokenRulePopulated[];
    actions: IActionPopulated[];
    createdAt: Date;
}

export type BreachType = 'alert' | 'request';
