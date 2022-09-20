import { IMongoRule, isAggregationGroup, isCountAggFunction, isEquation, isGroup, isRegularFunction } from './interfaces';
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
    
    if (isRegularFunction(argument)) {
        const { arguments: functionArguments } = argument;
        return functionArguments.flatMap(getParametersOfArgument);
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

const isRuleDependentOnPropertiesViaAggregation = (rule: IMongoRule, relationshipTemplateId: string, updatedProperties: string[]) => {
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

const isRuleDependentOnRelationshipViaAggregation = (rule: IMongoRule, relationshipTemplateId: string) => {
    const parameters = getParametersOfFormula(rule.formula);

    return parameters.some(({ variableName }) => {
        const isVariableAggregation = variableName.split('.').length === 3;

        return isVariableAggregation && relationshipTemplateId === variableName.split('.')[1];
    });
};

export const filterDependentRulesViaAggregation = (rules: IMongoRule[], relationshipTemplateId: string, updatedProperties?: string[]) => {
    return rules.filter((rule) => {
        if (updatedProperties) {
            return isRuleDependentOnPropertiesViaAggregation(rule, relationshipTemplateId, updatedProperties);
        }

        return isRuleDependentOnRelationshipViaAggregation(rule, relationshipTemplateId);
    });
};

const isRuleDependentOnProperties = (rule: IMongoRule, entityTemplateId: string, updatedProperties: string[]) => {
    const parameters = getParametersOfFormula(rule.formula);

    return parameters.some(({ variableName, property }) => {
        if (!property) {
            return false;
        }

        return variableName === entityTemplateId && updatedProperties.includes(property);
    });
};

export const filterDependentRulesOnProperties = (rules: IMongoRule[], entityTemplateId: string, updatedProperties: string[]) => {
    return rules.filter((rule) => isRuleDependentOnProperties(rule, entityTemplateId, updatedProperties));
};
