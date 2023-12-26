import { JsonGroup, RuleProperties, JsonItem, JsonRuleGroupExt } from 'react-awesome-query-builder';
import { IAggregationGroup, IEquation, IGroup, IOperatorBool, IRegularFunction } from '../../interfaces/rules';
import { IArgument, IConstant, IPropertyOfVariable } from '../../interfaces/rules/argument';
import { IFormula } from '../../interfaces/rules/formula';
import { FunctionObject, ValueType } from './interfaces';

export class RuleParser {
    private static formatAggregationField = (field: string) => {
        return field.includes('.') ? field.split('.')[1] : field;
    };

    private static toDateFunctionParser = (property: string): IRegularFunction => {
        const formattedField = property.replace('-ignoreHour', '');

        return {
            isRegularFunction: true,
            functionType: 'toDate',
            arguments: [RuleParser.propertyParser(formattedField)],
        };
    };

    private static propertyParser(property: string): IPropertyOfVariable | IRegularFunction {
        const formattedField = RuleParser.formatAggregationField(property);

        if (property.includes('-ignoreHour')) {
            return RuleParser.toDateFunctionParser(property);
        }

        const lastDashIndex = formattedField.lastIndexOf('-');

        const propertyName = formattedField.substring(lastDashIndex + 1);

        if (propertyName === null || propertyName === undefined) throw new Error('property can not be empty');

        return {
            isPropertyOfVariable: true,
            variableName: formattedField.substring(0, lastDashIndex).replaceAll('-', '.'),
            property: propertyName,
        };
    }

    private static addToDateFunctionParser = (funcObj: FunctionObject): IRegularFunction => {
        const dateArgumentKey = funcObj.func === 'addToDate' || funcObj.func === 'subFromDate' ? 'date' : 'dateTime';
        const dateArgument = RuleParser.propertyParser(funcObj.args[dateArgumentKey].value); // assuming dateArgument is a property

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

    private static constantParser = (value: any, valueType: ValueType): IConstant => {
        if (value === null || value === undefined) throw new Error('value can not be empty');
        return {
            isConstant: true,
            type: RuleParser.valueTypeParser(valueType),
            value,
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

    private static equationParser = (properties: RuleProperties): IEquation => {
        const [rhsArgumentValueSrc] = properties.valueSrc!;

        let rhsArgument: IArgument;
        if (rhsArgumentValueSrc === 'field') {
            rhsArgument = RuleParser.propertyParser(properties.value[0]);
        } else if (rhsArgumentValueSrc === 'func') {
            // only add/subToDate[Time] functions can be in rhs
            rhsArgument = RuleParser.addToDateFunctionParser(properties.value[0]);
        } else {
            rhsArgument = RuleParser.constantParser(properties.value[0], properties.valueType![0] as ValueType);
        }
        return {
            isEquation: true,
            operatorBool: RuleParser.operatorParser(properties.operator!),
            lhsArgument: RuleParser.propertyParser(properties.field!),
            rhsArgument,
        };
    };

    private static conjunctionParser = (conjunction: string | undefined) => {
        return (conjunction || 'AND') as 'AND' | 'OR';
    };

    private static aggregationParser = (operator: 'some' | 'all') => {
        return operator === 'some' ? 'SOME' : 'EVERY';
    };

    private static groupParser = (group: JsonGroup): IGroup => {
        return {
            isGroup: true,
            ruleOfGroup: RuleParser.conjunctionParser(group.properties?.conjunction),
            subFormulas: Object.values(group.children1!).map(RuleParser.jsonTreeToFormula),
        };
    };

    private static aggregationGroupParser = (ruleGroup: JsonRuleGroupExt): IAggregationGroup | IEquation => {
        if (ruleGroup.properties!.operator === 'some' || ruleGroup.properties!.operator === 'all') {
            return {
                isAggregationGroup: true,
                variableNameOfAggregation: ruleGroup.properties!.field!.replaceAll('-', '.'),
                aggregation: RuleParser.aggregationParser(ruleGroup.properties!.operator),
                ruleOfGroup: RuleParser.conjunctionParser(ruleGroup.properties!.conjunction),
                subFormulas: Object.values(ruleGroup.children1!).map(RuleParser.jsonTreeToFormula),
            } as IAggregationGroup;
        }

        if (Object.values(ruleGroup.children1!).length > 0) {
            throw new Error('count aggregation doesn`t support subFormulas');
        }

        return {
            isEquation: true,
            operatorBool: RuleParser.operatorParser(ruleGroup.properties!.operator!),
            lhsArgument: {
                isCountAggFunction: true,
                variableName: ruleGroup.properties!.field!.replaceAll('-', '.'),
            },
            rhsArgument: RuleParser.constantParser(ruleGroup.properties!.value[0], ruleGroup.properties!.valueType![0] as ValueType),
        } as IEquation;
    };

    static jsonTreeToFormula = (child: JsonItem): IFormula => {
        const { properties, type } = child;

        switch (type) {
            case 'rule':
                return RuleParser.equationParser(properties);
            case 'group':
                return RuleParser.groupParser(child);
            case 'rule_group':
                return RuleParser.aggregationGroupParser(child as JsonRuleGroupExt);
            default:
                throw new Error('child rule not suported');
        }
    };
}
