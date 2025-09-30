import { IArgument, IVariable } from './argument';

export interface IRegularFunction {
    isRegularFunction: true; // to identify interface runtime (instead of class' instanceof)
    functionType: 'toDate' | 'addToDate' | 'addToDateTime' | 'subFromDate' | 'subFromDateTime' | 'getToday';
    arguments: IArgument[];
}
export const isRegularFunction = (regularFunction: any): regularFunction is IRegularFunction => {
    return regularFunction.isRegularFunction;
};

export interface ICountAggFunction {
    isCountAggFunction: true; // to identify interface runtime (instead of class' instanceof)
    variable: Required<IVariable>;
}
export const isCountAggFunction = (countAggFunction: any): countAggFunction is ICountAggFunction => {
    return countAggFunction.isCountAggFunction;
};

export interface ISumAggFunction {
    isSumAggFunction: true; // to identify interface runtime (instead of class' instanceof)
    variable: Required<IVariable>;
    property: string;
}
export const isSumAggFunction = (sumAggFunction: any): sumAggFunction is ISumAggFunction => {
    return sumAggFunction.isSumAggFunction;
};

export type IFunction = ICountAggFunction | ISumAggFunction | IRegularFunction;
