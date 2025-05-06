import config from '../../../config';
import { ServiceError } from '../../error';
import { IFormula } from './interfaces/formula';
import { IArgument, IPropertyOfVariable, isConstant, isPropertyOfVariable } from './interfaces/formula/argument';
import { IEquation, isEquation } from './interfaces/formula/equation';
import { isCountAggFunction, isRegularFunction, isSumAggFunction, ISumAggFunction } from './interfaces/formula/function';
import { isAggregationGroup, isGroup } from './interfaces/formula/group';

const checkPropertyInUsed = (
    { variable, property }: IPropertyOfVariable | ISumAggFunction,
    entityId: string,
    properties: string[],
    archive: boolean,
) => {
    if (
        (variable.entityTemplateId === entityId || variable.aggregatedRelationship?.otherEntityTemplateId === entityId) &&
        properties.includes(property)
    ) {
        throw new ServiceError(400, 'can not delete field that used in rules', {
            errorCode: archive ? config.errorCodes.failedToArchiveField : config.errorCodes.failedToDeleteField,
            type: 'rules',
            property,
        });
    }
};

const checkPropertyInUsedFromArgument = (argument: IArgument, entityId: string, properties: string[], archive: boolean) => {
    if (isPropertyOfVariable(argument) || isSumAggFunction(argument)) {
        return checkPropertyInUsed(argument, entityId, properties, archive);
    }

    if (isRegularFunction(argument)) {
        return argument.arguments.forEach((arg) => checkPropertyInUsedFromArgument(arg, entityId, properties, archive));
    }

    if (!isConstant(argument) && !isCountAggFunction(argument)) {
        throw new Error('unexpected argument, must be constant/propertyOfVariable/countAggFunction/sumAggFunction/regularSumFunction');
    }

    return undefined;
};

const checkPropertyInUsedFromEquation = (formula: IEquation, entityId: string, properties: string[], archive: boolean) => {
    checkPropertyInUsedFromArgument(formula.lhsArgument, entityId, properties, archive);
    checkPropertyInUsedFromArgument(formula.rhsArgument, entityId, properties, archive);
};

export const checkPropertyInUsedFromFormula = (formula: IFormula, entityId: string, properties: string[], archive: boolean) => {
    console.log('in checkPropertyInUsedFromFormula', formula);

    if (isGroup(formula)) {
        console.log('in if');

        return formula.subFormulas.map((subFormula) => checkPropertyInUsedFromFormula(subFormula, entityId, properties, archive));
    }

    if (isEquation(formula)) {
        console.log('in if2');
        return checkPropertyInUsedFromEquation(formula, entityId, properties, archive);
    }

    if (isAggregationGroup(formula)) {
        return checkPropertyInUsedFromFormula(
            { isGroup: true, ruleOfGroup: formula.ruleOfGroup, subFormulas: formula.subFormulas },
            entityId,
            properties,
            archive,
        );
    }

    throw new Error('unexpected formula, must be group/equation/aggeregationGroup');
};
