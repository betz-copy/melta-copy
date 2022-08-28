import axios from 'axios';
import { trycatch } from '../../utils/lib';
import { ValidationError } from '../error';
import { IRuleRequestSchema, IRelationship, IMongoRelationshipTemplate } from './interface';
import { IRelationshipTemplateRule } from '../rules/interfaces';
import { generateNeo4jQuery } from '../rules';
import config from '../../config';
import { IMongoEntityTemplate } from '../entities/interface';

const { relationshipManager } = config;
const { url, searchRulesRoute, timeout } = relationshipManager;

export const searchRuleTemplates = async (ruleRequest: IRuleRequestSchema) => {
    const { result, err } = await trycatch(() => axios.post<IRelationshipTemplateRule[]>(`${url}${searchRulesRoute}`, ruleRequest, { timeout }));

    if (err || !result) {
        throw new ValidationError(`Failed to fetch rule template schema.`);
    }

    return result.data;
};

export const isRelationshipLegal = async (
    relationship: IRelationship,
    sourceEntityTemplate: IMongoEntityTemplate,
    destinationEntityTemplate: IMongoEntityTemplate,
    relationshipTemplate: IMongoRelationshipTemplate,
) => {
    const relationshipTemplateRules = await Promise.all([
        searchRuleTemplates({ relationshipTemplateIds: [relationshipTemplate._id] }),
        searchRuleTemplates({ pinnedEntityTemplateIds: [relationshipTemplate.sourceEntityId] }),
        searchRuleTemplates({ pinnedEntityTemplateIds: [relationshipTemplate.destinationEntityId] }),
    ]);

    const { sourceEntityId, destinationEntityId } = relationship;

    const generateNeo4jQueries = relationshipTemplateRules.flat().map((relationshipTemplateRule) => {
        const { pinnedEntityTemplateId } = relationshipTemplateRule;

        const [pinnedEntityId, nonPinnedEntityId] =
            pinnedEntityTemplateId === sourceEntityTemplate._id ? [sourceEntityId, destinationEntityId] : [destinationEntityId, sourceEntityId];

        return generateNeo4jQuery(
            relationshipTemplateRule,
            pinnedEntityId,
            nonPinnedEntityId,
            relationship.properties._id,
            sourceEntityTemplate,
            destinationEntityTemplate,
            [{ relationshipTemplate, unpinnedEntityTemplate: destinationEntityTemplate }],
        );
    });

    return generateNeo4jQueries;
};
