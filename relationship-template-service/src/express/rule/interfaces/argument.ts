import { IFunction } from './index';

export type IConstant = {
    isConstant: true;
    value: number | string | boolean;
};

export const isConstant = (constant: any): constant is IConstant => {
    return constant.isConstant;
};

export interface IPropertyOfVariable {
    isPropertyOfVariable: true;
    variableName: string;
    property: string;
}

export const isPropertyOfVariable = (propertyOfVariable: any): propertyOfVariable is IPropertyOfVariable => {
    return propertyOfVariable.isPropertyOfVariable;
};

export type IArgument = IConstant | IPropertyOfVariable | IFunction;
