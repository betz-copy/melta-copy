/** biome-ignore-all lint/suspicious/noExplicitAny: prop value is any*/
import type {
    IAggregationGroup,
    IConstant,
    ICountAggFunction,
    IEquation,
    IGroup,
    IPropertyOfVariable,
    IRegularFunction,
    ISumAggFunction,
} from './types';

export const isConstant = (constant: any): constant is IConstant => {
    return constant.isConstant;
};

export const isPropertyOfVariable = (propertyOfVariable: any): propertyOfVariable is IPropertyOfVariable => {
    return propertyOfVariable.isPropertyOfVariable;
};

export const isRegularFunction = (regularFunction: any): regularFunction is IRegularFunction => {
    return regularFunction.isRegularFunction;
};

export const isCountAggFunction = (countAggFunction: any): countAggFunction is ICountAggFunction => {
    return countAggFunction.isCountAggFunction;
};

export const isSumAggFunction = (sumAggFunction: any): sumAggFunction is ISumAggFunction => {
    return sumAggFunction.isSumAggFunction;
};

export const isEquation = (equation: any): equation is IEquation => {
    return equation.isEquation;
};

export const isAggregationGroup = (aggregationGroup: any): aggregationGroup is IAggregationGroup => {
    return aggregationGroup.isAggregationGroup;
};

export const isGroup = (group: any): group is IGroup => {
    return group.isGroup;
};
