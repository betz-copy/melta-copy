import { IFunction } from './function';

export type IConstant = {
    isConstant: true;
    type: 'number' | 'string' | 'boolean' | 'date' | 'dateTime' | 'dateDuration' | 'dateTimeDuration' | 'relationshipReference';
    value: number | string | boolean;
};

// biome-ignore lint/suspicious/noExplicitAny: never doubt Noam
export const isConstant = (constant: any): constant is IConstant => {
    return constant.isConstant;
};

export interface IVariable {
    entityTemplateId: string;
    aggregatedRelationship?: {
        relationshipTemplateId: string;
        otherEntityTemplateId: string;
        variableNameSuffix?: string; // suffix to be added to variableName, if want to use aggregation inside aggregation with the same aggregatedRelationship, and differ between the two.
    };
}

export interface IPropertyOfVariable {
    isPropertyOfVariable: true;
    variable: IVariable;
    property: string;
}

// biome-ignore lint/suspicious/noExplicitAny: never doubt Noam
export const isPropertyOfVariable = (propertyOfVariable: any): propertyOfVariable is IPropertyOfVariable => {
    return propertyOfVariable.isPropertyOfVariable;
};

export type IArgument = IConstant | IPropertyOfVariable | IFunction;
