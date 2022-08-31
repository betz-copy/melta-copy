import { JsonItem, JsonTree, Utils as QbUtils } from 'react-awesome-query-builder';
import axios from '../../axios';
import { RelationshipTemplateRuleWizardValues } from '../../common/wizards/rule';
import { environment } from '../../globals';
import { IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import { IMongoRelationshipTemplateRule, IRelationshipTemplateRule } from '../../interfaces/rules';
import { RuleParser } from '../../utils/rules/parser';
import { RuleSerializer } from '../../utils/rules/serializer';

const { rules } = environment.api;

const ruleObjectToRuleForm = (
    rule: IRelationshipTemplateRule | null,
    entityTemplates: IMongoEntityTemplatePopulated[],
): RelationshipTemplateRuleWizardValues | undefined => {
    if (!rule) return undefined;
    const { formula, ...restOfRule } = rule;

    const jsonTree = RuleSerializer.formulaToJsonTreeWrapper(formula, entityTemplates);

    return {
        ...restOfRule,
        formula: QbUtils.loadTree({ ...jsonTree, properties: { ...jsonTree.properties, isLocked: true } } as JsonTree),
    };
};

const updateDisabledRuleRequest = async (ruleId: string, disabled: boolean) => {
    const { data } = await axios.patch<IMongoRelationshipTemplateRule>(`${rules}/${ruleId}/status`, { disabled });
    return data;
};

const createRuleRequest = async (newRule: RelationshipTemplateRuleWizardValues) => {
    const { data } = await axios.post<IMongoRelationshipTemplateRule>(rules, {
        ...newRule,
        formula: RuleParser.jsonTreeToFormula(QbUtils.getTree(newRule.formula) as JsonItem),
    });
    return data;
};

const updateRuleRequest = async (ruleId: string, updatedRule: RelationshipTemplateRuleWizardValues) => {
    const { data } = await axios.put<IMongoRelationshipTemplateRule>(`${rules}/${ruleId}`, {
        name: updatedRule.name,
        description: updatedRule.description,
    });
    return data;
};

const deleteRuleRequest = async (ruleId: string) => {
    const { data } = await axios.delete<IMongoRelationshipTemplateRule>(`${rules}/${ruleId}`);
    return data;
};

export { createRuleRequest, updateRuleRequest, deleteRuleRequest, ruleObjectToRuleForm, updateDisabledRuleRequest };
