import axios from 'axios';
import { trycatch } from '../../utils/lib';
import { ValidationError } from '../error';
import { IRelationshipRequestSchema, IRelationship, IMongoRelationshipTemplate } from './interface';
import { generateNeo4jQuery } from '../rules';
import { IEntity } from '../entities/interface';
import { getEntityTemplateById } from '../entities/validator.template';
import { searchRuleTemplates } from '../rules/lib';
import config from '../../config';

const { relationshipManager } = config;
const { url, searchTemplatesRoute, timeout } = relationshipManager;

export const searchRelationshipTemplates = async (relationshipRequest: IRelationshipRequestSchema) => {
    const { result, err } = await trycatch(() =>
        axios.post<IMongoRelationshipTemplate[]>(`${url}${searchTemplatesRoute}`, relationshipRequest, { timeout }),
    );

    if (err || !result) {
        throw new ValidationError(`Failed to fetch relationship template schemas.`);
    }

    return result.data;
};

const getRelationshipTemplateRules = async (relationshipTemplate: IMongoRelationshipTemplate) => {
    const relationshipTemplateRules = await Promise.all([
        searchRuleTemplates({ relationshipTemplateIds: [relationshipTemplate._id] }),
        searchRuleTemplates({ pinnedEntityTemplateIds: [relationshipTemplate.sourceEntityId] }),
        searchRuleTemplates({ pinnedEntityTemplateIds: [relationshipTemplate.destinationEntityId] }),
    ]);

    const flattenedRelationshipTemplateRules = relationshipTemplateRules.flat();
    const relationshipTemplateRuleIds = flattenedRelationshipTemplateRules.map((el) => el._id);
    const filteredRelationshipTemplateRules = flattenedRelationshipTemplateRules.filter(
        ({ _id }, index) => !relationshipTemplateRuleIds.includes(_id, index + 1),
    );

    return filteredRelationshipTemplateRules;
};

const getRelationshipTemplatesById = async (entityTemplateId: string) => {
    return Promise.all([
        searchRelationshipTemplates({ sourceEntityIds: [entityTemplateId] }),
        searchRelationshipTemplates({ destinationEntityIds: [entityTemplateId] }),
    ]);
};

export const isRelationshipLegal = async (
    relationship: IRelationship,
    sourceEntity: IEntity,
    destinationEntity: IEntity,
    relationshipTemplate: IMongoRelationshipTemplate,
) => {
    const relationshipTemplateRules = await getRelationshipTemplateRules(relationshipTemplate);

    const generateNeo4jQueries = relationshipTemplateRules.map(async (relationshipTemplateRule) => {
        const { pinnedEntityTemplateId } = relationshipTemplateRule;

        const [pinnedEntity, nonPinnedEntity] =
            pinnedEntityTemplateId === sourceEntity.templateId ? [sourceEntity, destinationEntity] : [destinationEntity, sourceEntity];

        const pinnedEntityRelationships = await getRelationshipTemplatesById(pinnedEntityTemplateId);

        const connectionsTemplates = await Promise.all(
            pinnedEntityRelationships.flat().map(async (relTemplate) => {
                const { sourceEntityId, destinationEntityId } = relTemplate;
                const unpinnedEntityTemplateId = sourceEntityId === pinnedEntity.templateId ? destinationEntityId : sourceEntityId;

                const unpinnedEntityTemplate = await getEntityTemplateById(unpinnedEntityTemplateId);

                return { relationshipTemplate: relTemplate, unpinnedEntityTemplate };
            }),
        );

        return generateNeo4jQuery(
            relationshipTemplateRule,
            pinnedEntity.properties._id,
            nonPinnedEntity.properties._id,
            relationship.properties._id,
            pinnedEntity.templateId,
            nonPinnedEntity.templateId,
            connectionsTemplates,
        );
    });

    return Promise.all(generateNeo4jQueries);
};
