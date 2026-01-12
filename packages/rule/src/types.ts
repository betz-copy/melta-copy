import { IEntity } from '@packages/entity';
import { IEntityTemplatePopulated } from '@packages/entity-template';
import { IMongoRelationshipTemplate } from '@packages/relationship-template';

export type IConstant = {
    isConstant: true;
    type: 'number' | 'string' | 'boolean' | 'date' | 'dateTime' | 'dateDuration' | 'dateTimeDuration' | 'relationshipReference';
    value: number | string | boolean;
};

// biome-ignore lint/suspicious/noExplicitAny: prop value is any
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

// biome-ignore lint/suspicious/noExplicitAny: prop value is any
export const isPropertyOfVariable = (propertyOfVariable: any): propertyOfVariable is IPropertyOfVariable => {
    return propertyOfVariable.isPropertyOfVariable;
};

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

export type IArgument = IConstant | IPropertyOfVariable | IFunction;

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

// biome-ignore lint/suspicious/noExplicitAny: prop value is any
export const isEquation = (equation: any): equation is IEquation => {
    return equation.isEquation;
};

export interface IAggregationGroup {
    isAggregationGroup: true; // to identify interface runtime (instead of class' instanceof)
    aggregation: 'EVERY' | 'SOME';
    variableOfAggregation: Required<IVariable>;
    ruleOfGroup: 'AND' | 'OR';
    subFormulas: IFormula[]; // formulas inside aggregation group may use the aggregated variable
}

// biome-ignore lint/suspicious/noExplicitAny: prop value is any
export const isAggregationGroup = (aggregationGroup: any): aggregationGroup is IAggregationGroup => {
    return aggregationGroup.isAggregationGroup;
};

export interface IGroup {
    isGroup: true; // to identify interface runtime (instead of class' instanceof)
    ruleOfGroup: 'AND' | 'OR';
    subFormulas: IFormula[];
}

// biome-ignore lint/suspicious/noExplicitAny: prop value is any
export const isGroup = (group: any): group is IGroup => {
    return group.isGroup;
};

export type IFormula = IGroup | IEquation | IAggregationGroup;

export enum ActionOnFail {
    WARNING = 'WARNING',
    ENFORCEMENT = 'ENFORCEMENT',
    INDICATOR = 'INDICATOR',
}

export interface IRuleMail {
    display: boolean;
    title: string;
    body: string;
    sendPermissionUsers: boolean;
    sendAssociatedUsers: boolean;
}

export interface IBulkRuleMail extends IRuleMail {
    entity: IEntity;
}

export interface IRule {
    name: string;
    description: string;
    actionOnFail: ActionOnFail;
    entityTemplateId: string;
    formula: IFormula;
    disabled: boolean;
    fieldColor?: { display: boolean; field: string; color: string };
    mail?: IRuleMail;
    doesFormulaHaveTodayFunc: boolean;
}
export interface IMongoRule extends IRule {
    _id: string;
}
export type IRuleMap = Map<string, IMongoRule>;

export interface ISearchRulesBody {
    search?: string;
    entityTemplateIds?: string[];
    doesFormulaHaveTodayFunc?: boolean;
    disabled?: boolean;
    limit?: number;
    skip?: number;
}

export interface IRelevantTemplates {
    entityTemplate: IEntityTemplatePopulated;
    connectionsTemplatesOfEntityTemplate: Array<{
        relationshipTemplate: IMongoRelationshipTemplate;
        otherEntityTemplate: IEntityTemplatePopulated;
    }>;
}
