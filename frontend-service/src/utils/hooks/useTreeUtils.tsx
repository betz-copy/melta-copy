import { useState } from 'react';
import { TreeType } from '../../interfaces/Tree';

function selectParentIfAllChildrenAreSelected<T>(treeItems: TreeType<T>[], newSelectedItemsWithChildren, getItemId) {
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

export const flattenTree = (options: any[]) => {
    const revertedTemplates: any[] = [];

    options.forEach((categoryWithTemplates) => {
        const { children, ...category } = categoryWithTemplates;

        children.forEach((template) => {
            revertedTemplates.push({
                ...template,
                category: {
                    _id: category._id,
                    // You can add other properties of the category here if needed
                    ...category,
                },
            });
        });
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

        selectParentIfAllChildrenAreSelected(treeItems, newSelectedItemsWithChildren, getItemId);

        setSelectedItemsIds(newSelectedItemsWithChildren);
    };

    return { handleSelectedItemsChange, selectedItemsIds, selectParentIfAllChildrenAreSelected };
};
