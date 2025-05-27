import { IEntity } from '../entity';
import { IRelationshipPopulated } from '../relationship';
import { IUser } from '../user';
import { IActionMetadata, ActionTypes, IActionMetadataPopulated } from './actionMetadata';

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

export interface IAction {
    actionType: ActionTypes;
    actionMetadata: IActionMetadata;
}

export interface IRuleBreach {
    originUserId: string;
    actions: IAction[];
    brokenRules: IBrokenRule[];
    createdAt: Date;
    _id: string;
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

export interface IRuleBreachPopulated extends Omit<IRuleBreach, 'originUserId' | 'brokenRules' | 'actions'> {
    originUser: IUser;
    brokenRules: IBrokenRulePopulated[];
    actions: {
        actionType: ActionTypes;
        actionMetadata: IActionMetadataPopulated;
    }[];
}

export type BreachType = 'alert' | 'request';
