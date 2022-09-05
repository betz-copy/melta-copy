import axios from 'axios';
import { trycatch } from '../../utils/lib';
import { ValidationError } from '../error';
import { IRelationshipRequestSchema, IMongoRelationshipTemplate, IRelationship } from './interface';
import { generateNeo4jQuery } from '../rules';
import { IEntity } from '../entities/interface';
import { getEntityTemplateById } from '../entities/validator.template';
import config from '../../config';
import { IMongoRelationshipTemplateRule } from '../rules/interfaces';

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

const getRelationshipTemplatesById = async (entityTemplateId: string) => {
    const relationshipTemplates = await Promise.all([
        searchRelationshipTemplates({ sourceEntityIds: [entityTemplateId] }),
        searchRelationshipTemplates({ destinationEntityIds: [entityTemplateId] }),
    ]);

    return relationshipTemplates.flat();
};

export const isRelationshipLegal = async (
    relationship: IRelationship,
    sourceEntity: IEntity,
    destinationEntity: IEntity,
    relationshipTemplateRules: IMongoRelationshipTemplateRule[],
) => {
    const generateNeo4jQueries = relationshipTemplateRules
        .filter(({ relationshipTemplateId }) => relationshipTemplateId === relationship.templateId)
        .map(async (relationshipTemplateRule) => {
            const { pinnedEntityTemplateId } = relationshipTemplateRule;

            const [pinnedEntity, nonPinnedEntity] =
                pinnedEntityTemplateId === sourceEntity.templateId ? [sourceEntity, destinationEntity] : [destinationEntity, sourceEntity];

            const pinnedEntityRelationships = await getRelationshipTemplatesById(pinnedEntityTemplateId);

            const connectionsTemplates = await Promise.all(
                pinnedEntityRelationships.map(async (relTemplate) => {
                    const { sourceEntityId, destinationEntityId } = relTemplate;
                    const unpinnedEntityTemplateId = sourceEntityId === pinnedEntity.templateId ? destinationEntityId : sourceEntityId;

                    const unpinnedEntityTemplate = await getEntityTemplateById(unpinnedEntityTemplateId);

                    return { relationshipTemplate: relTemplate, unpinnedEntityTemplate };
                }),
            );

            const ruleQuery = generateNeo4jQuery(
                relationshipTemplateRule,
                pinnedEntity.properties._id,
                nonPinnedEntity.properties._id,
                relationship.properties._id,
                pinnedEntity.templateId,
                nonPinnedEntity.templateId,
                connectionsTemplates,
            );

            return {
                ruleQuery,
                relationshipId: relationship.properties._id,
                ruleId: relationshipTemplateRule._id,
            };
        });

    return Promise.all(generateNeo4jQueries);
};
