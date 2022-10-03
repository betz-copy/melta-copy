import _groupBy from 'lodash.groupby';
import _difference from 'lodash.difference';
import { IBrokenRule, IConnection, IMongoRule, IRuleTransactionQuery, IRuleTransactionResult } from './interfaces';
import { IEntity } from '../entities/interface';
import { generateNeo4jQuery } from './generateRuleNeo4jQuery';
import config from '../../config';
import { EntityTemplateManagerService } from '../../externalServices/entityTemplateManager';
import { IRelationship } from '../relationships/interface';
import { RelationshipsTemplateManagerService } from '../../externalServices/relationshipTemplateManager';

const { createdRelationshipIdInBrokenRules } = config;

const getRelationshipTemplatesOfEntityTemplate = async (entityTemplateId: string) => {
    const relationshipTemplates = await Promise.all([
        RelationshipsTemplateManagerService.searchRelationshipTemplates({ sourceEntityIds: [entityTemplateId] }),
        RelationshipsTemplateManagerService.searchRelationshipTemplates({ destinationEntityIds: [entityTemplateId] }),
    ]);

    return relationshipTemplates.flat();
};

export const getRulesByEntityTemplateId = async (entityTemplateId: string) => {
    const rules = await Promise.all([
        RelationshipsTemplateManagerService.searchRules({ pinnedEntityTemplateIds: [entityTemplateId] }),
        RelationshipsTemplateManagerService.searchRules({ unpinnedEntityTemplateIds: [entityTemplateId] }),
    ]);

    return rules.flat();
};

export const getBrokenRules = (ruleResults: IRuleTransactionResult[], createdRelationshipId?: string) => {
    const resultsByRuleId = _groupBy(
        ruleResults.filter((ruleResult) => !ruleResult.doesRuleStillApply),
        'ruleId',
    );

    const brokenRules = Object.entries(resultsByRuleId).map(([ruleId, ruleTransactionResults]) => {
        const relationshipIds = ruleTransactionResults.map((ruleTransactionResult) => {
            if (ruleTransactionResult.relationshipId === createdRelationshipId) {
                return createdRelationshipIdInBrokenRules;
            }

            return ruleTransactionResult.relationshipId;
        });

        return { ruleId, relationshipIds };
    });

    return brokenRules;
};

export const areAllBrokenRulesIgnored = (brokenRules: IBrokenRule[], ignoredRules: IBrokenRule[]) => {
    return brokenRules.every((brokenRule) => {
        const ignoredRule = ignoredRules.find(({ ruleId }) => ruleId === brokenRule.ruleId);

        if (!ignoredRule) {
            return false;
        }

        return _difference(brokenRule.relationshipIds, ignoredRule.relationshipIds).length === 0;
    });
};

export const isRelationshipLegal = async (
    relationship: IRelationship,
    sourceEntity: IEntity,
    destinationEntity: IEntity,
    rules: IMongoRule[],
): Promise<IRuleTransactionQuery[]> => {
    const generateNeo4jQueries = rules
        .filter(({ relationshipTemplateId }) => relationshipTemplateId === relationship.templateId)
        .map(async (rule) => {
            const { pinnedEntityTemplateId, unpinnedEntityTemplateId } = rule;

            const [pinnedEntity, nonPinnedEntity] =
                pinnedEntityTemplateId === sourceEntity.templateId ? [sourceEntity, destinationEntity] : [destinationEntity, sourceEntity];

            const pinnedEntityRelationships = await getRelationshipTemplatesOfEntityTemplate(pinnedEntityTemplateId);

            const connectionsTemplates = await Promise.all(
                pinnedEntityRelationships.map(async (relationshipTemplate) => {
                    const { sourceEntityId, destinationEntityId } = relationshipTemplate;
                    const otherEntityTemplateId = sourceEntityId === pinnedEntity.templateId ? destinationEntityId : sourceEntityId;

                    const otherEntityTemplate = await EntityTemplateManagerService.getEntityTemplateById(otherEntityTemplateId);

                    return { relationshipTemplate, otherEntityTemplate };
                }),
            );

            const ruleQuery = generateNeo4jQuery(rule, pinnedEntity.properties._id, nonPinnedEntity.properties._id, relationship.properties._id, {
                pinnedEntityTemplateId,
                unpinnedEntityTemplateId,
                connectionsTemplates,
            });

            return {
                ruleQuery,
                relationshipId: relationship.properties._id as string,
                ruleId: rule._id,
            };
        });

    return Promise.all(generateNeo4jQueries);
};

export const createRulesQueries = (connections: IConnection[], rules: IMongoRule[]) => {
    return connections.map((path) => isRelationshipLegal(path.relationship, path.sourceEntity, path.destinationEntity, rules));
};
