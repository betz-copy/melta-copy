// Most of the code here is taken from:
// https://johnnyreilly.com/mui-react-tree-view-check-children-uncheck-parents

import { useState } from 'react';
import { cloneDeep } from 'lodash';
import { TreeType } from '../../interfaces/Tree';

function selectParentIfAllChildrenAreSelected<T>(treeItems: TreeType<T>[], newSelectedItemsWithChildren, getItemId: (item: T) => string) {
    const updatedArray = cloneDeep(newSelectedItemsWithChildren);

    treeItems.forEach((item) => {
        if (item?.children) {
            selectParentIfAllChildrenAreSelected(item.children, updatedArray, getItemId);

            const allChildrenSelected = item.children.every((child) => updatedArray.includes(getItemId(child)));
            if (allChildrenSelected) {
                updatedArray.push(getItemId(item));
            } else {
                const parentIndex = updatedArray.findIndex((id) => id === getItemId(item));

                if (parentIndex > -1) {
                    updatedArray.splice(parentIndex, 1);
                }
            }
        }
    });

    return updatedArray;
}

export const flattenTree = <T,>(treeItems: TreeType<T>[], getItemId: (item: T) => string, revertedTemplates: any[] = []): any[] => {
    treeItems.forEach((categoryWithTemplates) => {
        const { children, ...rest } = categoryWithTemplates;

        if (children) {
            flattenTree(children, getItemId, revertedTemplates);
        }

        revertedTemplates.push(rest);
    });

    return revertedTemplates;
};

export const useTreeUtils = <T,>(
    getItemId: (item: T) => string,
    parentInfersChildren?: boolean,
    preSelectedItemsIds: string[] = [],
    treeItems: TreeType<T>[] = [],
) => {
    const [selectedItemsIds, setSelectedItemsIds] = useState<string[]>(
        parentInfersChildren ? selectParentIfAllChildrenAreSelected(treeItems, preSelectedItemsIds, getItemId) : preSelectedItemsIds,
    );

    function getParentNode(items: TreeType<T>[], id: string): TreeType<T> | undefined {
        for (const item of items) {
            if (item.children) {
                if (item.children.some((child) => getItemId(child) === id)) {
                    // The current item is the parent of the supplied id
                    return item;
                }
                // Recursively call the function for the children of the current item
                const parentNode = getParentNode(item.children, id);
                if (parentNode) {
                    return parentNode;
                }
            }
        }

        // No parent found
        return undefined;
    }

    function getAllParentIds(items: TreeType<T>[], id: string) {
        const parentIds: string[] = [];
        let parent = getParentNode(items, id);
        while (parent) {
            parentIds.push(getItemId(parent));
            parent = getParentNode(items, getItemId(parent));
        }
        return parentIds;
    }

    function getSelectedIdsAndChildrenIds(items: TreeType<T>[], selectedIds: string[]) {
        const selectedIdIncludingChildrenIds = new Set([...selectedIds]);

        for (const item of items) {
            if (selectedIds.includes(getItemId(item))) {
                // Add the current item's id to the result array
                selectedIdIncludingChildrenIds.add(getItemId(item));

                // Recursively call the function for the children of the current item
                if (item.children) {
                    const childrenIds = item.children.map((child) => getItemId(child));
                    const childrenSelectedIds = getSelectedIdsAndChildrenIds(item.children, childrenIds);
                    childrenSelectedIds.forEach((selectedId) => selectedIdIncludingChildrenIds.add(selectedId));
                }
            } else if (item.children) {
                // walk the children to see if selections lay in there also
                const childrenSelectedIds = getSelectedIdsAndChildrenIds(item.children, selectedIds);
                childrenSelectedIds.forEach((selectedId) => selectedIdIncludingChildrenIds.add(selectedId));
            }
        }

        return [...Array.from(selectedIdIncludingChildrenIds)];
    }

    function handleSelectedItemsChange(newIds: string[], multi: boolean): string[] {
        if (!multi || !parentInfersChildren) {
            return [newIds?.[0]];
        }

        const isDeselectingNode = selectedItemsIds.length > newIds.length;
        if (isDeselectingNode) {
            const removed = selectedItemsIds.filter((id) => !newIds.includes(id))[0];

            const parentIdsToRemove = getAllParentIds(treeItems, removed);

            const childIdsToRemove = getSelectedIdsAndChildrenIds(treeItems, [removed]);

            const newIdsWithParentsAndChildrenRemoved = newIds.filter((id) => !parentIdsToRemove.includes(id) && !childIdsToRemove.includes(id));

            return newIdsWithParentsAndChildrenRemoved;
        }

        const added = newIds.filter((id) => !selectedItemsIds.includes(id))[0];
        const idsToSet = getSelectedIdsAndChildrenIds(treeItems, newIds);
        let parent = getParentNode(treeItems, added);
        while (parent) {
            const childIds = parent.children?.map((node) => getItemId(node)) ?? [];
            const allChildrenSelected = childIds.every((id) => idsToSet.includes(id));
            if (allChildrenSelected) {
                idsToSet.push(getItemId(parent));
                parent = getParentNode(treeItems, getItemId(parent));
            } else {
                break;
            }
        }
        return idsToSet;
    }

    const getSelectedLeafIds = (currentTreeItems = treeItems, leaves: string[] = []): string[] => {
        currentTreeItems.forEach((item) => {
            if (!item.children) {
                const id = getItemId(item);
                if (selectedItemsIds.includes(id)) leaves.push(id);
            } else {
                getSelectedLeafIds(item.children).forEach((leaf) => {
                    leaves.push(leaf);
                });
            }
        });

        return leaves;
    };

    return { handleSelectedItemsChange, selectedItemsIds, selectParentIfAllChildrenAreSelected, setSelectedItemsIds, getSelectedLeafIds };
};
