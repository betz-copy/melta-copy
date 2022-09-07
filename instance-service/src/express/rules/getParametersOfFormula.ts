import { IMongoRelationshipTemplateRule, isAggregationGroup, isCountAggFunction, isEquation, isGroup } from './interfaces';
import { IArgument, isPropertyOfVariable } from './interfaces/argument';
import { IFormula } from './interfaces/formula';

interface IParameterOfFormula {
    variableName: string;
    property?: string;
}

const getParametersOfArgument = (argument: IArgument): IParameterOfFormula[] => {
    if (isPropertyOfVariable(argument)) {
        const { variableName, property } = argument;
        return [{ variableName, property }];
    }

    if (isCountAggFunction(argument)) {
        const { variableName } = argument;
        return [{ variableName }];
    }

    return [];
};

const getParametersOfFormula = (formula: IFormula): IParameterOfFormula[] => {
    if (isEquation(formula)) {
        const { lhsArgument, rhsArgument } = formula;

        return [...getParametersOfArgument(lhsArgument), ...getParametersOfArgument(rhsArgument)];
    }

    if (isGroup(formula) || isAggregationGroup(formula)) {
        return formula.subFormulas.flatMap(getParametersOfFormula);
    }

    throw new Error('formula not supported');
};

const getDependentRelationshipTemplatesOfFormula = (formula: IFormula) => {
    const parameters = getParametersOfFormula(formula);
    const variablesWithAggregation = parameters.filter(({ variableName }) => variableName.split('.').length === 3);
    const relationshipTemplates = variablesWithAggregation.map(({ variableName }) => variableName.split('.')[1]);

    return [...new Set(relationshipTemplates)];
};

const isRuleDependentInRelationshipTemplate = (rule: IMongoRelationshipTemplateRule, relationshipTemplateId: string) => {
    const dependentRelationshipTemplatesOfRule = getDependentRelationshipTemplatesOfFormula(rule.formula);
    return dependentRelationshipTemplatesOfRule.includes(relationshipTemplateId);
};

export const filterRulesDependentInRelationshipTemplate = (rules: IMongoRelationshipTemplateRule[], relationshipTemplateId: string) => {
    return rules.filter((rule) => isRuleDependentInRelationshipTemplate(rule, relationshipTemplateId));
};
