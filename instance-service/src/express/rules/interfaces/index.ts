import { IArgument } from './argument';
import { IFormula } from './formula';
import { IRelationship } from '../../relationships/interface';

interface IRegularSumFunction {
    lhsArgument: IArgument;
    rhsArgument: IArgument;
}

interface ICountAggFunction {
    variableName: string; // allowed variables of only sourceTemplate.connections.otherTemplate (i.e. agent.connections.flight)
}

interface ISumAggFunction {
    variableName: string; // allowed variables of only sourceTemplate.connections.otherTemplate (i.e. agent.connections.flight)
    property: string;
}

export type IFunction = ICountAggFunction | ISumAggFunction | IRegularSumFunction;

export interface IEquation {
    lhsArgument: IArgument;
    operatorBool: string;
    rhsArgument: IArgument;
}

export interface IAggregationGroup {
    aggregation: 'EVERY' | 'SOME';
    variableNameOfAggregation: string; // only variables inside sourceTemplate.connections
    subFormulas: IFormula[]; // formulas inside aggregation group may use the aggregated variable, but mustn't use another IAggregationGroup or ISumFunction or ICountFunction
}

export interface IGroup {
    ruleOfGroup: 'AND' | 'OR';
    subFormulas: IFormula[];
}

export interface IRelationshipTemplateRule {
    name: string;
    description: string;
    actionOnFail: 'WARNING_BEFORE_EXECUTION' | 'WARNING_BEFORE_EXECUTION_AND_NOTIFY_ADMINS';
    errorMessageOnFail: string;
    relationshipTemplate: IRelationship;
    pinnedEntityTemplateId: string; // sourceEntityTemplate or destinationEntityTemplate
    formula: IFormula;
}
