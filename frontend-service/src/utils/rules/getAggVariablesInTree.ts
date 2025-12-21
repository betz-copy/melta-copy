/* eslint-disable @typescript-eslint/no-use-before-define -- recursive circular functions */

import { IVariable } from '@packages/rule';
import { ImmutableTree, JsonGroup, JsonItem, JsonRuleGroupExt, Utils as QbUtils } from '@react-awesome-query-builder/mui';
import { RuleParser } from './parser';

export const getAggVariablesInGroup = (group: JsonGroup): Required<IVariable>[] => {
    if (!group.children1) return [];
    return (group.children1 as JsonItem[]).flatMap(getAggVariablesInJsonItem);
};

export const getAggVariablesInRuleGroup = (ruleGroup: JsonRuleGroupExt): Required<IVariable>[] => {
    const aggVariables: Required<IVariable>[] = [];
    if (ruleGroup.properties?.field) {
        const variableOfAggregation = RuleParser.variableParser(ruleGroup.properties!.field as string) as Required<IVariable>;
        aggVariables.push(variableOfAggregation);
    }

    if (ruleGroup.children1) {
        aggVariables.push(...(ruleGroup.children1 as JsonItem[]).flatMap(getAggVariablesInJsonItem));
    }

    return aggVariables;
};

export const getAggVariablesInJsonItem = (jsonItem: JsonItem): Required<IVariable>[] => {
    switch (jsonItem.type) {
        case 'group':
            return getAggVariablesInGroup(jsonItem);
        case 'rule_group':
            return getAggVariablesInRuleGroup(jsonItem as JsonRuleGroupExt);
        default:
            return [];
    }
};

export const getAggVariablesInTree = (tree: ImmutableTree): Required<IVariable>[] => {
    return getAggVariablesInJsonItem(QbUtils.getTree(tree) as JsonItem);
};
