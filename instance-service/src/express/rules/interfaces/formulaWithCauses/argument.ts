import { ICause } from './cause';
import { IFunctionCauses } from './function';

export type IConstantCauses = null; // constant doesnt have cause (dont forget "causes" are which **instances** caused the failure)

export interface IPropertyOfVariableCauses {
    cause: ICause;
}

export type IArgumentCauses = IConstantCauses | IPropertyOfVariableCauses | IFunctionCauses;
