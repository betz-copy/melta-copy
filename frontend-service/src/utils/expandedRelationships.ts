import { IEntityExpanded } from '../interfaces/entities';
import { IEntityTemplateMap } from '../interfaces/entityTemplates';
import { IRelationshipTemplateMap } from '../interfaces/relationshipTemplates';
import { IConnectionTemplateOfExpandedEntity } from '../pages/Entity';
import { getFullRelationshipTemplates } from './templates';

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
) => {
    return parents.map((parent) => {
        const isMatchingParent = updatedParent.relationshipTemplate._id === parent.relationshipTemplate._id;

        const updatedChildren = isMatchingParent
            ? updatedParent.children
            : depth < 5 && parent.children?.length
            ? updateChildrenToParent(depth + 1, parent.children, updatedParent)
            : parent.children;

        return {
            ...parent,
            children: updatedChildren,
        };
    });
};

const mergeChildren = (
    existingChildren: IConnectionTemplateOfExpandedEntity[],
    newChildren: IConnectionTemplateOfExpandedEntity[],
): IConnectionTemplateOfExpandedEntity[] => {
    const merged: IConnectionTemplateOfExpandedEntity[] = [...existingChildren];

    for (const newChild of newChildren) {
        const matchIndex = existingChildren.findIndex((c) => c.relationshipTemplate._id === newChild.relationshipTemplate._id);

        if (matchIndex === -1) {
            merged.push(newChild);
        } else {
            merged[matchIndex] = {
                ...existingChildren[matchIndex],
                children: mergeChildren(existingChildren[matchIndex].children ?? [], newChild.children ?? []),
            };
        }
    }

    return merged;
};

export const mergeAncestryTree = (
    nodes: IConnectionTemplateOfExpandedEntity[],
    newNode: IConnectionTemplateOfExpandedEntity,
): IConnectionTemplateOfExpandedEntity[] => {
    const index = nodes.findIndex((node) => node.relationshipTemplate._id === newNode.relationshipTemplate._id);

    if (index === -1) {
        // If the node doesn't exist, add it
        return [...nodes, newNode];
    }

    const existing = nodes[index];

    const mergedChildren = mergeChildren(existing.children ?? [], newNode.children ?? []);

    const updated = {
        ...existing,
        children: mergedChildren,
    };

    return [...nodes.slice(0, index), updated, ...nodes.slice(index + 1)];
};

export const findAncestryTree = (nodes: IConnectionTemplateOfExpandedEntity[], id: string): IConnectionTemplateOfExpandedEntity | undefined => {
    const targetId = id.split('-')[1];

    for (const node of nodes) {
        if (node.children) {
            for (const child of node.children) {
                if (child.relationshipTemplate._id === targetId) {
                    return {
                        ...node,
                        children: [child],
                    };
                }

                const found = findAncestryTree([child], id);

                if (found) {
                    return {
                        ...node,
                        children: [found],
                    };
                }
            }
        }
    }

    return undefined;
};
