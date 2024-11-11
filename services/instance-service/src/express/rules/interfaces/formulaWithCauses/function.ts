import { IArgumentCauses } from './argument';
import { ICause } from './cause';

export interface IRegularFunctionCauses {
    arguments: IArgumentCauses[];
    resultValue: any;
}
export interface ICountAggFunctionCauses {
    causes: ICause[];
    resultValue: number;
}

export interface ISumAggFunctionCauses {
    causes: ICause[];
    resultValue: number;
}

export type IFunctionCauses = ICountAggFunctionCauses | ISumAggFunctionCauses | IRegularFunctionCauses;
