import config from '../../../config';
import { ServiceError } from '../../error';
import { IFormula } from './interfaces/formula';
import { IArgument, IPropertyOfVariable, isConstant, isPropertyOfVariable } from './interfaces/formula/argument';
import { IEquation, isEquation } from './interfaces/formula/equation';
import { isCountAggFunction, isRegularFunction, isSumAggFunction, ISumAggFunction } from './interfaces/formula/function';
import { isAggregationGroup, isGroup } from './interfaces/formula/group';

const checkPropertyInUsed = ({ variable, property }: IPropertyOfVariable | ISumAggFunction, entityId: string, properties: string[]) => {
    if (
        (variable.entityTemplateId === entityId || variable.aggregatedRelationship?.otherEntityTemplateId === entityId) &&
        properties.includes(property)
    ) {
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
