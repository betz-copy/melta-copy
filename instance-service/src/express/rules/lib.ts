import axios from 'axios';
import _groupBy from 'lodash.groupby';
import _difference from 'lodash.difference';
import { trycatch } from '../../utils/lib';
import { ValidationError } from '../error';
import { IBrokenRule, IConnection, IMongoRule, IRuleRequestSchema, IRuleTransactionQuery, IRuleTransactionResult } from './interfaces';
import { IRelationshipRequestSchema, IMongoRelationshipTemplate, IRelationship } from '../relationships/interface';
import { IEntity } from '../entities/interface';
import { getEntityTemplateById } from '../entities/validator.template';
import { generateNeo4jQuery } from '.';
import config from '../../config';

const { relationshipManager, createdRelationshipIdInBrokenRules } = config;
const { url, searchRulesRoute, searchTemplatesRoute, timeout } = relationshipManager;

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

export const searchRuleTemplates = async (ruleRequest: IRuleRequestSchema) => {
    const { result, err } = await trycatch(() =>
        axios.post<IMongoRule[]>(`${url}${searchRulesRoute}`, { disabled: false, ...ruleRequest }, { timeout }),
    );

    if (err || !result) {
        throw new ValidationError(`Failed to fetch rule template schema.`);
    }

    return result.data;
};

export const getRulesByEntityTemplateId = async (entityTemplateId: string) => {
    const rules = await Promise.all([
        searchRuleTemplates({ pinnedEntityTemplateIds: [entityTemplateId] }),
        searchRuleTemplates({ unpinnedEntityTemplateIds: [entityTemplateId] }),
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

            const pinnedEntityRelationships = await getRelationshipTemplatesById(pinnedEntityTemplateId);

            const connectionsTemplates = await Promise.all(
                pinnedEntityRelationships.map(async (relTemplate) => {
                    const { sourceEntityId, destinationEntityId } = relTemplate;
                    const otherEntityTemplateId = sourceEntityId === pinnedEntity.templateId ? destinationEntityId : sourceEntityId;

                    const otherEntityTemplate = await getEntityTemplateById(otherEntityTemplateId);

                    return { relationshipTemplate: relTemplate, otherEntityTemplate };
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
