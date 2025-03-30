import { IEntityExpanded } from '../interfaces/entities';
import { IEntityTemplateMap } from '../interfaces/entityTemplates';
import { IMongoRelationshipTemplatePopulated, IRelationshipTemplateMap } from '../interfaces/relationshipTemplates';
import { IConnectionTemplateOfExpandedEntity } from '../pages/Entity';
import { IConnectionExpanded, IConnectionTemplateExpanded } from '../pages/Entity/components/print';

export const handleExpandedRelationships = (
    data: IEntityExpanded,
    expandedEntity: IEntityExpanded,
    connectionsTemplates: IConnectionTemplateOfExpandedEntity[],
    relationshipTemplates: IRelationshipTemplateMap,
    entityTemplates: IEntityTemplateMap,
) => {
    const extendedRelationships = data?.connections.filter(
        (connection) =>
            !expandedEntity.connections.some(
                (currentConnection) => currentConnection.relationship.properties._id === connection.relationship.properties._id,
            ),
    );

    const relatedEntities = expandedEntity.connections.map((connection) => {
        const relationshipTemplate = connectionsTemplates.find(
            (connectionsTemplate) => connectionsTemplate.relationshipTemplate._id === connection.relationship.templateId,
        );
        return {
            relationshipId: connection.relationship.properties._id,
            relationshipTemplate: connection.relationship,
            entityId: relationshipTemplate?.isExpandedEntityRelationshipSource
                ? connection.destinationEntity.properties._id
                : connection.sourceEntity.properties._id,
        };
    });

    const extendedRelationshipsTemplates: IConnectionTemplateExpanded[] = [];
    const currentExtendedRelationships: IConnectionExpanded[] = [];

    extendedRelationships.forEach((extendedRelationship) => {
        const connectedRelationship = relatedEntities.find(
            (relatedEntity) =>
                relatedEntity.entityId === extendedRelationship.destinationEntity.properties._id ||
                relatedEntity.entityId === extendedRelationship.sourceEntity.properties._id,
        );
        if (!connectedRelationship) return;

        const parentRelationshipInstance = expandedEntity.connections.find(
            (connection) => connection.relationship.properties._id === connectedRelationship?.relationshipId,
        )!;

        const fullParentRelationshipTemplate = connectionsTemplates.find(
            (connectionsTemplate) => connectedRelationship?.relationshipTemplate.templateId === connectionsTemplate.relationshipTemplate._id,
        )!;

        const parentTemplate = relationshipTemplates.get(extendedRelationship.relationship.templateId)!;
        const { sourceEntityId, destinationEntityId, ...parentTemplateProperties } = parentTemplate;
        const parentTemplatePopulated: IMongoRelationshipTemplatePopulated = {
            ...parentTemplateProperties,
            sourceEntity: entityTemplates.get(sourceEntityId)!,
            destinationEntity: entityTemplates.get(destinationEntityId)!,
        };

        const relationshipTemplate: IConnectionTemplateOfExpandedEntity = {
            relationshipTemplate: parentTemplatePopulated,
            isExpandedEntityRelationshipSource: connectedRelationship.entityId === extendedRelationship.destinationEntity.properties._id,
        };
        if (
            !extendedRelationshipsTemplates.some(
                (extendedRelationshipsTemplate) =>
                    relationshipTemplate.relationshipTemplate._id === extendedRelationshipsTemplate.relationshipTemplate._id,
            )
        )
            extendedRelationshipsTemplates.push({ ...relationshipTemplate, parentRelationship: fullParentRelationshipTemplate });
        currentExtendedRelationships.push({ ...extendedRelationship, parentRelationship: parentRelationshipInstance });
    });
    return { extendedRelationshipsTemplates, currentExtendedRelationships };
};
