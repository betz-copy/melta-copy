// Most of the code here is taken from:
// https://johnnyreilly.com/mui-react-tree-view-check-children-uncheck-parents

import { useState } from 'react';
import { TreeViewBaseItem } from '@mui/x-tree-view-pro';
import { IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import { IMongoCategory } from '../../interfaces/categories';

const initialSelectParentIfAllChildrenAreSelected = <T extends {}>(
    treeItems: TreeViewBaseItem<T>[],
    getItemId: (item: T) => string,
    selectedItemsIds?: string[],
): string[] => {
    if (!selectedItemsIds?.length) return [];

    // Create a Set for faster lookups and add existing selected items
    const updatedSet = new Set(selectedItemsIds);

    const markParentIfAllChildrenSelected = (item: TreeViewBaseItem<T>) => {
        if (item?.children) {
            // Recursively process child items first
            item.children.forEach((child) => markParentIfAllChildrenSelected(child));

            const allChildrenSelected = item.children.every((child) => updatedSet.has(getItemId(child)));
            const itemId = getItemId(item);

            if (allChildrenSelected && !updatedSet.has(itemId)) {
                updatedSet.add(itemId);
            } else if (!allChildrenSelected) {
                updatedSet.delete(itemId);
            }
        }
    };

    // Process the tree items
    treeItems.forEach(markParentIfAllChildrenSelected);

    // Convert the Set back to an array before returning
    return Array.from(updatedSet);
};

export const formatTemplates = (
    categories: IMongoCategory[],
    templates: IMongoEntityTemplatePopulated[],
    getItemId: (item: IMongoCategory | IMongoEntityTemplatePopulated) => string,
): TreeViewBaseItem<IMongoCategory | IMongoEntityTemplatePopulated>[] => {
    const templatesByCategory: Record<string, IMongoEntityTemplatePopulated[]> = {};

    templates.forEach((template) => {
        const categoryId = getItemId(template.category);

        if (!templatesByCategory[categoryId]) {
            templatesByCategory[categoryId] = [];
        }

        templatesByCategory[categoryId].push(template);
    });

    return Object.entries(templatesByCategory).map(([categoryId, currTemplates]) => {
        const category = categories.find((currCategory) => getItemId(currCategory) === categoryId)!;

        return {
            ...category,
            children: currTemplates,
        };
    });
};

export const flattenTree = <T extends {}>(treeItems: TreeViewBaseItem<T>[], getItemId: (item: T) => string, revertedTemplates: any[] = []): any[] => {
    treeItems.forEach((categoryWithTemplates) => {
        const { children, ...rest } = categoryWithTemplates;

        if (children) {
            flattenTree(children, getItemId, revertedTemplates);
        }

        revertedTemplates.push(rest);
    });

    return revertedTemplates;
};

export const useTreeUtils = <T extends {}>(getItemId: (item: T) => string, parentInfersChildren?: boolean, treeItems: TreeViewBaseItem<T>[] = []) => {
    const [selectedItemsIds, setSelectedItemsIds] = useState<string[]>([]);

    const getParentNode = (items: TreeViewBaseItem<T>[], id: string): TreeViewBaseItem<T> | undefined => {
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
    };

    const getAllParentIds = (items: TreeViewBaseItem<T>[], id: string) => {
        const parentIds: string[] = [];
        let parent = getParentNode(items, id);

        while (parent) {
            parentIds.push(getItemId(parent));
            parent = getParentNode(items, getItemId(parent));
        }
        return parentIds;
    };

    const getSelectedIdsAndChildrenIds = (items: TreeViewBaseItem<T>[], selectedIds: string[]) => {
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
    };

    const handleSelectedItemsChange = (newIds: string[], multi: boolean): string[] => {
        if (!multi) {
            return [newIds?.[0]];
        }

        if (!parentInfersChildren) {
            return newIds;
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
    };

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

    return {
        handleSelectedItemsChange,
        selectedItemsIds,
        setSelectedItemsIds,
        selectParentIfAllChildrenAreSelected: initialSelectParentIfAllChildrenAreSelected,
        getSelectedLeafIds,
    };
};
