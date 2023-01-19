export interface IEntity {
    templateId: string;
    properties: Record<string, any>;
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
