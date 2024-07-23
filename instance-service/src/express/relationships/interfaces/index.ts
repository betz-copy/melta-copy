/* eslint-disable no-shadow */
export interface IRelationship {
    templateId: string;
    properties: Record<string, any>;
    sourceEntityId: string;
    destinationEntityId: string;
}

// reasons which rules to run on each entity
// entityId -> reasons[], entityTemplateId
export type EntitiesIdsRulesReasonsMap = Map<
    string, {
    reasons: 
    ({
        type: 'dependentViaAggregation';
        dependentRelationshipTemplateId: string;
        updatedProperties?: string[] | undefined;
    } | 
    {
        type: 'dependentOnEntity';
        updatedProperties?: string[] | undefined;
    })[], 
    entityTemplateId: string
}>;