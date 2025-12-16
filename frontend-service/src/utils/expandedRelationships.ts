import { IEntityExpanded, IEntityTemplateMap, IRelationshipTemplateMap } from '@microservices/shared';
import { environment } from '../globals';
import { INestedRelationshipTemplates } from '../pages/Entity';
import { getFullRelationshipTemplates } from './templates';

const { maxPrintLevel } = environment;

export const sortTemplatesChildrenToParents = (
    depth: number,
    parents: INestedRelationshipTemplates[],
    data: IEntityExpanded,
    relationshipTemplates: IRelationshipTemplateMap,
    entityTemplates: IEntityTemplateMap,
): INestedRelationshipTemplates[] => {
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
            {},
            true,
        );

        const nestedChildren =
            depth < maxPrintLevel && children.length > 0
                ? sortTemplatesChildrenToParents(depth + 1, children, data, relationshipTemplates, entityTemplates)
                : [];

        return {
            ...parent,
            children: nestedChildren,
        };
    });
};

export const updateChildrenToParent = (depth: number, parents: INestedRelationshipTemplates[], updatedParent: INestedRelationshipTemplates) => {
    return parents.map((parent) => {
        const isMatchingParent = updatedParent.relationshipTemplate._id === parent.relationshipTemplate._id;

        const updatedChildren = isMatchingParent
            ? updatedParent.children
            : depth < maxPrintLevel && parent.children?.length
              ? updateChildrenToParent(depth + 1, parent.children, updatedParent)
              : parent.children;

        return {
            ...parent,
            children: updatedChildren,
        };
    });
};

const mergeChildren = (
    existingChildren: INestedRelationshipTemplates[],
    newChildren: INestedRelationshipTemplates[],
): INestedRelationshipTemplates[] => {
    const merged: INestedRelationshipTemplates[] = [...existingChildren];

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

export const mergeAncestryTree = (nodes: INestedRelationshipTemplates[], newNode: INestedRelationshipTemplates): INestedRelationshipTemplates[] => {
    const index = nodes.findIndex((node) => node.relationshipTemplate._id === newNode.relationshipTemplate._id);

    if (index === -1) {
        return [...nodes, newNode];
    }

    const existing = nodes[index];

    const updated = {
        ...existing,
        children: mergeChildren(existing.children ?? [], newNode.children ?? []),
    };

    return [...nodes.slice(0, index), updated, ...nodes.slice(index + 1)];
};

export const findAncestryTree = (nodes: INestedRelationshipTemplates[], id: string): INestedRelationshipTemplates | undefined => {
    const targetId = id.split('-')[1];

    for (const node of nodes) {
        if (!node.children) continue;

        for (const child of node.children) {
            if (child.relationshipTemplate._id === targetId) {
                return {
                    ...node,
                    children: [child],
                };
            }

            if (findAncestryTree([child], id)) {
                return {
                    ...node,
                    children: [findAncestryTree([child], id)!],
                };
            }
        }
    }

    return undefined;
};
