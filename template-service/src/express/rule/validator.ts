import Joi from 'joi';
import isEqual from 'lodash.isequal';
import { isValid as isValidDate, parse } from 'date-fns';
import { Request } from 'express';
import assert from 'assert';
import { IRule, IRelevantTemplates } from './interfaces';
import { RelationshipTemplateManager } from '../relationshipTemplate/manager';
import { IEntitySingleProperty, IEntityTemplatePopulated } from '../entityTemplate/interface';
import { IMongoRelationshipTemplate } from '../relationshipTemplate/interface';
import { defaultValidationOptions, joiValidate } from '../../utils/joi';
import { IAggregationGroup } from './interfaces/formula/group';
import { IConstant, IPropertyOfVariable, IVariable, isConstant } from './interfaces/formula/argument';
import { ICountAggFunction, IRegularFunction, ISumAggFunction } from './interfaces/formula/function';
import EntityTemplateManager from '../entityTemplate/manager';

const joiValidateNoConvert = (schema: Joi.AnySchema<any>, data: any) => joiValidate(schema, data, { ...defaultValidationOptions, convert: false });

const addDefaultFieldsToTemplate = (entityTemplate: IEntityTemplatePopulated): IEntityTemplatePopulated => {
    return {
        ...entityTemplate,
        properties: {
            ...entityTemplate.properties,
            properties: {
                ...entityTemplate.properties.properties,
                _id: { title: '_id', type: 'string' },
                disabled: { title: 'disabled', type: 'boolean' },
                createdAt: { title: 'createdAt', type: 'string', format: 'date-time' },
                updatedAt: { title: 'updatedAt', type: 'string', format: 'date-time' },
            },
        },
    };
};
const jsonSchemaTypeToType = ({ type, format }: IEntitySingleProperty): IConstant['type'] => {
    switch (format) {
        case 'date':
            return 'date';
        case 'date-time':
            return 'dateTime';
        default:
            if (type === 'array') {
                // todo: block in UI too, or support it
                throw new Error('array not supported in formulas! sorry!');
            }
            if (format === 'relationshipReference') {
                throw new Error('relationshipReference not supported in formulas! sorry!');
            }
            return type;
    }
};
const validatePropertyExistInEntityTemplate = (property: string, entityTemplate: IEntityTemplatePopulated): IConstant['type'] => {
    const entityTemplateWithDefaults = addDefaultFieldsToTemplate(entityTemplate);

    const propertyTemplate = entityTemplateWithDefaults.properties.properties[property];
    if (propertyTemplate) {
        return jsonSchemaTypeToType(propertyTemplate);
    }

    throw new Error(`property "${property}" must exist in template "${entityTemplate._id}"`);
};

const numberRegExp = '[1-9]\\d*'; // digits that doesnt start with 0
const dateDurationRegExp = new RegExp(`^(${numberRegExp}Y)?(${numberRegExp}M)?(${numberRegExp}D)?$`);
const dateTimeDurationRegExp = new RegExp(`^(${numberRegExp}Y)?(${numberRegExp}M)?(${numberRegExp}D)?(${numberRegExp}H)?$`);

const constantSchema = Joi.object({
    isConstant: Joi.boolean().valid(true).required(),
    type: Joi.string().valid('number', 'string', 'boolean', 'date', 'dateTime', 'dateDuration', 'dateTimeDuration').required(),
    value: Joi.when('type', {
        switch: [
            { is: 'number', then: Joi.number() },
            { is: 'string', then: Joi.string() },
            { is: 'boolean', then: Joi.boolean() },
            {
                is: 'date',
                then: Joi.string().custom((value: string) => {
                    const isValid = isValidDate(parse(value, 'yyyy-MM-dd', new Date()));
                    assert(isValid, 'invalid date of format yyyy-MM-dd');
                }),
            },
            { is: 'dateTime', then: Joi.string().isoDate() },
            {
                is: 'dateDuration',
                then: Joi.string()
                    .pattern(dateDurationRegExp)
                    .min(1) // added at least one component of duration (Y/M/D)
                    .message('dateDuration must be of format "[nY][nM][nD]" (square brackets means optional)'),
            },
            {
                is: 'dateTimeDuration',
                then: Joi.string()
                    .pattern(dateTimeDurationRegExp)
                    .min(1) // added at least one component of duration (Y/M/D/H)
                    .message('dateDuration must be of format "[nY][nM][nD][nH]" (square brackets means optional)'),
            },
        ],
    }).required(),
});
const validateConstant = (constant: any): IConstant['type'] => {
    joiValidateNoConvert(constantSchema, constant);
    return constant.type;
};

const validateVariableOfAggregation = (
    variable: Required<IVariable>,
    relevantTemplates: IRelevantTemplates,
    shouldExistInAggregationGroupsContext: boolean,
    aggregationGroupsContext: Array<IAggregationGroup['variableOfAggregation']>,
): IRelevantTemplates['connectionsTemplatesOfEntityTemplate'][number] => {
    const connectionTemplates = relevantTemplates.connectionsTemplatesOfEntityTemplate.find(
        ({ relationshipTemplate }) => relationshipTemplate._id === variable.aggregatedRelationship.relationshipTemplateId,
    );

    assert(
        connectionTemplates,
        `relationshipTemplateId "${variable.aggregatedRelationship.relationshipTemplateId}" doesnt exist for entityTemplate "${relevantTemplates.entityTemplate.name}" connections`,
    );

    assert(
        !connectionTemplates.relationshipTemplate.isProperty,
        `relationshipTemplateId "${variable.aggregatedRelationship.relationshipTemplateId}" is a relationshipReference field and not supported in rules.`,
    );

    assert(
        variable.aggregatedRelationship.otherEntityTemplateId === connectionTemplates.otherEntityTemplate._id,
        `variable of aggregation is on relationshipTemplateId "${variable.aggregatedRelationship.relationshipTemplateId}", so otherEntityTemplateId should be "${connectionTemplates.otherEntityTemplate._id}"`,
    );

    const doesExistInAggregationGroupsContext = aggregationGroupsContext.some((variableOfAggregation) => isEqual(variableOfAggregation, variable));

    if (shouldExistInAggregationGroupsContext) {
        assert(
            doesExistInAggregationGroupsContext,
            `using aggregation variable (${JSON.stringify(variable)}), but not under some aggregation group with the same variable`,
        );
    } else {
        assert(!doesExistInAggregationGroupsContext, `there's already aggregation group with the same variable (${JSON.stringify(variable)})`);
    }

    return connectionTemplates;
};

const variableSchema = Joi.object({
    entityTemplateId: Joi.string().required(),
    aggregatedRelationship: Joi.object({
        relationshipTemplateId: Joi.string().required(),
        otherEntityTemplateId: Joi.string().required(),
        variableNameSuffix: Joi.string(),
    }),
});

const propertyOfVariableSchema = Joi.object({
    isPropertyOfVariable: Joi.boolean().valid(true).required(),
    variable: variableSchema.required(),
    property: Joi.string().required(),
});
const validatePropertyOfVariable = (
    propertyOfVariableData: any,
    relevantTemplates: IRelevantTemplates,
    aggregationGroupsContext: Array<IAggregationGroup['variableOfAggregation']>,
): IConstant['type'] => {
    const { variable, property }: IPropertyOfVariable = joiValidateNoConvert(propertyOfVariableSchema, propertyOfVariableData);

    if (variable.aggregatedRelationship) {
        const { otherEntityTemplate } = validateVariableOfAggregation(
            variable as Required<IVariable>,
            relevantTemplates,
            true,
            aggregationGroupsContext,
        );

        return validatePropertyExistInEntityTemplate(property, otherEntityTemplate);
    }

    assert(variable.entityTemplateId === relevantTemplates.entityTemplate._id, 'variable.entityTemplateId must be the same as entityTemplateId');

    return validatePropertyExistInEntityTemplate(property, relevantTemplates.entityTemplate);
};

const countAggFunctionSchema = Joi.object({
    isCountAggFunction: Joi.boolean().valid(true).required(),
    variable: variableSchema.presence('required').required(),
});
const validateCountAggFunction = (
    countAggFunctionData: any,
    relevantTemplates: IRelevantTemplates,
    aggregationGroupsContext: Array<IAggregationGroup['variableOfAggregation']>,
) => {
    const countAggFunction: ICountAggFunction = joiValidateNoConvert(countAggFunctionSchema, countAggFunctionData);

    validateVariableOfAggregation(countAggFunction.variable, relevantTemplates, false, aggregationGroupsContext);
};

const sumAggFunctionSchema = Joi.object({
    isSumAggFunction: Joi.boolean().valid(true).required(),
    variable: variableSchema.presence('required').required(),
    property: Joi.string().required(),
});
const validateSumAggFunction = (
    sumAggFunctionData: any,
    relevantTemplates: IRelevantTemplates,
    aggregationGroupsContext: Array<IAggregationGroup['variableOfAggregation']>,
) => {
    const sumAggFunction: ISumAggFunction = joiValidateNoConvert(sumAggFunctionSchema, sumAggFunctionData);

    const { otherEntityTemplate } = validateVariableOfAggregation(sumAggFunction.variable, relevantTemplates, false, aggregationGroupsContext);

    return validatePropertyExistInEntityTemplate(sumAggFunction.property, otherEntityTemplate);
};

const regularFunctionSchema = Joi.object({
    isRegularFunction: Joi.boolean().valid(true).required(),
    functionType: Joi.string().valid('toDate', 'addToDate', 'addToDateTime', 'subFromDate', 'subFromDateTime').required(),
    arguments: Joi.array().items(Joi.object()).required(),
});
const validateRegularFunction = (
    regularFunctionData: any,
    relevantTemplates: IRelevantTemplates,
    aggregationGroupsContext: Array<IAggregationGroup['variableOfAggregation']>,
): IConstant['type'] => {
    const {
        arguments: funcArguments,
        functionType,
    }: {
        isRegularFunction: true;
        functionType: IRegularFunction['functionType'];
        arguments: object[];
    } = joiValidateNoConvert(regularFunctionSchema, regularFunctionData);

    funcArguments.forEach((argument) => {
        // eslint-disable-next-line no-use-before-define -- circular recursive functions
        validateArgument(argument, relevantTemplates, aggregationGroupsContext);
    });
    switch (functionType) {
        case 'toDate': {
            assert(funcArguments.length === 1, 'toDate must contain exactly 1 argument');
            return 'date';
        }

        case 'addToDate':
        case 'subFromDate': {
            assert(funcArguments.length === 2, 'add/subToDate function must contain exactly 2 arguments');

            const [_, secondArgument] = funcArguments;
            assert(
                isConstant(secondArgument) && secondArgument.type === 'dateDuration',
                'add/subToDate function second argument be of type dateDuration',
            );

            return 'date';
        }

        case 'addToDateTime':
        case 'subFromDateTime': {
            assert(funcArguments.length === 2, 'add/subToDateTime function must contain exactly 2 arguments');

            const [_, secondArgument] = funcArguments;
            assert(
                isConstant(secondArgument) && secondArgument.type === 'dateTimeDuration',
                'add/subToDate function second argument be of type dateTimeDuration',
            );

            return 'dateTime';
        }

        default:
            throw new Error('Shouldnt reach here. functionType must be one of allowed types');
    }
};

const argumentSchema = Joi.alternatives(
    Joi.object({ isConstant: Joi.boolean().valid(true).required() }).unknown(true),
    Joi.object({ isPropertyOfVariable: Joi.boolean().valid(true).required() }).unknown(true),
    Joi.object({ isCountAggFunction: Joi.boolean().valid(true).required() }).unknown(true),
    Joi.object({ isSumAggFunction: Joi.boolean().valid(true).required() }).unknown(true),
    Joi.object({ isRegularFunction: Joi.boolean().valid(true).required() }).unknown(true),
).messages({ 'alternatives.match': 'argument must be one of constant/propertyOfValue/countAggFunction/sumAggFunction/regularFunction' });
const validateArgument = (
    argumentData: any,
    relevantTemplates: IRelevantTemplates,
    aggregationGroupsContext: Array<IAggregationGroup['variableOfAggregation']>,
): IConstant['type'] => {
    joiValidateNoConvert(argumentSchema, argumentData);

    if (argumentData.isConstant) return validateConstant(argumentData);
    if (argumentData.isPropertyOfVariable) return validatePropertyOfVariable(argumentData, relevantTemplates, aggregationGroupsContext);
    if (argumentData.isCountAggFunction) {
        validateCountAggFunction(argumentData, relevantTemplates, aggregationGroupsContext);
        return 'number';
    }
    if (argumentData.isSumAggFunction) {
        validateSumAggFunction(argumentData, relevantTemplates, aggregationGroupsContext);
        return 'number';
    }
    if (argumentData.isRegularFunction) return validateRegularFunction(argumentData, relevantTemplates, aggregationGroupsContext);

    throw new Error('Shouldnt reach here. argument must be one of allowed options');
};

const equationSchema = Joi.object({
    isEquation: Joi.boolean().valid(true).required(),
    lhsArgument: Joi.object().required(),
    // todo: support blank, notBlank
    // todo: greaterThan operators only for numbers & dates
    operatorBool: Joi.string().valid('equals', 'notEqual', 'lessThan', 'lessThanOrEqual', 'greaterThan', 'greaterThanOrEqual'),
    rhsArgument: Joi.object().required(),
});
const validateEquation = (
    equationData: any,
    relevantTemplates: IRelevantTemplates,
    aggregationGroupsContext: Array<IAggregationGroup['variableOfAggregation']>,
) => {
    joiValidateNoConvert(equationSchema, equationData);

    const lhsArgumentType = validateArgument(equationData.lhsArgument, relevantTemplates, aggregationGroupsContext);
    const rhsArgumentType = validateArgument(equationData.rhsArgument, relevantTemplates, aggregationGroupsContext);

    assert(
        lhsArgumentType === rhsArgumentType,
        `both sides of equation must be of same type. found "${lhsArgumentType}" (left), "${rhsArgumentType}" (right)`,
    );
};

const groupSchema = Joi.object({
    isGroup: Joi.boolean().valid(true).required(),
    ruleOfGroup: Joi.string().valid('AND', 'OR').required(),
    subFormulas: Joi.array().required(),
});
const validateGroup = (
    groupData: any,
    relevantTemplates: IRelevantTemplates,
    aggregationGroupsContext: Array<IAggregationGroup['variableOfAggregation']>,
) => {
    joiValidateNoConvert(groupSchema, groupData);

    (groupData.subFormulas as Array<any>).forEach((subFormula) => {
        // eslint-disable-next-line no-use-before-define -- circular recursive functions
        return validateFormula(subFormula, relevantTemplates, aggregationGroupsContext);
    });
};

const aggregationGroupSchema = Joi.object({
    isAggregationGroup: Joi.boolean().valid(true).required(),
    aggregation: Joi.string().valid('EVERY', 'SOME').required(),
    variableOfAggregation: variableSchema.presence('required').required(),
    ruleOfGroup: Joi.string().valid('AND', 'OR').required(),
    subFormulas: Joi.array().required(),
});
const validateAggregationGroup = (
    aggregationGroupData: any,
    relevantTemplates: IRelevantTemplates,
    aggregationGroupsContext: Array<IAggregationGroup['variableOfAggregation']>,
) => {
    const aggregationGroup: Omit<IAggregationGroup, 'subFormulas'> & { subFormulas: unknown[] } = joiValidateNoConvert(
        aggregationGroupSchema,
        aggregationGroupData,
    );

    validateVariableOfAggregation(aggregationGroup.variableOfAggregation, relevantTemplates, false, aggregationGroupsContext);

    (aggregationGroup.subFormulas as Array<any>).forEach((subFormula) => {
        // eslint-disable-next-line no-use-before-define -- circular recursive functions (formula->group->formulas)
        validateFormula(subFormula, relevantTemplates, [...aggregationGroupsContext, aggregationGroup.variableOfAggregation]);
    });
};

const formulaSchema = Joi.alternatives(
    Joi.object({ isEquation: Joi.boolean().valid(true).required() }).unknown(true),
    Joi.object({ isGroup: Joi.boolean().valid(true).required() }).unknown(true),
    Joi.object({ isAggregationGroup: Joi.boolean().valid(true).required() }).unknown(true),
).messages({ 'alternatives.match': 'formula must be one of equation/group/aggregationGroup' });
const validateFormula = (
    formulaData: any,
    relevantTemplates: IRelevantTemplates,
    aggregationGroupsContext: Array<IAggregationGroup['variableOfAggregation']>,
) => {
    joiValidateNoConvert(formulaSchema, formulaData);

    if (formulaData.isEquation) validateEquation(formulaData, relevantTemplates, aggregationGroupsContext);
    if (formulaData.isGroup) validateGroup(formulaData, relevantTemplates, aggregationGroupsContext);
    if (formulaData.isAggregationGroup) {
        validateAggregationGroup(formulaData, relevantTemplates, aggregationGroupsContext);
    }
};

const validateAndGetRelevantTemplates = async (rule: IRule): Promise<IRelevantTemplates> => {
    const entityTemplate = await EntityTemplateManager.getTemplateById(rule.entityTemplateId);

    const relationshipTemplatesOfEntityAsSource = (await RelationshipTemplateManager.searchTemplates({
        sourceEntityIds: [entityTemplate._id],
        skip: 0,
        limit: 0,
    })) as IMongoRelationshipTemplate[];

    const relationshipTemplatesOfEntityAsDestination = (await RelationshipTemplateManager.searchTemplates({
        destinationEntityIds: [entityTemplate._id],
        skip: 0,
        limit: 0,
    })) as IMongoRelationshipTemplate[];

    const connectionsTemplatesOfEntityAsSourcePromises = relationshipTemplatesOfEntityAsSource.map(async (relationshipTemplate) => {
        const destinationEntity = await EntityTemplateManager.getTemplateById(relationshipTemplate.destinationEntityId);
        return { relationshipTemplate, otherEntityTemplate: destinationEntity };
    });
    const connectionsTemplatesOfEntityAsSource = await Promise.all(connectionsTemplatesOfEntityAsSourcePromises);

    const connectionsTemplatesOfEntityAsDestinationPromises = relationshipTemplatesOfEntityAsDestination.map(async (relationshipTemplate) => {
        const sourceEntity = await EntityTemplateManager.getTemplateById(relationshipTemplate.sourceEntityId);
        return { relationshipTemplate, otherEntityTemplate: sourceEntity };
    });
    const connectionsTemplatesOfEntityAsDestination = await Promise.all(connectionsTemplatesOfEntityAsDestinationPromises);

    const connectionsTemplatesOfEntityTemplate = [...connectionsTemplatesOfEntityAsSource, ...connectionsTemplatesOfEntityAsDestination];

    return { entityTemplate, connectionsTemplatesOfEntityTemplate };
};

export const validateRuleFormula = async (rule: IRule) => {
    const relevantTemplates = await validateAndGetRelevantTemplates(rule);

    validateFormula(rule.formula, relevantTemplates, []);
};

export const validateRuleFormulaMiddleware = async (req: Request) => {
    await validateRuleFormula(req.body);
};
