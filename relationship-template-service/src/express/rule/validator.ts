import * as Joi from 'joi';
import { Request } from 'express';
import * as assert from 'assert';
import { defaultValidationOptions } from '../../utils/joi';
import { IRelationshipTemplateRule, IRelevantTemplates } from './interfaces';
import { RelationshipTemplateManager } from '../relationshipTemplate/manager';
import { EntityTemplateManagerService, IEntityTemplatePopulated } from '../externalServices/entityTemplateManager';
import { IMongoRelationshipTemplate } from '../relationshipTemplate/interface';

const joiValidate = (schema: Joi.AnySchema<any>, data: any): void => {
    const { error } = schema.validate(data, defaultValidationOptions);
    if (error) {
        throw error;
    }
};

const validatePropertyExistInEntityTemplate = (property: string, entityTemplate: IEntityTemplatePopulated) => {
    const doesPropertyExistUnderOtherTemplate = Object.keys(entityTemplate.properties.properties).some((propertyName) => propertyName === property);

    assert(doesPropertyExistUnderOtherTemplate, `property "${property}" must exist in template "${entityTemplate._id}"`);
};

const constantSchema = Joi.object({
    isConstant: Joi.boolean().valid(true).required(),
    value: Joi.alternatives(Joi.string(), Joi.number(), Joi.boolean())
        .messages({ 'alternatives.match': 'constant value must be one of string/number/boolean/isostring' })
        .required(),
});
const validateConstant = (constant: any) => {
    joiValidate(constantSchema, constant);
};

const propertyOfVariableSchema = Joi.object({
    isPropertyOfVariable: Joi.boolean().valid(true).required(),
    variableName: Joi.string().required(),
    property: Joi.string().required(),
});
const validatePropertyOfVariable = (
    propertyOfVariable: any,
    relevantTemplates: IRelevantTemplates,
    aggregationContext: IRelevantTemplates['connectionsTemplatesOfPinnedEntityTemplate'][number] | undefined,
) => {
    joiValidate(propertyOfVariableSchema, propertyOfVariable);

    if (propertyOfVariable.variableName.indexOf('.') > -1) {
        assert(aggregationContext, `variableName "${propertyOfVariable.variableName}" contains dot notation, but not under aggregation`);

        const expectedAggregationVariableName = `${relevantTemplates.pinnedEntityTemplate._id}.${aggregationContext.relationshipTemplate._id}.${aggregationContext.otherEntityTemplate._id}`;
        assert(
            propertyOfVariable.variableName === expectedAggregationVariableName,
            `aggregation variable name "${propertyOfVariable.variableName}" with dot notation must be "${expectedAggregationVariableName}"`,
        );

        validatePropertyExistInEntityTemplate(propertyOfVariable.property, aggregationContext.otherEntityTemplate);
        return;
    }

    const variableEntityTemplate = [relevantTemplates.pinnedEntityTemplate, relevantTemplates.unpinnedEntityTemplate].find(
        ({ _id }) => _id === propertyOfVariable.variableName,
    );

    assert(variableEntityTemplate, 'variable name must be of pinnedEntityTemplateId or unpinnedEntityTemplateId');

    validatePropertyExistInEntityTemplate(propertyOfVariable.property, variableEntityTemplate);
};

const validateVariableNameOfAggregation = (variableName: string, relevantTemplates: IRelevantTemplates) => {
    assert(
        variableName.split('.').length === 3,
        'variable name of aggregation must be of format "pinnedEntityTemplateId.relationshipTemplateId.otherEntityTemplateId"',
    );

    const [_pinnedEntityTemplateId, relationshipTemplateId, _otherEntityTemplateId] = variableName.split('.');

    const connectionTemplates = relevantTemplates.connectionsTemplatesOfPinnedEntityTemplate.find(
        ({ relationshipTemplate }) => relationshipTemplate._id === relationshipTemplateId,
    );

    assert(
        connectionTemplates,
        `relationshipTemplateId "${relationshipTemplateId}" doesnt exist for pinnedEntityTemplate "${relevantTemplates.pinnedEntityTemplate.name}" connections`,
    );

    const expectedAggregationVariableName = `${relevantTemplates.pinnedEntityTemplate._id}.${connectionTemplates.relationshipTemplate._id}.${connectionTemplates.otherEntityTemplate._id}`;
    assert(
        variableName === expectedAggregationVariableName,
        `variable name of aggregation of relationship "${relationshipTemplateId}" must be of format "${expectedAggregationVariableName}"`,
    );
};

const countAggFunctionSchema = Joi.object({
    isCountAggFunction: Joi.boolean().valid(true).required(),
    variableName: Joi.string().required(),
});
const validateCountAggFunction = (countAggFunction: any, relevantTemplates: IRelevantTemplates) => {
    joiValidate(countAggFunctionSchema, countAggFunction);

    validateVariableNameOfAggregation(countAggFunction.variableName, relevantTemplates);
};

const sumAggFunctionSchema = Joi.object({
    isSumAggFunction: Joi.boolean().valid(true).required(),
    variableName: Joi.string().required(),
    property: Joi.string().required(),
});
const validateSumAggFunction = (sumAggFunction: any, relevantTemplates: IRelevantTemplates) => {
    joiValidate(sumAggFunctionSchema, sumAggFunction);

    validateVariableNameOfAggregation(sumAggFunction.variableName, relevantTemplates);
};

const regularSumFunctionSchema = Joi.object({
    isRegularSumFunction: Joi.boolean().valid(true).required(),
    lhsArgument: Joi.object().required(),
    rhsArgument: Joi.object().required(),
});
const validateRegularSumFunction = (
    regularSumFunction: any,
    relevantTemplates: IRelevantTemplates,
    aggregationContext: IRelevantTemplates['connectionsTemplatesOfPinnedEntityTemplate'][number] | undefined,
) => {
    joiValidate(regularSumFunctionSchema, regularSumFunction);

    // eslint-disable-next-line no-use-before-define -- circular recursive functions
    validateArgument(regularSumFunction.lhsArgument, relevantTemplates, aggregationContext);
    // eslint-disable-next-line no-use-before-define -- circular recursive functions
    validateArgument(regularSumFunction.rhsArgument, relevantTemplates, aggregationContext);
};

const argumentSchema = Joi.alternatives(
    Joi.object({ isConstant: Joi.boolean().valid(true).required() }).unknown(true),
    Joi.object({ isPropertyOfVariable: Joi.boolean().valid(true).required() }).unknown(true),
    Joi.object({ isCountAggFunction: Joi.boolean().valid(true).required() }).unknown(true),
    Joi.object({ isSumAggFunction: Joi.boolean().valid(true).required() }).unknown(true),
    Joi.object({ isRegularSumFunction: Joi.boolean().valid(true).required() }).unknown(true),
).messages({ 'alternatives.match': 'argument must be one of constant/propertyOfValue/countAggFunction/sumAggFunction/regularSumAggFunction' });
const validateArgument = (
    argument: any,
    relevantTemplates: IRelevantTemplates,
    aggregationContext: IRelevantTemplates['connectionsTemplatesOfPinnedEntityTemplate'][number] | undefined,
) => {
    joiValidate(argumentSchema, argument);

    if (argument.isConstant) validateConstant(argument);
    if (argument.isPropertyOfVariable) validatePropertyOfVariable(argument, relevantTemplates, aggregationContext);
    if (argument.isCountAggFunction) {
        assert(!aggregationContext, 'aggregation (countAgg) inside of an aggregation is not allowed');
        validateCountAggFunction(argument, relevantTemplates);
    }
    if (argument.isSumAggFunction) {
        assert(!aggregationContext, 'aggregation (countAgg) inside of an aggregation is not allowed');
        validateSumAggFunction(argument, relevantTemplates);
    }
    if (argument.isRegularSumFunction) validateRegularSumFunction(argument, relevantTemplates, aggregationContext);
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
    equation: any,
    relevantTemplates: IRelevantTemplates,
    aggregationContext: IRelevantTemplates['connectionsTemplatesOfPinnedEntityTemplate'][number] | undefined,
) => {
    joiValidate(equationSchema, equation);
    // todo: check lhs & rhs are from the same type (both date/number/string)

    validateArgument(equation.lhsArgument, relevantTemplates, aggregationContext);
    validateArgument(equation.rhsArgument, relevantTemplates, aggregationContext);
};

const groupSchema = Joi.object({
    isGroup: Joi.boolean().valid(true).required(),
    ruleOfGroup: Joi.string().valid('AND', 'OR').required(),
    subFormulas: Joi.array().required(),
});
const validateGroup = (
    group: any,
    relevantTemplates: IRelevantTemplates,
    aggregationContext: IRelevantTemplates['connectionsTemplatesOfPinnedEntityTemplate'][number] | undefined,
) => {
    joiValidate(groupSchema, group);

    (group.subFormulas as Array<any>).forEach((subFormula) => {
        // eslint-disable-next-line no-use-before-define -- circular recursive functions
        return validateFormula(subFormula, relevantTemplates, aggregationContext);
    });
};

const aggregationGroupSchema = Joi.object({
    isAggregationGroup: Joi.boolean().valid(true).required(),
    aggregation: Joi.string().valid('EVERY', 'SOME').required(),
    variableNameOfAggregation: Joi.string(),
    ruleOfGroup: Joi.string().valid('AND', 'OR').required(),
    subFormulas: Joi.array().required(),
});
const validateAggregationGroup = (aggregationGroup: any, relevantTemplates: IRelevantTemplates) => {
    joiValidate(aggregationGroupSchema, aggregationGroup);

    validateVariableNameOfAggregation(aggregationGroup.variableNameOfAggregation, relevantTemplates);

    const [_pinnedEntityTemplateId, relationshipTemplateId, _otherEntityTemplateId] = aggregationGroup.variableNameOfAggregation.split('.');
    const aggregationContext = relevantTemplates.connectionsTemplatesOfPinnedEntityTemplate.find(
        ({ relationshipTemplate }) => relationshipTemplate._id === relationshipTemplateId,
    )!;

    (aggregationGroup.subFormulas as Array<any>).forEach((subFormula) => {
        // eslint-disable-next-line no-use-before-define -- circular recursive functions (formula->group->formulas)
        validateFormula(subFormula, relevantTemplates, aggregationContext);
    });
};

const formulaSchema = Joi.alternatives(
    Joi.object({ isEquation: Joi.boolean().valid(true).required() }).unknown(true),
    Joi.object({ isGroup: Joi.boolean().valid(true).required() }).unknown(true),
    Joi.object({ isAggregationGroup: Joi.boolean().valid(true).required() }).unknown(true),
).messages({ 'alternatives.match': 'formula must be one of equation/group/aggregationGroup' });
const validateFormula = (
    formula: any,
    relevantTemplates: IRelevantTemplates,
    aggregationContext: IRelevantTemplates['connectionsTemplatesOfPinnedEntityTemplate'][number] | undefined,
) => {
    joiValidate(formulaSchema, formula);

    if (formula.isEquation) validateEquation(formula, relevantTemplates, aggregationContext);
    if (formula.isGroup) validateGroup(formula, relevantTemplates, aggregationContext);
    if (formula.isAggregationGroup) {
        assert(!aggregationContext, 'aggregation group inside of aggregation is not allowed');
        validateAggregationGroup(formula, relevantTemplates);
    }
};

const validateAndGetRelevantTemplates = async (rule: IRelationshipTemplateRule): Promise<IRelevantTemplates> => {
    const relationshipTemplateOfRule = await RelationshipTemplateManager.getTemplateById(rule.relationshipTemplateId);

    const doesPinnedIdInRelationship = [
        relationshipTemplateOfRule.sourceEntityId,
        relationshipTemplateOfRule.destinationEntityId,
    ].includes(rule.pinnedEntityTemplateId);

    assert(doesPinnedIdInRelationship, "rule's pinnedEntityTemplateId is not in rule's relationshipTemplate");

    const pinnedEntityTemplate = await EntityTemplateManagerService.getEntityTemplateById(rule.pinnedEntityTemplateId);

    const unpinnedEntityTemplateId =
        relationshipTemplateOfRule.sourceEntityId === rule.pinnedEntityTemplateId
            ? relationshipTemplateOfRule.destinationEntityId
            : relationshipTemplateOfRule.sourceEntityId;
    const unpinnedEntityTemplate = await EntityTemplateManagerService.getEntityTemplateById(unpinnedEntityTemplateId);

    const relationshipTemplatesOfPinnedEntityAsSource = (await RelationshipTemplateManager.searchTemplates({
        sourceEntityIds: [pinnedEntityTemplate._id],
        skip: 0,
        limit: 0,
    })) as IMongoRelationshipTemplate[];

    const relationshipTemplatesOfPinnedEntityAsDestination = (await RelationshipTemplateManager.searchTemplates({
        destinationEntityIds: [pinnedEntityTemplate._id],
        skip: 0,
        limit: 0,
    })) as IMongoRelationshipTemplate[];

    const connectionsTemplatesOfPinnedEntityAsSourcePromises = relationshipTemplatesOfPinnedEntityAsSource.map(async (relationshipTemplate) => {
        const destinationEntity = await EntityTemplateManagerService.getEntityTemplateById(relationshipTemplate.destinationEntityId);
        return { relationshipTemplate, otherEntityTemplate: destinationEntity };
    });
    const connectionsTemplatesOfPinnedEntityAsSource = await Promise.all(connectionsTemplatesOfPinnedEntityAsSourcePromises);

    const connectionsTemplatesOfPinnedEntityAsDestinationPromises = relationshipTemplatesOfPinnedEntityAsDestination.map(
        async (relationshipTemplate) => {
            const sourceEntity = await EntityTemplateManagerService.getEntityTemplateById(relationshipTemplate.sourceEntityId);
            return { relationshipTemplate, otherEntityTemplate: sourceEntity };
        },
    );
    const connectionsTemplatesOfPinnedEntityAsDestination = await Promise.all(connectionsTemplatesOfPinnedEntityAsDestinationPromises);

    const connectionsTemplatesOfPinnedEntityTemplate = [
        ...connectionsTemplatesOfPinnedEntityAsSource,
        ...connectionsTemplatesOfPinnedEntityAsDestination,
    ];

    return { pinnedEntityTemplate, unpinnedEntityTemplate, connectionsTemplatesOfPinnedEntityTemplate };
};

export const validateRuleFormula = async (rule: IRelationshipTemplateRule) => {
    const relevantTemplates = await validateAndGetRelevantTemplates(rule);

    validateFormula(rule.formula, relevantTemplates, undefined);
};

export const validateRuleFormulaMiddleware = async (req: Request) => {
    await validateRuleFormula(req.body);
};
