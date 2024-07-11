/* eslint-disable no-shadow */
export interface IRelationship {
    templateId: string;
    properties: Record<string, any>;
    sourceEntityId: string;
    destinationEntityId: string;
}

// reasons which rules to run on each entity
export type EntitiesIdsRulesReasonsMap = Map<{
    entityId: string;
    entityTemplateId: string;
}, ({
    type: 'dependentViaAggregation';
    dependentRelationshipTemplateId: string;
    updatedProperties?: string[] | undefined;
} | {
    type: 'dependentOnEntity';
    updatedProperties?: string[] | undefined;
})[]>;