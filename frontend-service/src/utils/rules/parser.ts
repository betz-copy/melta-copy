import { Conjunction } from '@packages/common';
import { IPropertyValue } from '@packages/entity';
import {
    IAggregationGroup,
    IArgument,
    IConstant,
    IEquation,
    IFormula,
    IGroup,
    IOperatorBool,
    IPropertyOfVariable,
    IRegularFunction,
    IVariable,
} from '@packages/rule';
import { JsonGroup, JsonItem, JsonRule, JsonRuleGroupExt, RuleProperties } from '@react-awesome-query-builder/mui';
import { environment } from '../../globals';
import { FunctionObject, ValueType } from './interfaces';

const { formulaGetTodayVarName } = environment;

export class RuleParser {
    static variableParser = (variableNameFromField: string): IVariable => {
        const variableNameWithoutAggregationContext = variableNameFromField.split('.').pop() ?? variableNameFromField;
        const [entityTemplateId, relationshipTemplateId, otherEntityTemplateId, variableNameSuffix] = variableNameWithoutAggregationContext.split(
            '-',
        ) as
            | [string]
            | [string, string, string] // aggregation variable
            | [string, string, string, string]; // aggregation variable with suffix

        return {
            entityTemplateId,
            aggregatedRelationship: relationshipTemplateId
                ? {
                      relationshipTemplateId,
                      otherEntityTemplateId: otherEntityTemplateId!,
                      variableNameSuffix,
                  }
                : undefined,
        };
    };

    private static toDateFunctionParser = (property: string, ruleGroupsContext: JsonRuleGroupExt[]): IRegularFunction => {
        const formattedField = property.replace('-ignoreHour', '');

        return {
            isRegularFunction: true,
            functionType: 'toDate',
            arguments: [RuleParser.fieldParser(formattedField, ruleGroupsContext)],
        };
    };

    private static fieldParser(field: string, ruleGroupsContext: JsonRuleGroupExt[]): IPropertyOfVariable | IRegularFunction {
        if (field.includes('-ignoreHour')) {
            return RuleParser.toDateFunctionParser(field, ruleGroupsContext);
        }

        if (field === formulaGetTodayVarName) {
            if (ruleGroupsContext.length > 0) throw new Error(`${formulaGetTodayVarName} is not allowed inside aggregation group (for performance)`);

            return { isRegularFunction: true, functionType: 'getToday', arguments: [] };
        }

        const lastDashIndex = field.lastIndexOf('-');

        const variableName = field.substring(0, lastDashIndex);
        const propertyName = field.substring(lastDashIndex + 1);

        return {
            isPropertyOfVariable: true,
            variable: RuleParser.variableParser(variableName),
            property: propertyName,
        };
    }

    private static addToDateFunctionParser = (funcObj: FunctionObject, ruleGroupsContext: JsonRuleGroupExt[]): IRegularFunction => {
        const dateArgumentKey = funcObj.func === 'addToDate' || funcObj.func === 'subFromDate' ? 'date' : 'dateTime';
        const dateArgument = RuleParser.fieldParser(funcObj.args[dateArgumentKey].value, ruleGroupsContext); // assuming dateArgument is a property

        const durationValueType: ValueType = funcObj.func === 'addToDate' || funcObj.func === 'subFromDate' ? 'dateDuration' : 'dateTimeDuration';
        const durationArgument = RuleParser.constantParser(funcObj.args.duration.value, durationValueType);

        return {
            isRegularFunction: true,
            functionType: funcObj.func,
            arguments: [dateArgument, durationArgument],
        };
    };

    private static valueTypeParser = (valueType: ValueType): IConstant['type'] => {
        switch (valueType) {
            case 'text':
                return 'string';
            case 'number':
                return 'number';
            case 'date':
                return 'date';
            case 'datetime':
                return 'dateTime';
            case 'boolean':
                return 'boolean';
            case 'dateDuration':
                return 'dateDuration';
            case 'dateTimeDuration':
                return 'dateTimeDuration';
            default:
                throw new Error('invalid valueType shouldnt reach here');
        }
    };

    private static constantParser = (value: IPropertyValue, valueType: ValueType): IConstant => {
        if (value === null || value === undefined) throw new Error('value can not be empty');

        let parsedValue = value;

        // RAQB library datetime gives dates with space (for example "2025-12-27 10:00:00.007Z"). make it ISO Date
        if (valueType === 'datetime') parsedValue = (value as string).replace(' ', 'T');

        return {
            isConstant: true,
            type: RuleParser.valueTypeParser(valueType),
            value: parsedValue,
        };
    };

    private static operatorParser = (operator: string): IOperatorBool => {
        switch (operator) {
            case 'equal':
                return 'equals';
            case 'not_equal':
                return 'notEqual';
            case 'less':
                return 'lessThan';
            case 'less_or_equal':
                return 'lessThanOrEqual';
            case 'greater':
                return 'greaterThan';
            case 'greater_or_equal':
                return 'greaterThanOrEqual';
            default:
                throw new Error('operator not supported');
        }
    };

    private static equationParser = (properties: RuleProperties, ruleGroupsContext: JsonRuleGroupExt[]): IEquation => {
        const [rhsArgumentValueSrc] = properties.valueSrc!;

        let rhsArgument: IArgument;
        if (rhsArgumentValueSrc === 'field') {
            rhsArgument = RuleParser.fieldParser(properties.value[0], ruleGroupsContext);
        } else if (rhsArgumentValueSrc === 'func') {
            // only add/subToDate[Time] functions can be in rhs
            rhsArgument = RuleParser.addToDateFunctionParser(properties.value[0], ruleGroupsContext);
        } else {
            rhsArgument = RuleParser.constantParser(properties.value[0], properties.valueType![0] as ValueType);
        }
        return {
            isEquation: true,
            operatorBool: RuleParser.operatorParser(properties.operator!),
            lhsArgument: RuleParser.fieldParser(properties.field as string, ruleGroupsContext),
            rhsArgument,
        };
    };

    private static conjunctionParser = (conjunction: string | undefined): Conjunction => {
        return (conjunction || Conjunction.AND) as Conjunction;
    };

    private static aggregationParser = (operator: 'some' | 'all') => {
        return operator === 'some' ? 'SOME' : 'EVERY';
    };

    private static groupParser = (group: JsonGroup, ruleGroupsContext: JsonRuleGroupExt[]): IGroup => {
        return {
            isGroup: true,
            ruleOfGroup: RuleParser.conjunctionParser(group.properties?.conjunction),
            subFormulas: (group.children1 as JsonItem[]).map((child) => RuleParser.jsonItemParser(child, ruleGroupsContext)),
        };
    };

    private static aggregationGroupParser = (ruleGroup: JsonRuleGroupExt, ruleGroupsContext: JsonRuleGroupExt[]): IAggregationGroup | IEquation => {
        const newRuleGroupsContext = [...ruleGroupsContext, ruleGroup];

        const variableOfAggregation = RuleParser.variableParser(ruleGroup.properties!.field as string);
        if (ruleGroup.properties!.operator === 'some' || ruleGroup.properties!.operator === 'all') {
            return {
                isAggregationGroup: true,
                variableOfAggregation,
                aggregation: RuleParser.aggregationParser(ruleGroup.properties!.operator),
                ruleOfGroup: RuleParser.conjunctionParser(ruleGroup.properties!.conjunction),
                subFormulas: (ruleGroup.children1 as JsonRule[]).map((child) => RuleParser.jsonItemParser(child, newRuleGroupsContext)),
            } as IAggregationGroup;
        }

        if ((ruleGroup.children1 as JsonRule[]).length > 0) {
            throw new Error('count aggregation doesn`t support subFormulas');
        }

        return {
            isEquation: true,
            operatorBool: RuleParser.operatorParser(ruleGroup.properties!.operator!),
            lhsArgument: {
                isCountAggFunction: true,
                variable: variableOfAggregation,
            },
            rhsArgument: RuleParser.constantParser(ruleGroup.properties!.value[0], ruleGroup.properties!.valueType![0] as ValueType),
        } as IEquation;
    };

    static jsonItemParser = (child: JsonItem, ruleGroupsContext: JsonRuleGroupExt[]): IFormula => {
        const { properties, type } = child;

        switch (type) {
            case 'rule':
                return RuleParser.equationParser(properties, ruleGroupsContext);
            case 'group':
                return RuleParser.groupParser(child, ruleGroupsContext);
            case 'rule_group':
                return RuleParser.aggregationGroupParser(child as JsonRuleGroupExt, ruleGroupsContext);
            default:
                throw new Error('child rule not suported');
        }
    };

    static jsonTreeToFormula = (tree: JsonItem): IFormula => {
        return RuleParser.jsonItemParser(tree, []);
    };
}
