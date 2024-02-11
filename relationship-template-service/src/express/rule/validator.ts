import * as assert from 'assert';
import { isValid as isValidDate, parse } from 'date-fns';
import { Request } from 'express';
import * as Joi from 'joi';
import DefaultController from '../../utils/express/controller';
import { defaultValidationOptions, joiValidate } from '../../utils/joi';
import { EntityTemplateManagerService, IEntitySingleProperty, IEntityTemplatePopulated } from '../externalServices/entityTemplateManager';
import { IMongoRelationshipTemplate, IRelationshipTemplate } from '../relationshipTemplate/interface';
import { RelationshipTemplateManager } from '../relationshipTemplate/manager';
import { IRegularFunction, IRelevantTemplates, IRule } from './interfaces';
import { IConstant, isConstant } from './interfaces/argument';

export class RuleValidator extends DefaultController<IRelationshipTemplate, RelationshipTemplateManager> {
    private entityTemplateManagerService: EntityTemplateManagerService;

    constructor(dbName: string) {
        super(new RelationshipTemplateManager(dbName));
        this.entityTemplateManagerService = new EntityTemplateManagerService(dbName);
    }

    private static joiValidateNoConvert = (schema: Joi.AnySchema<any>, data: any) =>
        joiValidate(schema, data, { ...defaultValidationOptions, convert: false });

    private static addDefaultFieldsToTemplate = (entityTemplate: IEntityTemplatePopulated): IEntityTemplatePopulated => {
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

    private static jsonSchemaTypeToType = ({ type, format }: IEntitySingleProperty): IConstant['type'] => {
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
    };

    private static validatePropertyExistInEntityTemplate = (property: string, entityTemplate: IEntityTemplatePopulated): IConstant['type'] => {
        const entityTemplateWithDefaults = RuleValidator.addDefaultFieldsToTemplate(entityTemplate);

        const propertyTemplate = entityTemplateWithDefaults.properties.properties[property];
        if (propertyTemplate) {
            return RuleValidator.jsonSchemaTypeToType(propertyTemplate);
        }

        throw new Error(`property "${property}" must exist in template "${entityTemplate._id}"`);
    };

    private static numberRegExp = '[1-9]\\d*'; // digits that doesnt start with 0

    private static dateDurationRegExp = new RegExp(
        `^(${RuleValidator.numberRegExp}Y)?(${RuleValidator.numberRegExp}M)?(${RuleValidator.numberRegExp}D)?$`,
    );

    private static dateTimeDurationRegExp = new RegExp(
        `^(${RuleValidator.numberRegExp}Y)?(${RuleValidator.numberRegExp}M)?(${RuleValidator.numberRegExp}D)?(${RuleValidator.numberRegExp}H)?$`,
    );

    private static constantSchema = Joi.object({
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
                        .pattern(RuleValidator.dateDurationRegExp)
                        .min(1) // added at least one component of duration (Y/M/D)
                        .message('dateDuration must be of format "[nY][nM][nD]" (square brackets means optional)'),
                },
                {
                    is: 'dateTimeDuration',
                    then: Joi.string()
                        .pattern(RuleValidator.dateTimeDurationRegExp)
                        .min(1) // added at least one component of duration (Y/M/D/H)
                        .message('dateDuration must be of format "[nY][nM][nD][nH]" (square brackets means optional)'),
                },
            ],
        }).required(),
    });

    private static validateConstant = (constant: any): IConstant['type'] => {
        RuleValidator.joiValidateNoConvert(RuleValidator.constantSchema, constant);
        return constant.type;
    };

    private static propertyOfVariableSchema = Joi.object({
        isPropertyOfVariable: Joi.boolean().valid(true).required(),
        variableName: Joi.string().required(),
        property: Joi.string().required(),
    });

    private static validatePropertyOfVariable = (
        propertyOfVariable: any,
        relevantTemplates: IRelevantTemplates,
        aggregationContext: IRelevantTemplates['connectionsTemplatesOfPinnedEntityTemplate'][number] | undefined,
    ): IConstant['type'] => {
        RuleValidator.joiValidateNoConvert(RuleValidator.propertyOfVariableSchema, propertyOfVariable);

        if (propertyOfVariable.variableName.indexOf('.') > -1) {
            assert(aggregationContext, `variableName "${propertyOfVariable.variableName}" contains dot notation, but not under aggregation`);

            const expectedAggregationVariableName = `${relevantTemplates.pinnedEntityTemplate._id}.${aggregationContext.relationshipTemplate._id}.${aggregationContext.otherEntityTemplate._id}`;
            assert(
                propertyOfVariable.variableName === expectedAggregationVariableName,
                `aggregation variable name "${propertyOfVariable.variableName}" with dot notation must be "${expectedAggregationVariableName}"`,
            );

            return RuleValidator.validatePropertyExistInEntityTemplate(propertyOfVariable.property, aggregationContext.otherEntityTemplate);
        }

        const variableEntityTemplate = [relevantTemplates.pinnedEntityTemplate, relevantTemplates.unpinnedEntityTemplate].find(
            ({ _id }) => _id === propertyOfVariable.variableName,
        );

        assert(variableEntityTemplate, 'variable name must be of pinnedEntityTemplateId or unpinnedEntityTemplateId');

        return RuleValidator.validatePropertyExistInEntityTemplate(propertyOfVariable.property, variableEntityTemplate);
    };

    private static validateVariableNameOfAggregation = (variableName: string, relevantTemplates: IRelevantTemplates) => {
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

    private static countAggFunctionSchema = Joi.object({
        isCountAggFunction: Joi.boolean().valid(true).required(),
        variableName: Joi.string().required(),
    });

    private static validateCountAggFunction = (countAggFunction: any, relevantTemplates: IRelevantTemplates) => {
        RuleValidator.joiValidateNoConvert(RuleValidator.countAggFunctionSchema, countAggFunction);

        RuleValidator.validateVariableNameOfAggregation(countAggFunction.variableName, relevantTemplates);
    };

    private static sumAggFunctionSchema = Joi.object({
        isSumAggFunction: Joi.boolean().valid(true).required(),
        variableName: Joi.string().required(),
        property: Joi.string().required(),
    });

    private static validateSumAggFunction = (sumAggFunction: any, relevantTemplates: IRelevantTemplates) => {
        RuleValidator.joiValidateNoConvert(RuleValidator.sumAggFunctionSchema, sumAggFunction);

        RuleValidator.validateVariableNameOfAggregation(sumAggFunction.variableName, relevantTemplates);
    };

    private static regularFunctionSchema = Joi.object({
        isRegularFunction: Joi.boolean().valid(true).required(),
        functionType: Joi.string().valid('toDate', 'addToDate', 'addToDateTime', 'subFromDate', 'subFromDateTime').required(),
        arguments: Joi.array().items(Joi.object()).required(),
    });

    private static validateRegularFunction = (
        data: any,
        relevantTemplates: IRelevantTemplates,
        aggregationContext: IRelevantTemplates['connectionsTemplatesOfPinnedEntityTemplate'][number] | undefined,
    ): IConstant['type'] => {
        RuleValidator.joiValidateNoConvert(RuleValidator.regularFunctionSchema, data);
        const { arguments: funcArguments, functionType } = data as {
            isRegularFunction: true;
            functionType: IRegularFunction['functionType'];
            arguments: object[];
        };

        funcArguments.forEach((argument) => {
            // eslint-disable-next-line no-use-before-define -- circular recursive functions
            RuleValidator.validateArgument(argument, relevantTemplates, aggregationContext);
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

    private static argumentSchema = Joi.alternatives(
        Joi.object({ isConstant: Joi.boolean().valid(true).required() }).unknown(true),
        Joi.object({ isPropertyOfVariable: Joi.boolean().valid(true).required() }).unknown(true),
        Joi.object({ isCountAggFunction: Joi.boolean().valid(true).required() }).unknown(true),
        Joi.object({ isSumAggFunction: Joi.boolean().valid(true).required() }).unknown(true),
        Joi.object({ isRegularFunction: Joi.boolean().valid(true).required() }).unknown(true),
    ).messages({ 'alternatives.match': 'argument must be one of constant/propertyOfValue/countAggFunction/sumAggFunction/regularFunction' });

    private static validateArgument = (
        argument: any,
        relevantTemplates: IRelevantTemplates,
        aggregationContext: IRelevantTemplates['connectionsTemplatesOfPinnedEntityTemplate'][number] | undefined,
    ): IConstant['type'] => {
        RuleValidator.joiValidateNoConvert(RuleValidator.argumentSchema, argument);

        if (argument.isConstant) return RuleValidator.validateConstant(argument);
        if (argument.isPropertyOfVariable) return RuleValidator.validatePropertyOfVariable(argument, relevantTemplates, aggregationContext);
        if (argument.isCountAggFunction) {
            assert(!aggregationContext, 'aggregation (countAgg) inside of an aggregation is not allowed');
            RuleValidator.validateCountAggFunction(argument, relevantTemplates);
            return 'number';
        }
        if (argument.isSumAggFunction) {
            assert(!aggregationContext, 'aggregation (sumAgg) inside of an aggregation is not allowed');
            RuleValidator.validateSumAggFunction(argument, relevantTemplates);
            return 'number';
        }
        if (argument.isRegularFunction) return RuleValidator.validateRegularFunction(argument, relevantTemplates, aggregationContext);

        throw new Error('Shouldnt reach here. argument must be one of allowed options');
    };

    private static equationSchema = Joi.object({
        isEquation: Joi.boolean().valid(true).required(),
        lhsArgument: Joi.object().required(),
        // todo: support blank, notBlank
        // todo: greaterThan operators only for numbers & dates
        operatorBool: Joi.string().valid('equals', 'notEqual', 'lessThan', 'lessThanOrEqual', 'greaterThan', 'greaterThanOrEqual'),
        rhsArgument: Joi.object().required(),
    });

    private static validateEquation = (
        equation: any,
        relevantTemplates: IRelevantTemplates,
        aggregationContext: IRelevantTemplates['connectionsTemplatesOfPinnedEntityTemplate'][number] | undefined,
    ) => {
        RuleValidator.joiValidateNoConvert(RuleValidator.equationSchema, equation);

        const lhsArgumentType = RuleValidator.validateArgument(equation.lhsArgument, relevantTemplates, aggregationContext);
        const rhsArgumentType = RuleValidator.validateArgument(equation.rhsArgument, relevantTemplates, aggregationContext);

        assert(
            lhsArgumentType === rhsArgumentType,
            `both sides of equation must be of same type. found "${lhsArgumentType}" (left), "${rhsArgumentType}" (right)`,
        );
    };

    private static groupSchema = Joi.object({
        isGroup: Joi.boolean().valid(true).required(),
        ruleOfGroup: Joi.string().valid('AND', 'OR').required(),
        subFormulas: Joi.array().required(),
    });

    private static validateGroup = (
        group: any,
        relevantTemplates: IRelevantTemplates,
        aggregationContext: IRelevantTemplates['connectionsTemplatesOfPinnedEntityTemplate'][number] | undefined,
    ) => {
        RuleValidator.joiValidateNoConvert(RuleValidator.groupSchema, group);

        (group.subFormulas as Array<any>).forEach((subFormula) => {
            // eslint-disable-next-line no-use-before-define -- circular recursive functions
            return RuleValidator.validateFormula(subFormula, relevantTemplates, aggregationContext);
        });
    };

    private static aggregationGroupSchema = Joi.object({
        isAggregationGroup: Joi.boolean().valid(true).required(),
        aggregation: Joi.string().valid('EVERY', 'SOME').required(),
        variableNameOfAggregation: Joi.string(),
        ruleOfGroup: Joi.string().valid('AND', 'OR').required(),
        subFormulas: Joi.array().required(),
    });

    private static validateAggregationGroup = (aggregationGroup: any, relevantTemplates: IRelevantTemplates) => {
        RuleValidator.joiValidateNoConvert(RuleValidator.aggregationGroupSchema, aggregationGroup);

        RuleValidator.validateVariableNameOfAggregation(aggregationGroup.variableNameOfAggregation, relevantTemplates);

        const [_pinnedEntityTemplateId, relationshipTemplateId, _otherEntityTemplateId] = aggregationGroup.variableNameOfAggregation.split('.');
        const aggregationContext = relevantTemplates.connectionsTemplatesOfPinnedEntityTemplate.find(
            ({ relationshipTemplate }) => relationshipTemplate._id === relationshipTemplateId,
        )!;

        (aggregationGroup.subFormulas as Array<any>).forEach((subFormula) => {
            // eslint-disable-next-line no-use-before-define -- circular recursive functions (formula->group->formulas)
            RuleValidator.validateFormula(subFormula, relevantTemplates, aggregationContext);
        });
    };

    private static formulaSchema = Joi.alternatives(
        Joi.object({ isEquation: Joi.boolean().valid(true).required() }).unknown(true),
        Joi.object({ isGroup: Joi.boolean().valid(true).required() }).unknown(true),
        Joi.object({ isAggregationGroup: Joi.boolean().valid(true).required() }).unknown(true),
    ).messages({ 'alternatives.match': 'formula must be one of equation/group/aggregationGroup' });

    private static validateFormula = (
        formula: any,
        relevantTemplates: IRelevantTemplates,
        aggregationContext: IRelevantTemplates['connectionsTemplatesOfPinnedEntityTemplate'][number] | undefined,
    ) => {
        RuleValidator.joiValidateNoConvert(RuleValidator.formulaSchema, formula);

        if (formula.isEquation) RuleValidator.validateEquation(formula, relevantTemplates, aggregationContext);
        if (formula.isGroup) RuleValidator.validateGroup(formula, relevantTemplates, aggregationContext);
        if (formula.isAggregationGroup) {
            assert(!aggregationContext, 'aggregation group inside of aggregation is not allowed');
            RuleValidator.validateAggregationGroup(formula, relevantTemplates);
        }
    };

    private validateAndGetRelevantTemplates = async (rule: IRule): Promise<IRelevantTemplates> => {
        const relationshipTemplateOfRule = await this.manager.getTemplateById(rule.relationshipTemplateId);

        const doesPinnedIdInRelationship = [relationshipTemplateOfRule.sourceEntityId, relationshipTemplateOfRule.destinationEntityId].includes(
            rule.pinnedEntityTemplateId,
        );

        assert(doesPinnedIdInRelationship, "rule's pinnedEntityTemplateId is not in rule's relationshipTemplate");

        const otherEntityTemplateId =
            rule.pinnedEntityTemplateId === relationshipTemplateOfRule.sourceEntityId
                ? relationshipTemplateOfRule.destinationEntityId
                : relationshipTemplateOfRule.sourceEntityId;
        const doesUnpinnedIdIsOtherEntityTemplate = rule.unpinnedEntityTemplateId === otherEntityTemplateId;
        assert(doesUnpinnedIdIsOtherEntityTemplate, "rule's unpinnedEntityTemplateId is not the other entity template id in relationshipTemplate");

        const pinnedEntityTemplate = await this.entityTemplateManagerService.getEntityTemplateById(rule.pinnedEntityTemplateId);

        const unpinnedEntityTemplateId =
            relationshipTemplateOfRule.sourceEntityId === rule.pinnedEntityTemplateId
                ? relationshipTemplateOfRule.destinationEntityId
                : relationshipTemplateOfRule.sourceEntityId;
        const unpinnedEntityTemplate = await this.entityTemplateManagerService.getEntityTemplateById(unpinnedEntityTemplateId);

        const relationshipTemplatesOfPinnedEntityAsSource = (await this.manager.searchTemplates({
            sourceEntityIds: [pinnedEntityTemplate._id],
            skip: 0,
            limit: 0,
        })) as IMongoRelationshipTemplate[];

        const relationshipTemplatesOfPinnedEntityAsDestination = (await this.manager.searchTemplates({
            destinationEntityIds: [pinnedEntityTemplate._id],
            skip: 0,
            limit: 0,
        })) as IMongoRelationshipTemplate[];

        const connectionsTemplatesOfPinnedEntityAsSourcePromises = relationshipTemplatesOfPinnedEntityAsSource.map(async (relationshipTemplate) => {
            const destinationEntity = await this.entityTemplateManagerService.getEntityTemplateById(relationshipTemplate.destinationEntityId);
            return { relationshipTemplate, otherEntityTemplate: destinationEntity };
        });
        const connectionsTemplatesOfPinnedEntityAsSource = await Promise.all(connectionsTemplatesOfPinnedEntityAsSourcePromises);

        const connectionsTemplatesOfPinnedEntityAsDestinationPromises = relationshipTemplatesOfPinnedEntityAsDestination.map(
            async (relationshipTemplate) => {
                const sourceEntity = await this.entityTemplateManagerService.getEntityTemplateById(relationshipTemplate.sourceEntityId);
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

    private validateRuleFormula = async (rule: IRule) => {
        const relevantTemplates = await this.validateAndGetRelevantTemplates(rule);

        RuleValidator.validateFormula(rule.formula, relevantTemplates, undefined);
    };

    public validateRuleFormulaMiddleware = async (req: Request) => {
        await this.validateRuleFormula(req.body);
    };
}
