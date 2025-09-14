import {
    ActionOnFail,
    IArgument,
    IFormula,
    IMongoRule,
    IVariable,
    isAggregationGroup,
    isCountAggFunction,
    isEquation,
    isGroup,
    isPropertyOfVariable,
    isRegularFunction,
} from '@microservices/shared';

interface IParameterOfFormula {
    variable: IVariable;
    property?: string;
}

const getParametersOfArgument = (argument: IArgument): IParameterOfFormula[] => {
    if (isPropertyOfVariable(argument)) {
        const { variable, property } = argument;
        return [{ variable, property }];
    }

    if (isCountAggFunction(argument)) {
        const { variable } = argument;
        return [{ variable }];
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

    if (isGroup(formula)) {
        return formula.subFormulas.flatMap(getParametersOfFormula);
    }

    if (isAggregationGroup(formula)) {
        return [{ variable: formula.variableOfAggregation }, ...formula.subFormulas.flatMap(getParametersOfFormula)];
    }

    throw new Error('formula not supported');
};

const isRuleDependentViaAggregation = (rule: IMongoRule, relationshipTemplateId: string, updatedProperties?: string[]) => {
    const parameters = getParametersOfFormula(rule.formula);

    return parameters.some(({ variable, property }) => {
        if (!variable.aggregatedRelationship) {
            return false;
        }

        if (updatedProperties) {
            if (!property) {
                return false;
            }

            return relationshipTemplateId === variable.aggregatedRelationship.relationshipTemplateId && updatedProperties.includes(property);
        }

        return relationshipTemplateId === variable.aggregatedRelationship.relationshipTemplateId;
    });
};

export const filterDependentRulesViaAggregation = (rules: IMongoRule[], relationshipTemplateId: string, updatedProperties?: string[]) => {
    return rules.filter((rule) => {
        return isRuleDependentViaAggregation(rule, relationshipTemplateId, updatedProperties);
    });
};

const isRuleDependentOnEntity = (rule: IMongoRule, entityTemplateId: string, updatedProperties?: string[]) => {
    const parameters = getParametersOfFormula(rule.formula);

    return parameters.some(({ variable, property }) => {
        if (updatedProperties) {
            // check if rule dependent specificly only on updatedProperties
            if (!property) {
                return false;
            }

            if (variable.aggregatedRelationship) {
                return false;
            }

            return variable.entityTemplateId === entityTemplateId && updatedProperties.includes(property);
        }

        return variable.entityTemplateId === entityTemplateId;
    });
};

export const filterDependentRulesOnEntity = (rules: IMongoRule[], entityTemplateId: string, updatedProperties?: string[]) =>
    rules.filter((rule) => rule.actionOnFail === ActionOnFail.INDICATOR || isRuleDependentOnEntity(rule, entityTemplateId, updatedProperties));
