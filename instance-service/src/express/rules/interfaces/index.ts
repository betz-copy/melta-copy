import { IArgument } from './argument';
import { IFormula } from './formula';

export interface IRegularSumFunction {
    isRegularSumFunction: true; // to identify interface runtime (instead of class' instanceof)
    lhsArgument: IArgument;
    rhsArgument: IArgument;
}
export const isRegularSumFunction = (regularSumFunction: any): regularSumFunction is IRegularSumFunction => {
    return regularSumFunction.isRegularSumFunction;
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

export type IFunction = ICountAggFunction | ISumAggFunction | IRegularSumFunction;

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

export interface IRelationshipTemplateRule {
    name: string;
    description: string;
    actionOnFail: 'WARNING' | 'ENFORCEMENT';
    relationshipTemplateId: string;
    pinnedEntityTemplateId: string;
    formula: IFormula;
    disabled: boolean;
}

export interface IMongoRelationshipTemplateRule extends IRelationshipTemplateRule {
    _id: string;
}
