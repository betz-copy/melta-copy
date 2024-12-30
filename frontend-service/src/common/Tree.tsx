import React, { useEffect, useRef, useState } from 'react';
import { RichTreeView, TreeViewBaseItem, useTreeViewApiRef } from '@mui/x-tree-view';
import { ChevronLeft, ExpandLess } from '@mui/icons-material';
import { TreeType } from '../interfaces/Tree';

interface TreeProps<T> {
    treeItems: TreeType<T>[];
    getItemId: (item: T) => string;
    getItemLabel: (item: T) => string;
    multi: boolean;
    onSelectItems?: (item: string | string[]) => any;
    isDraggable?: boolean; // TODO
    preSelectedItemsIds?: string[];
    preExpandedItemIds?: string[];
}

function getItemDescendantsIds<T>(item: TreeViewBaseItem, getItemId: (item: T) => string) {
    const ids: string[] = [];

    item?.children?.forEach((child) => {
        ids.push(getItemId(child as T));
        ids.push(...getItemDescendantsIds<T>(child, getItemId));
    });

    return ids;
}

const Tree = <T,>({
    treeItems,
    onSelectItems,
    getItemId,
    getItemLabel,
    multi,
    preSelectedItemsIds,
    preExpandedItemIds,
}: TreeProps<T>): React.ReactElement => {
    const [selectedItemsIds, setSelectedItemsIds] = useState<string[]>(preSelectedItemsIds ?? []);
    const [expandedItemsIds, setExpandedItemsIds] = useState<string[]>(preExpandedItemIds ?? []);

    const toggledItemRef = useRef<{ [itemId: string]: boolean }>({});

    const apiRef = useTreeViewApiRef();

    const handleItemSelectionToggle = (_event: React.SyntheticEvent, itemId: string, isSelected: boolean) => {
        toggledItemRef.current[itemId] = isSelected;
    };

    const handleSelectedItemsChange = (_event: React.SyntheticEvent, newSelectedItemsPaths: string[]) => {
        if (!multi) {
            setSelectedItemsIds([newSelectedItemsPaths?.[0]]);
            return;
        }

        setSelectedItemsIds(newSelectedItemsPaths);

        const itemsToSelect: string[] = [];
        const itemsToUnSelect: { [itemId: string]: boolean } = {};

        Object.entries(toggledItemRef.current).forEach(([itemId, isSelected]) => {
            const item = (apiRef.current as any)!.getItem(itemId);

            if (isSelected) {
                itemsToSelect.push(...getItemDescendantsIds(item, getItemId));
            } else {
                getItemDescendantsIds(item, getItemId).forEach((descendantId) => {
                    itemsToUnSelect[descendantId] = true;
                });
            }
        });

        const newSelectedItemsWithChildren = Array.from(
            new Set([...newSelectedItemsPaths, ...itemsToSelect].filter((itemId) => !itemsToUnSelect[itemId])),
        );

        setSelectedItemsIds(newSelectedItemsWithChildren);

        toggledItemRef.current = {};
    };

    const handleExpandClick = (_event: React.SyntheticEvent, itemIds: string[]) => {
        setExpandedItemsIds(itemIds);
    };

    useEffect(() => {
        if (!onSelectItems || selectedItemsIds.toString() === preSelectedItemsIds?.toString()) return;
        onSelectItems(multi ? selectedItemsIds : selectedItemsIds?.[0]);
    }, [JSON.stringify(selectedItemsIds)]);

    return (
        <RichTreeView
            style={{ direction: 'rtl' }}
            checkboxSelection
            multiSelect
            items={treeItems}
            getItemId={getItemId}
            getItemLabel={getItemLabel}
            apiRef={apiRef}
            selectedItems={selectedItemsIds}
            onSelectedItemsChange={handleSelectedItemsChange}
            onItemSelectionToggle={handleItemSelectionToggle}
            expandedItems={expandedItemsIds}
            onExpandedItemsChange={handleExpandClick}
            slots={{
                expandIcon: ChevronLeft,
                collapseIcon: ExpandLess,
            }}
        />
    );
};
export default Tree;
