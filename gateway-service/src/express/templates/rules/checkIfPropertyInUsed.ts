import {
    IArgument,
    IEquation,
    IFormula,
    IPropertyOfVariable,
    ISumAggFunction,
    isAggregationGroup,
    isConstant,
    isCountAggFunction,
    isEquation,
    isGroup,
    isPropertyOfVariable,
    isRegularFunction,
    isSumAggFunction,
} from '@packages/rule';
import { ServiceError } from '@packages/utils';
import config from '../../../config';

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

const checkPropertyInUsedFromFormula = (formula: IFormula, entityId: string, properties: string[], archive: boolean) => {
    if (isGroup(formula)) {
        return formula.subFormulas.map((subFormula) => checkPropertyInUsedFromFormula(subFormula, entityId, properties, archive));
    }

    if (isEquation(formula)) {
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

export default checkPropertyInUsedFromFormula;
