import { IArgument } from './argument';
import { IFormula } from './formula';

export interface IRegularFunction {
    isRegularFunction: true; // to identify interface runtime (instead of class' instanceof)
    functionType: 'toDate' | 'addToDate' | 'addToDateTime' | 'subFromDate' | 'subFromDateTime';
    arguments: IArgument[];
}
export const isRegularFunction = (regularFunction: any): regularFunction is IRegularFunction => {
    return regularFunction.isRegularFunction;
};

export interface ICountAggFunction {
    isCountAggFunction: true; // to identify interface runtime (instead of class' instanceof)
    variableName: string; // allowed variables of only sourceTemplate.connections.otherTemplate (i.e. agent.connections.flight)
}
export const isCountAggFunction = (countAggFunction: any): countAggFunction is ICountAggFunction => {
    return countAggFunction.isCountAggFunction;
};

export interface ISumAggFunction {
    isSumAggFunction: true; // to identify interface runtime (instead of class' instanceof)
    variableName: string; // allowed variables of only sourceTemplate.connections.otherTemplate (i.e. agent.connections.flight)
    property: string;
}
export const isSumAggFunction = (sumAggFunction: any): sumAggFunction is ISumAggFunction => {
    return sumAggFunction.isSumAggFunction;
};

export type IFunction = ICountAggFunction | ISumAggFunction | IRegularFunction;

// do snake case (for example NOT_CONTAINS)
export type IOperatorBool = 'equals' | 'notEqual' | 'lessThan' | 'lessThanOrEqual' | 'greaterThan' | 'greaterThanOrEqual';
// todo: support blank/notBlank unary operator
// | 'blank'
// | 'notBlank';

export interface IEquation {
    isEquation: true;
    lhsArgument: IArgument;
    operatorBool: IOperatorBool;
    rhsArgument: IArgument;
}

export const isEquation = (equation: any): equation is IEquation => {
    return equation.isEquation;
};

export interface IAggregationGroup {
    isAggregationGroup: true; // to identify interface runtime (instead of class' instanceof)
    aggregation: 'EVERY' | 'SOME';
    variableNameOfAggregation: string; // only variables inside sourceTemplate.connections
    ruleOfGroup: 'AND' | 'OR';
    subFormulas: IFormula[]; // formulas inside aggregation group may use the aggregated variable, but mustn't use another IAggregationGroup or ISumFunction or ICountFunction
}

export const isAggregationGroup = (aggregationGroup: any): aggregationGroup is IAggregationGroup => {
    return aggregationGroup.isAggregationGroup;
};

export interface IGroup {
    isGroup: true; // to identify interface runtime (instead of class' instanceof)
    ruleOfGroup: 'AND' | 'OR';
    subFormulas: IFormula[];
}

export const isGroup = (group: any): group is IGroup => {
    return group.isGroup;
};

export interface IRule {
    name: string;
    description: string;
    actionOnFail: 'WARNING' | 'ENFORCEMENT';
    relationshipTemplateId: string;
    pinnedEntityTemplateId: string;
    unpinnedEntityTemplateId: string; // just to allow for searches
    formula: IFormula;
    disabled: boolean;
}

export interface IMongoRule extends IRule {
    _id: string;
}

export type IRuleMap = Map<string, IMongoRule>;
