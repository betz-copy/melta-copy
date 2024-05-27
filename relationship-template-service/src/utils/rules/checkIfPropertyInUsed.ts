import config from '../../config';
import { ServiceError } from '../../express/error';
import {
    IEquation,
    ISumAggFunction,
    isAggregationGroup,
    isCountAggFunction,
    isEquation,
    isGroup,
    isRegularFunction,
    isSumAggFunction,
} from '../../express/rule/interfaces';
import { IArgument, IPropertyOfVariable, isConstant, isPropertyOfVariable } from '../../express/rule/interfaces/argument';
import { IFormula } from '../../express/rule/interfaces/formula';

const checkPropertyInUsed = (propertyOfVariable: IPropertyOfVariable | ISumAggFunction, entityId: string, properties: string[]) => {
    const { variableName, property } = propertyOfVariable;

    const variable = variableName.split('.');
    const id = variable.length > 1 ? variable[2] : variableName;
    if (id === entityId && properties.includes(property)) {
        throw new ServiceError(400, 'can not delete field that used in rules', {
            errorCode: config.errorCodes.failedToDeleteField,
            type: 'rules',
            property,
        });
    }
};

const checkPropertyInUsedFromArgument = (argument: IArgument, entityId: string, properties: string[]) => {
    if (isPropertyOfVariable(argument) || isSumAggFunction(argument)) {
        return checkPropertyInUsed(argument, entityId, properties);
    }

    if (isRegularFunction(argument)) {
        return argument.arguments.forEach((arg) => checkPropertyInUsedFromArgument(arg, entityId, properties));
    }

    if (!isConstant(argument) && !isCountAggFunction(argument)) {
        throw new Error('unexpected argument, must be constant/propertyOfVariable/countAggFunction/sumAggFunction/regularSumFunction');
    }

    return undefined;
};

const checkPropertyInUsedFromEquation = (formula: IEquation, entityId: string, properties: string[]) => {
    checkPropertyInUsedFromArgument(formula.lhsArgument, entityId, properties);
    checkPropertyInUsedFromArgument(formula.rhsArgument, entityId, properties);
};

export const checkPropertyInUsedFromFormula = (formula: IFormula, entityId: string, properties: string[]) => {
    if (isGroup(formula)) {
        return formula.subFormulas.map((subFormula) => checkPropertyInUsedFromFormula(subFormula, entityId, properties));
    }

    if (isEquation(formula)) {
        return checkPropertyInUsedFromEquation(formula, entityId, properties);
    }

    if (isAggregationGroup(formula)) {
        return checkPropertyInUsedFromFormula(
            { isGroup: true, ruleOfGroup: formula.ruleOfGroup, subFormulas: formula.subFormulas },
            entityId,
            properties,
        );
    }

    throw new Error('unexpected formula, must be group/equation/aggeregationGroup');
};
