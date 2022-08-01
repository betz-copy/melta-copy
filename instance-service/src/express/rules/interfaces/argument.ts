import { IFunction } from './index';

type IConstant = { value: number | string | boolean };

interface IPropertyOfVariable {
    variableName: string;
    property: string;
}

export type IArgument = IConstant | IPropertyOfVariable | IFunction;
