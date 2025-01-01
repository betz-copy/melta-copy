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

    const getItemDescendantsIds = (item: TreeType<T>) => {
        const ids: string[] = [];

        item?.children?.forEach((child) => {
            ids.push(getItemId(child));
            ids.push(...getItemDescendantsIds(child));
        });

        return ids;
    };

    const handleSelectedItemsChange = (newSelectedItemsPaths: string[], multi: boolean, toggledItem: Record<string, boolean>, apiRef: any) => {
        if (!multi || !parentInfersChildren) {
            setSelectedItemsIds([newSelectedItemsPaths?.[0]]);
            return;
        }

        const itemsToSelect: string[] = [];
        const itemsToUnSelect: { [itemId: string]: boolean } = {};

        Object.entries(toggledItem).forEach(([itemId, isSelected]) => {
            const item = apiRef.getItem(itemId);

            if (isSelected) {
                itemsToSelect.push(...getItemDescendantsIds(item));
            } else {
                getItemDescendantsIds(item).forEach((descendantId) => {
                    itemsToUnSelect[descendantId] = true;
                });
            }
        });

        const newSelectedItemsWithChildren = Array.from(
            new Set([...newSelectedItemsPaths, ...itemsToSelect].filter((itemId) => !itemsToUnSelect[itemId])),
        );

        selectParentIfAllChildrenAreSelected(treeItems, newSelectedItemsWithChildren, getItemId);

        setSelectedItemsIds(newSelectedItemsWithChildren);
    };

    const getSelectedLeafIds = (currentTreeItems = treeItems, leaves: TreeType<T>[] = []): TreeType<T>[] => {
        currentTreeItems.forEach((item) => {
            if (!item.children) {
                const id = getItemId(item);
                if (selectedItemsIds.includes(id)) leaves.push(id);
            } else {
                getSelectedLeafIds(item.children).forEach((leaf) => leaves.push(leaf));
            }
        });

        return leaves;
    };

    return { handleSelectedItemsChange, selectedItemsIds, selectParentIfAllChildrenAreSelected, setSelectedItemsIds, getSelectedLeafIds };
};
