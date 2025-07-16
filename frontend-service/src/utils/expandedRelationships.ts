import { IEntityExpanded } from '../interfaces/entities';
import { IEntityTemplateMap } from '../interfaces/entityTemplates';
import { IRelationshipTemplateMap } from '../interfaces/relationshipTemplates';
import { IConnectionTemplateOfExpandedEntity } from '../pages/Entity';
import { getFullRelationshipTemplates } from './templates';

//TODO: delete or use - not used
// export const getDepthRelationships = (data: IEntityExpanded, expandedEntity: IEntityExpanded, allRelationshipTemplates: IRelationshipTemplateMap) => {
//     const relationshipInstances = data?.connections.filter(
//         (connection) =>
//             !expandedEntity.connections.some(
//                 (currentConnection) => currentConnection.relationship.properties._id === connection.relationship.properties._id,
//             ),
//     ); // new relationships from expend level

//     const relationshipTemplatesIds = relationshipInstances.reduce((set, conn) => {
//         set.add(conn.relationship.templateId);
//         return set;
//     }, new Set<string>());

//     const relationshipTemplates = Array.from(relationshipTemplatesIds).map(
//         (childRelationshipTemplateId) => allRelationshipTemplates.get(childRelationshipTemplateId)!,
//     );

//     return { relationshipTemplates, relationshipInstances };
// };

export const sortTemplatesChildrenToParents = (
    expansionDepth: number,
    options: IConnectionTemplateOfExpandedEntity[],
    data: IEntityExpanded,
    relationshipTemplates: IRelationshipTemplateMap,
    entityTemplates: IEntityTemplateMap,
) => {
    console.log({ expansionDepth, options });

    return options.map((parent) => {
        const currentEntityTemplate = parent.isExpandedEntityRelationshipSource
            ? parent.relationshipTemplate.destinationEntity
            : parent.relationshipTemplate.sourceEntity;

        const children = getFullRelationshipTemplates(
            relationshipTemplates,
            entityTemplates,
            currentEntityTemplate,
            parent.relationshipTemplate,
            data,
            true,
        ).filter((child) => child.relationshipTemplate._id !== parent.relationshipTemplate._id);

        return {
            ...parent,
            children,
        };
    });
};

// export const sortTemplatesChildrenToParents = (
//     depth: number,
//     parents: IConnectionTemplateOfExpandedEntity[],
//     data: IEntityExpanded,
//     relationshipTemplates: IRelationshipTemplateMap,
//     entityTemplates: IEntityTemplateMap,
// ): IConnectionTemplateOfExpandedEntity[] => {
//     return parents.map((parent) => {
//         const currentEntityTemplate = parent.isExpandedEntityRelationshipSource
//             ? parent.relationshipTemplate.destinationEntity
//             : parent.relationshipTemplate.sourceEntity;

//         const children = getFullRelationshipTemplates(
//             relationshipTemplates,
//             entityTemplates,
//             currentEntityTemplate,
//             parent.relationshipTemplate,
//             data,
//             true,
//         ).filter((child) => child.relationshipTemplate._id !== parent.relationshipTemplate._id);

//         const nestedChildren = depth < 4 ? sortTemplatesChildrenToParents(depth + 1, children, data, relationshipTemplates, entityTemplates) : [];

//         return {
//             ...parent,
//             children: nestedChildren,
//         };
//     });
// };
