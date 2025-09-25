import assert from 'assert';
import { isValid as isValidDate, parse } from 'date-fns';
import { Request } from 'express';
import Joi from 'joi';
import isEqual from 'lodash.isequal';
import {
    IEntitySingleProperty,
    IEntityTemplatePopulated,
    IMongoRelationshipTemplate,
    IRelevantTemplates,
    IRule,
    IConstant,
    IPropertyOfVariable,
    IVariable,
    isConstant,
    ICountAggFunction,
    IRegularFunction,
    ISumAggFunction,
    IAggregationGroup,
    DefaultController,
    defaultValidationOptions,
} from '@microservices/shared';
import { joiValidate } from '../../utils/joi';
import EntityTemplateManager from '../entityTemplate/manager';
import { RelationshipTemplateManager } from '../relationshipTemplate/manager';

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

const countAggFunctionSchema = Joi.object({
    isCountAggFunction: Joi.boolean().valid(true).required(),
    variable: variableSchema.presence('required').required(),
});

const sumAggFunctionSchema = Joi.object({
    isSumAggFunction: Joi.boolean().valid(true).required(),
    variable: variableSchema.presence('required').required(),
    property: Joi.string().required(),
});

const regularFunctionSchema = Joi.object({
    isRegularFunction: Joi.boolean().valid(true).required(),
    functionType: Joi.string().valid('toDate', 'addToDate', 'addToDateTime', 'subFromDate', 'subFromDateTime', 'getToday').required(),
    arguments: Joi.array().items(Joi.object()).required(),
});

const argumentSchema = Joi.alternatives(
    Joi.object({ isConstant: Joi.boolean().valid(true).required() }).unknown(true),
    Joi.object({ isPropertyOfVariable: Joi.boolean().valid(true).required() }).unknown(true),
    Joi.object({ isCountAggFunction: Joi.boolean().valid(true).required() }).unknown(true),
    Joi.object({ isSumAggFunction: Joi.boolean().valid(true).required() }).unknown(true),
    Joi.object({ isRegularFunction: Joi.boolean().valid(true).required() }).unknown(true),
).messages({ 'alternatives.match': 'argument must be one of constant/propertyOfValue/countAggFunction/sumAggFunction/regularFunction' });

const equationSchema = Joi.object({
    isEquation: Joi.boolean().valid(true).required(),
    lhsArgument: Joi.object().required(),
    // todo: support blank, notBlank
    // todo: greaterThan operators only for numbers & dates
    operatorBool: Joi.string().valid('equals', 'notEqual', 'lessThan', 'lessThanOrEqual', 'greaterThan', 'greaterThanOrEqual'),
    rhsArgument: Joi.object().required(),
});

const groupSchema = Joi.object({
    isGroup: Joi.boolean().valid(true).required(),
    ruleOfGroup: Joi.string().valid('AND', 'OR').required(),
    subFormulas: Joi.array().required(),
});

const aggregationGroupSchema = Joi.object({
    isAggregationGroup: Joi.boolean().valid(true).required(),
    aggregation: Joi.string().valid('EVERY', 'SOME').required(),
    variableOfAggregation: variableSchema.presence('required').required(),
    ruleOfGroup: Joi.string().valid('AND', 'OR').required(),
    subFormulas: Joi.array().required(),
});

const formulaSchema = Joi.alternatives(
    Joi.object({ isEquation: Joi.boolean().valid(true).required() }).unknown(true),
    Joi.object({ isGroup: Joi.boolean().valid(true).required() }).unknown(true),
    Joi.object({ isAggregationGroup: Joi.boolean().valid(true).required() }).unknown(true),
).messages({ 'alternatives.match': 'formula must be one of equation/group/aggregationGroup' });

class RuleValidator extends DefaultController<IMongoRelationshipTemplate, RelationshipTemplateManager> {
    private entityTemplateManager: EntityTemplateManager;

    constructor(workspaceId: string) {
        super(new RelationshipTemplateManager(workspaceId));
        this.entityTemplateManager = new EntityTemplateManager(workspaceId);
    }

    private joiValidateNoConvert = (schema: Joi.AnySchema<any>, data: any) =>
        joiValidate(schema, data, { ...defaultValidationOptions, convert: false });

    private addDefaultFieldsToTemplate = (entityTemplate: IEntityTemplatePopulated): IEntityTemplatePopulated => {
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

    private jsonSchemaTypeToType({ type, format }: IEntitySingleProperty): IConstant['type'] {
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
                return type;
        }
    }

    private validatePropertyExistInEntityTemplate(
        property: string,
        entityTemplate: IEntityTemplatePopulated,
        relevantTemplates: IRelevantTemplates,
    ): IConstant['type'] {
        const entityTemplateWithDefaults = this.addDefaultFieldsToTemplate(entityTemplate);
        const propertyTemplate = entityTemplateWithDefaults.properties.properties[property];

        if (!propertyTemplate) {
            throw new Error(`property "${property}" must exist in template "${entityTemplate._id}"`);
        }

        // If it's a relationshipReference, get the type from the related template's field
        if (propertyTemplate.format === 'relationshipReference' && propertyTemplate.relationshipReference) {
            const { relatedTemplateId } = propertyTemplate.relationshipReference;
            const relatedFieldKey = propertyTemplate.relationshipReference.relatedTemplateField;

            const relatedTemplate = [
                relevantTemplates.entityTemplate,
                ...relevantTemplates.connectionsTemplatesOfEntityTemplate.map((connection) => connection.otherEntityTemplate),
            ].find((template) => template._id === relatedTemplateId);

            if (!relatedTemplate) {
                throw new Error(`related template "${relatedTemplateId}" not found in relevantTemplates`);
            }

            const relatedTemplateWithDefaults = this.addDefaultFieldsToTemplate(relatedTemplate);
            const referencedField = relatedTemplateWithDefaults.properties.properties[relatedFieldKey];
            if (!referencedField) {
                throw new Error(`related field "${relatedFieldKey}" not found in template "${relatedTemplateId}"`);
            }

            return this.jsonSchemaTypeToType(referencedField);
        }

        return this.jsonSchemaTypeToType(propertyTemplate);
    }

    private validateConstant(constant: any): IConstant['type'] {
        this.joiValidateNoConvert(constantSchema, constant);
        return constant.type;
    }

    private validateVariableOfAggregation(
        variable: Required<IVariable>,
        relevantTemplates: IRelevantTemplates,
        shouldExistInAggregationGroupsContext: boolean,
        aggregationGroupsContext: Array<IAggregationGroup['variableOfAggregation']>,
    ): IRelevantTemplates['connectionsTemplatesOfEntityTemplate'][number] {
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

        const doesExistInAggregationGroupsContext = aggregationGroupsContext.some((variableOfAggregation) =>
            isEqual(variableOfAggregation, variable),
        );

        if (shouldExistInAggregationGroupsContext) {
            assert(
                doesExistInAggregationGroupsContext,
                `using aggregation variable (${JSON.stringify(variable)}), but not under some aggregation group with the same variable`,
            );
        } else {
            assert(!doesExistInAggregationGroupsContext, `there's already aggregation group with the same variable (${JSON.stringify(variable)})`);
        }

        return connectionTemplates;
    }

    private validatePropertyOfVariable(
        propertyOfVariableData: any,
        relevantTemplates: IRelevantTemplates,
        aggregationGroupsContext: Array<IAggregationGroup['variableOfAggregation']>,
    ): IConstant['type'] {
        const { variable, property }: IPropertyOfVariable = this.joiValidateNoConvert(propertyOfVariableSchema, propertyOfVariableData);

        if (variable.aggregatedRelationship) {
            const { otherEntityTemplate } = this.validateVariableOfAggregation(
                variable as Required<IVariable>,
                relevantTemplates,
                true,
                aggregationGroupsContext,
            );

            return this.validatePropertyExistInEntityTemplate(property, otherEntityTemplate, relevantTemplates);
        }

        assert(variable.entityTemplateId === relevantTemplates.entityTemplate._id, 'variable.entityTemplateId must be the same as entityTemplateId');

        return this.validatePropertyExistInEntityTemplate(property, relevantTemplates.entityTemplate, relevantTemplates);
    }

    private validateCountAggFunction(
        countAggFunctionData: any,
        relevantTemplates: IRelevantTemplates,
        aggregationGroupsContext: Array<IAggregationGroup['variableOfAggregation']>,
    ) {
        const countAggFunction: ICountAggFunction = this.joiValidateNoConvert(countAggFunctionSchema, countAggFunctionData);

        this.validateVariableOfAggregation(countAggFunction.variable, relevantTemplates, false, aggregationGroupsContext);
    }

    private validateSumAggFunction(
        sumAggFunctionData: any,
        relevantTemplates: IRelevantTemplates,
        aggregationGroupsContext: Array<IAggregationGroup['variableOfAggregation']>,
    ) {
        const sumAggFunction: ISumAggFunction = this.joiValidateNoConvert(sumAggFunctionSchema, sumAggFunctionData);

        const { otherEntityTemplate } = this.validateVariableOfAggregation(
            sumAggFunction.variable,
            relevantTemplates,
            false,
            aggregationGroupsContext,
        );

        return this.validatePropertyExistInEntityTemplate(sumAggFunction.property, otherEntityTemplate, relevantTemplates);
    }

    private validateRegularFunction(
        regularFunctionData: any,
        relevantTemplates: IRelevantTemplates,
        aggregationGroupsContext: Array<IAggregationGroup['variableOfAggregation']>,
    ): { valueType: IConstant['type']; doesHaveTodayFunc: boolean } {
        const {
            arguments: funcArguments,
            functionType,
        }: {
            isRegularFunction: true;
            functionType: IRegularFunction['functionType'];
            arguments: object[];
        } = this.joiValidateNoConvert(regularFunctionSchema, regularFunctionData);

        funcArguments.forEach((argument) => {
            // eslint-disable-next-line no-use-before-define -- circular recursive functions
            this.validateArgument(argument, relevantTemplates, aggregationGroupsContext);
        });
        switch (functionType) {
            case 'toDate': {
                assert(funcArguments.length === 1, 'toDate must contain exactly 1 argument');
                return { valueType: 'date', doesHaveTodayFunc: false };
            }

            case 'addToDate':
            case 'subFromDate': {
                assert(funcArguments.length === 2, 'add/subToDate function must contain exactly 2 arguments');

                const [_, secondArgument] = funcArguments;
                assert(
                    isConstant(secondArgument) && secondArgument.type === 'dateDuration',
                    'add/subToDate function second argument be of type dateDuration',
                );

                return { valueType: 'date', doesHaveTodayFunc: false };
            }

            case 'addToDateTime':
            case 'subFromDateTime': {
                assert(funcArguments.length === 2, 'add/subToDateTime function must contain exactly 2 arguments');

                const [_, secondArgument] = funcArguments;
                assert(
                    isConstant(secondArgument) && secondArgument.type === 'dateTimeDuration',
                    'add/subToDate function second argument be of type dateTimeDuration',
                );

                return { valueType: 'dateTime', doesHaveTodayFunc: false };
            }

            case 'getToday': {
                assert(funcArguments.length === 0, 'getToday function mustnt contain arguments');

                // dont allow getToday() to use in relationshipfields (in aggregation functions).
                // because rule will run every night on all entities of template, so to allow DB indexes to optimize query (of search failed entities)
                // DB indexes optimization for rule w/ getToday not yet implemented, but to have the option in the future
                assert(aggregationGroupsContext.length === 0, 'getToday function is not allowed inside aggregation, because of performance issues');

                return { valueType: 'date', doesHaveTodayFunc: true };
            }

            default:
                throw new Error('Shouldnt reach here. functionType must be one of allowed types');
        }
    }

    private validateArgument(
        argumentData: any,
        relevantTemplates: IRelevantTemplates,
        aggregationGroupsContext: Array<IAggregationGroup['variableOfAggregation']>,
    ): { valueType: IConstant['type']; doesHaveTodayFunc: boolean } {
        this.joiValidateNoConvert(argumentSchema, argumentData);

        if (argumentData.isConstant) return { valueType: this.validateConstant(argumentData), doesHaveTodayFunc: false };
        if (argumentData.isPropertyOfVariable)
            return {
                valueType: this.validatePropertyOfVariable(argumentData, relevantTemplates, aggregationGroupsContext),
                doesHaveTodayFunc: false,
            };
        if (argumentData.isCountAggFunction) {
            this.validateCountAggFunction(argumentData, relevantTemplates, aggregationGroupsContext);
            return { valueType: 'number', doesHaveTodayFunc: false };
        }
        if (argumentData.isSumAggFunction) {
            this.validateSumAggFunction(argumentData, relevantTemplates, aggregationGroupsContext);
            return { valueType: 'number', doesHaveTodayFunc: false };
        }
        if (argumentData.isRegularFunction) return this.validateRegularFunction(argumentData, relevantTemplates, aggregationGroupsContext);

        throw new Error('Shouldnt reach here. argument must be one of allowed options');
    }

    private validateEquation(
        equationData: any,
        relevantTemplates: IRelevantTemplates,
        aggregationGroupsContext: Array<IAggregationGroup['variableOfAggregation']>,
    ): { doesHaveTodayFunc: boolean } {
        this.joiValidateNoConvert(equationSchema, equationData);

        const { valueType: lhsValueType, doesHaveTodayFunc: lhsDoesHaveTodayFunc } = this.validateArgument(
            equationData.lhsArgument,
            relevantTemplates,
            aggregationGroupsContext,
        );
        const { valueType: rhsValueType, doesHaveTodayFunc: rhsDoesHaveTodayFunc } = this.validateArgument(
            equationData.rhsArgument,
            relevantTemplates,
            aggregationGroupsContext,
        );

        assert(
            lhsValueType === rhsValueType,
            `both sides of equation must be of same type. found "${lhsValueType}" (left), "${rhsValueType}" (right)`,
        );

        return { doesHaveTodayFunc: lhsDoesHaveTodayFunc || rhsDoesHaveTodayFunc };
    }

    private validateGroup(
        groupData: any,
        relevantTemplates: IRelevantTemplates,
        aggregationGroupsContext: Array<IAggregationGroup['variableOfAggregation']>,
    ): { doesHaveTodayFunc: boolean } {
        this.joiValidateNoConvert(groupSchema, groupData);

        let doesHaveTodayFunc = false;

        (groupData.subFormulas as Array<any>).forEach((subFormula) => {
            // eslint-disable-next-line no-use-before-define -- circular recursive functions
            const subFormulaValidateResult = this.validateFormula(subFormula, relevantTemplates, aggregationGroupsContext);

            if (subFormulaValidateResult.doesHaveTodayFunc) doesHaveTodayFunc = true;
        });

        return { doesHaveTodayFunc };
    }

    private validateAggregationGroup(
        aggregationGroupData: any,
        relevantTemplates: IRelevantTemplates,
        aggregationGroupsContext: Array<IAggregationGroup['variableOfAggregation']>,
    ): { doesHaveTodayFunc: boolean } {
        const aggregationGroup: Omit<IAggregationGroup, 'subFormulas'> & { subFormulas: unknown[] } = this.joiValidateNoConvert(
            aggregationGroupSchema,
            aggregationGroupData,
        );

        this.validateVariableOfAggregation(aggregationGroup.variableOfAggregation, relevantTemplates, false, aggregationGroupsContext);

        let doesHaveTodayFunc = false;

        (aggregationGroup.subFormulas as Array<any>).forEach((subFormula) => {
            // eslint-disable-next-line no-use-before-define -- circular recursive functions (formula->group->formulas)
            const subFormulaValidateResult = this.validateFormula(subFormula, relevantTemplates, [
                ...aggregationGroupsContext,
                aggregationGroup.variableOfAggregation,
            ]);

            if (subFormulaValidateResult.doesHaveTodayFunc) doesHaveTodayFunc = true;
        });

        return { doesHaveTodayFunc };
    }

    private validateFormula(
        formulaData: any,
        relevantTemplates: IRelevantTemplates,
        aggregationGroupsContext: Array<IAggregationGroup['variableOfAggregation']>,
    ): { doesHaveTodayFunc: boolean } {
        this.joiValidateNoConvert(formulaSchema, formulaData);

        if (formulaData.isEquation) return this.validateEquation(formulaData, relevantTemplates, aggregationGroupsContext);
        if (formulaData.isGroup) return this.validateGroup(formulaData, relevantTemplates, aggregationGroupsContext);
        if (formulaData.isAggregationGroup) return this.validateAggregationGroup(formulaData, relevantTemplates, aggregationGroupsContext);

        throw new Error('Shouldnt reach here. formula must be one of allowed options');
    }

    private async validateAndGetRelevantTemplates(rule: Omit<IRule, 'disabled' | 'doesFormulaHaveTodayFunc'>): Promise<IRelevantTemplates> {
        const entityTemplate = await this.entityTemplateManager.getTemplateById(rule.entityTemplateId);

        const relationshipTemplatesOfEntityAsSource = (await this.manager.searchTemplates({
            sourceEntityIds: [entityTemplate._id],
            skip: 0,
            limit: 0,
        })) as IMongoRelationshipTemplate[];

        const relationshipTemplatesOfEntityAsDestination = (await this.manager.searchTemplates({
            destinationEntityIds: [entityTemplate._id],
            skip: 0,
            limit: 0,
        })) as IMongoRelationshipTemplate[];

        const connectionsTemplatesOfEntityAsSourcePromises = relationshipTemplatesOfEntityAsSource.map(async (relationshipTemplate) => {
            const destinationEntity = await this.entityTemplateManager.getTemplateById(relationshipTemplate.destinationEntityId);
            return { relationshipTemplate, otherEntityTemplate: destinationEntity };
        });
        const connectionsTemplatesOfEntityAsSource = await Promise.all(connectionsTemplatesOfEntityAsSourcePromises);

        const connectionsTemplatesOfEntityAsDestinationPromises = relationshipTemplatesOfEntityAsDestination.map(async (relationshipTemplate) => {
            const sourceEntity = await this.entityTemplateManager.getTemplateById(relationshipTemplate.sourceEntityId);
            return { relationshipTemplate, otherEntityTemplate: sourceEntity };
        });
        const connectionsTemplatesOfEntityAsDestination = await Promise.all(connectionsTemplatesOfEntityAsDestinationPromises);

        const connectionsTemplatesOfEntityTemplate = [...connectionsTemplatesOfEntityAsSource, ...connectionsTemplatesOfEntityAsDestination];

        return { entityTemplate, connectionsTemplatesOfEntityTemplate };
    }

    async validateRuleFormula(rule: Omit<IRule, 'disabled' | 'doesFormulaHaveTodayFunc'>) {
        const relevantTemplates = await this.validateAndGetRelevantTemplates(rule);

        return this.validateFormula(rule.formula, relevantTemplates, []);
    }

    async validateRuleFormulaMiddleware(req: Request) {
        const { doesHaveTodayFunc } = await this.validateRuleFormula(req.body);

        // eslint-disable-next-line no-underscore-dangle
        req.body.doesFormulaHaveTodayFunc = doesHaveTodayFunc;
    }
}

export default RuleValidator;
