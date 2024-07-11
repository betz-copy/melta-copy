import {
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
    sourceEntity: IEntity | null;
    destinationEntity: IEntity | null;
}

export interface IDeleteRelationshipMetadataPopulated extends Omit<IDeleteRelationshipMetadata, 'sourceEntityId' | 'destinationEntityId'> {
    sourceEntity: IEntity | null;
    destinationEntity: IEntity | null;
}

export interface ICreateEntityMetadataPopulated extends ICreateEntityMetadata {}
export interface IDuplicateEntityMetadataPopulated extends Omit<IDuplicateEntityMetadata, 'entityIdToDuplicate'> {
    entityToDuplicate: IEntity | null;
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

export type IEntityForBrokenRules = IEntity | 'created-entity-id' | null;
export type IRelationshipForBrokenRules = IEntity | 'created-relationship-id' | null;

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

export interface IRuleBreachPopulated<T = IActionMetadataPopulated> extends Omit<IRuleBreach<T>, 'originUserId' | 'brokenRules'> {
    originUser: IUser;
    brokenRules: IBrokenRulePopulated[];
}

export interface IRuleBreachAlertPopulated<T = IActionMetadataPopulated> extends IRuleBreachPopulated<T> {}
export interface IRuleBreachRequestPopulated<T = IActionMetadataPopulated> extends IRuleBreachPopulated<T> {
    reviewer?: IUser;
    reviewedAt?: Date;
    status: RuleBreachRequestStatus;
}
