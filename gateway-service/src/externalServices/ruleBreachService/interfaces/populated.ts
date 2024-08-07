import {
    ActionTypes,
    IBrokenRule,
    ICreateEntityMetadata,
    ICreateRelationshipMetadata,
    IDeleteRelationshipMetadata,
    IDuplicateEntityMetadata,
    IRuleBreach,
    IUpdateEntityMetadata,
    IUpdateEntityStatusMetadata,
    RuleBreachRequestStatus,
} from '.';
import { IUser } from '../../../express/users/interface';
import { IEntity } from '../../instanceService/interfaces/entities';

export interface ICreateRelationshipMetadataPopulated extends Omit<ICreateRelationshipMetadata, 'sourceEntityId' | 'destinationEntityId'> {
    sourceEntity: IEntity | string | null;
    destinationEntity: IEntity | string | null;
}

export interface IDeleteRelationshipMetadataPopulated extends Omit<IDeleteRelationshipMetadata, 'sourceEntityId' | 'destinationEntityId'> {
    sourceEntity: IEntity | string | null;
    destinationEntity: IEntity | string | null;
}

export interface ICreateEntityMetadataPopulated extends ICreateEntityMetadata {}
export interface IDuplicateEntityMetadataPopulated extends Omit<IDuplicateEntityMetadata, 'entityIdToDuplicate'> {
    entityToDuplicate: IEntity | string | null;
}

export interface IUpdateEntityMetadataPopulated extends Omit<IUpdateEntityMetadata, 'entityId'> {
    entity: IEntity | null;
}

export interface IUpdateEntityStatusMetadataPopulated extends Omit<IUpdateEntityStatusMetadata, 'entityId'> {
    entity: IEntity | null;
}

export type IActionMetadataPopulated =
    | ICreateRelationshipMetadataPopulated
    | IDeleteRelationshipMetadataPopulated
    | ICreateEntityMetadataPopulated
    | IUpdateEntityMetadataPopulated
    | IUpdateEntityStatusMetadataPopulated;

export type IEntityForBrokenRules = IEntity | string | null;
export type IRelationshipForBrokenRules = IEntity | string | null;

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

export interface IRuleBreachAlertPopulated extends IRuleBreachPopulated {}
export interface IRuleBreachRequestPopulated extends IRuleBreachPopulated {
    reviewer?: IUser;
    reviewedAt?: Date;
    status: RuleBreachRequestStatus;
}
