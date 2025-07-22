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
    return options.map((parent) => {
        const currentEntityTemplate = parent.isExpandedEntityRelationshipSource
            ? parent.relationshipTemplate.destinationEntity
            : parent.relationshipTemplate.sourceEntity;

        const children = getFullRelationshipTemplates(
            relationshipTemplates,
            entityTemplates,
            currentEntityTemplate,
            expansionDepth,
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

export const getNodesAtDepth = (
    nodes: IConnectionTemplateOfExpandedEntity[],
    targetDepth: number,
    currentDepth = 1,
): IConnectionTemplateOfExpandedEntity[] => {
    let result: IConnectionTemplateOfExpandedEntity[] = [];

    for (const node of nodes) {
        if (currentDepth === targetDepth) {
            result.push(node);
        }

        if (node.children && node.children.length > 0) {
            result = result.concat(getNodesAtDepth(node.children, targetDepth, currentDepth + 1));
        }
    }

    return result;
};

export const sortTemplatesChildrenToParents2 = (
    depth: number,
    parents: IConnectionTemplateOfExpandedEntity[],
    data: IEntityExpanded,
    relationshipTemplates: IRelationshipTemplateMap,
    entityTemplates: IEntityTemplateMap,
): IConnectionTemplateOfExpandedEntity[] => {
    return parents.map((parent) => {
        const currentEntityTemplate = parent.isExpandedEntityRelationshipSource
            ? parent.relationshipTemplate.destinationEntity
            : parent.relationshipTemplate.sourceEntity;

        const children = getFullRelationshipTemplates(
            relationshipTemplates,
            entityTemplates,
            currentEntityTemplate,
            depth,
            parent.relationshipTemplate,
            data,
            true,
        ).filter((child) => child.relationshipTemplate._id !== parent.relationshipTemplate._id);

        const nestedChildren =
            depth < 5 && children.length > 0
                ? sortTemplatesChildrenToParents2(depth + 1, children, data, relationshipTemplates, entityTemplates)
                : [];

        return {
            ...parent,
            children: nestedChildren,
        };
    });
};

export const updateChildrenToParent = (
    depth: number,
    parents: IConnectionTemplateOfExpandedEntity[],
    updatedParent: IConnectionTemplateOfExpandedEntity,
    relationshipTemplates: IRelationshipTemplateMap,
    entityTemplates: IEntityTemplateMap,
) => {
    return parents.map((parent) => {
        const isMatchingParent = updatedParent.relationshipTemplate._id === parent.relationshipTemplate._id;
        console.log({ isMatchingParent });

        const updatedChildren = isMatchingParent
            ? updatedParent.children
            : depth < 5 && parent.children?.length
            ? updateChildrenToParent(depth + 1, parent.children, updatedParent, relationshipTemplates, entityTemplates)
            : parent.children;

        console.log({ updatedChildren });

        return {
            ...parent,
            children: updatedChildren,
        };
    });
};
