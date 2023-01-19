import { IRelationship } from './relationships';

export interface IEntity {
    templateId: string;
    properties: {
        _id: string;
        createdAt: string;
        updatedAt: string;
        disabled: boolean;
    } & Record<string, any>;
}

export interface IEntityExpanded {
    entity: IEntity;
    connections: {
        relationship: Pick<IRelationship, 'templateId' | 'properties'>;
        sourceEntity: IEntity;
        destinationEntity: IEntity;
    }[];
}

export interface IUniqueConstraint {
    type: 'UNIQUE';
    constraintName: string;
    templateId: string;
    properties: string[];
}

export interface IRequiredConstraint {
    type: 'REQUIRED';
    constraintName: string;
    templateId: string;
    property: string;
}

export type IConstraint = IRequiredConstraint | IUniqueConstraint;

export interface IConstraintsOfTemplate {
    templateId: string;
    requiredConstraints: string[];
    uniqueConstraints: string[][];
}
