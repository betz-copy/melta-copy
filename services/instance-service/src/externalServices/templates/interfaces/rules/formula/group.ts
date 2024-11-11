import { IFormula } from '.';
import { IVariable } from './argument';

export interface IAggregationGroup {
    isAggregationGroup: true; // to identify interface runtime (instead of class' instanceof)
    aggregation: 'EVERY' | 'SOME';
    variableOfAggregation: Required<IVariable>;
    ruleOfGroup: 'AND' | 'OR';
    subFormulas: IFormula[]; // formulas inside aggregation group may use the aggregated variable
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
