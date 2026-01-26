import { Conjunction, IMongoProps } from '@packages/common';
import { IEntityTemplatePopulated } from '@packages/entity-template';
import { IMongoRelationshipTemplate } from '@packages/relationship-template';

export type IConstant = {
    isConstant: true;
    type: 'number' | 'string' | 'boolean' | 'date' | 'dateTime' | 'dateDuration' | 'dateTimeDuration' | 'relationshipReference';
    value: number | string | boolean;
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

export interface IRegularFunction {
    isRegularFunction: true; // to identify interface runtime (instead of class' instanceof)
    functionType: 'toDate' | 'addToDate' | 'addToDateTime' | 'subFromDate' | 'subFromDateTime' | 'getToday';
    arguments: IArgument[];
}

export interface ICountAggFunction {
    isCountAggFunction: true; // to identify interface runtime (instead of class' instanceof)
    variable: Required<IVariable>;
}

export interface ISumAggFunction {
    isSumAggFunction: true; // to identify interface runtime (instead of class' instanceof)
    variable: Required<IVariable>;
    property: string;
}

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

export interface IAggregationGroup {
    isAggregationGroup: true; // to identify interface runtime (instead of class' instanceof)
    aggregation: 'EVERY' | 'SOME';
    variableOfAggregation: Required<IVariable>;
    ruleOfGroup: Conjunction;
    subFormulas: IFormula[]; // formulas inside aggregation group may use the aggregated variable
}

export interface IGroup {
    isGroup: true; // to identify interface runtime (instead of class' instanceof)
    ruleOfGroup: Conjunction;
    subFormulas: IFormula[];
}

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
export interface IMongoRule extends IRule, IMongoProps {}

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
