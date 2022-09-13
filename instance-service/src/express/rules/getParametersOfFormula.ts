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

const isRuleDependentOnPropertiesViaAggregation = (
    rule: IMongoRelationshipTemplateRule,
    relationshipTemplateId: string,
    updatedProperties: string[],
) => {
    const parameters = getParametersOfFormula(rule.formula);

    return parameters.some(({ variableName, property }) => {
        if (!property) {
            return false;
        }

        const isVariableAggregation = variableName.split('.').length === 3;

        if (isVariableAggregation) {
            return relationshipTemplateId === variableName.split('.')[1] && updatedProperties.includes(property);
        }

        return false;
    });
};

const isRuleDependentOnRelationship = (rule: IMongoRelationshipTemplateRule, relationshipTemplateId: string) => {
    const dependentRelationshipTemplatesOfRule = getDependentRelationshipTemplatesOfFormula(rule.formula);

    return dependentRelationshipTemplatesOfRule.includes(relationshipTemplateId);
};

export const filterDependentRules = (rules: IMongoRelationshipTemplateRule[], relationshipTemplateId: string, updatedProperties?: string[]) => {
    return rules.filter((rule) => {
        if (updatedProperties) {
            return isRuleDependentOnPropertiesViaAggregation(rule, relationshipTemplateId, updatedProperties);
        }

        return isRuleDependentOnRelationship(rule, relationshipTemplateId);
    });
};
