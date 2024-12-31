import { TreeViewBaseItem } from '@mui/x-tree-view-pro';
import { useState } from 'react';

function selectParentIfAllChildrenAreSelected(treeItems, newSelectedItemsWithChildren, getItemId) {
    treeItems.forEach((item) => {
        if (item?.children) {
            selectParentIfAllChildrenAreSelected(item.children, newSelectedItemsWithChildren, getItemId);

            const allChildrenSelected = item.children.every((child) => newSelectedItemsWithChildren.includes(getItemId(child)));
            if (allChildrenSelected) {
                newSelectedItemsWithChildren.push(getItemId(item));
            } else {
                const parentIndex = newSelectedItemsWithChildren.findIndex((id) => id === getItemId(item));

                if (parentIndex > -1) {
                    newSelectedItemsWithChildren.splice(parentIndex, 1);
                }
            }
        }
    });

    return newSelectedItemsWithChildren;
}

export const useTreeUtils = (getItemId: (item) => string, isParentsSelectable?: boolean, preSelectedItemsIds: string[] = [], treeItems = []) => {
    const [selectedItemsIds, setSelectedItemsIds] = useState<string[]>(
        isParentsSelectable ? preSelectedItemsIds ?? [] : selectParentIfAllChildrenAreSelected(treeItems, preSelectedItemsIds ?? [], getItemId),
    );

    const getItemDescendantsIds = (item: TreeViewBaseItem) => {
        const ids: string[] = [];

        item?.children?.forEach((child) => {
            ids.push(getItemId(child));
            ids.push(...getItemDescendantsIds(child));
        });

        return ids;
    };

    const handleSelectedItemsChange = (newSelectedItemsPaths: string[], multi: boolean, toggledItem: Record<string, boolean>, apiRef: any) => {
        if (!multi) {
            setSelectedItemsIds([newSelectedItemsPaths?.[0]]);
            return;
        }

        setSelectedItemsIds(newSelectedItemsPaths);

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

        if (!isParentsSelectable) selectParentIfAllChildrenAreSelected(treeItems, newSelectedItemsWithChildren, getItemId);

        setSelectedItemsIds(newSelectedItemsWithChildren);
    };

    return { handleSelectedItemsChange, selectedItemsIds, selectParentIfAllChildrenAreSelected };
};
