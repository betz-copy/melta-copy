import { TreeViewBaseItem } from '@mui/x-tree-view-pro';
import { useState } from 'react';

export const useTreeUtils = (getItemId: (item) => string, preSelectedItemsIds?: string[]) => {
    const [selectedItemsIds, setSelectedItemsIds] = useState<string[]>(preSelectedItemsIds ?? []);

    // Select functions
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
            const item = (apiRef.current as any)!.getItem(itemId);

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

        setSelectedItemsIds(newSelectedItemsWithChildren);
    };

    return { handleSelectedItemsChange, selectedItemsIds };
};
