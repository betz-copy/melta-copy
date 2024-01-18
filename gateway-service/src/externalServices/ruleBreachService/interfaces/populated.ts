import {
    IBrokenRule,
    ICreateRelationshipMetadata,
    IDeleteRelationshipMetadata,
    IRuleBreach,
    IUpdateEntityMetadata,
    IUpdateEntityStatusMetadata,
    RuleBreachRequestStatus,
} from '.';
import { IUser } from '../../../express/users/interface';
import { IEntity } from '../../instanceService/interfaces/entities';
import { IRelationshipPopulated } from '../../../express/instances/interfaces';

export interface ICreateRelationshipMetadataPopulated extends Omit<ICreateRelationshipMetadata, 'sourceEntityId' | 'destinationEntityId'> {
    sourceEntity: IEntity | null;
    destinationEntity: IEntity | null;
}

export interface IDeleteRelationshipMetadataPopulated extends Omit<IDeleteRelationshipMetadata, 'sourceEntityId' | 'destinationEntityId'> {
    sourceEntity: IEntity | null;
    destinationEntity: IEntity | null;
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
    | IUpdateEntityMetadataPopulated
    | IUpdateEntityStatusMetadataPopulated;

export interface IBrokenRulePopulated extends Omit<IBrokenRule, 'relationshipIds'> {
    ruleId: string;
    relationships: (IRelationshipPopulated | 'created-relationship-id' | null)[];
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
