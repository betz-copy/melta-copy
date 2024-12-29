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
    isDraggable?: boolean;
}

function getItemDescendantsIds<T>(item: TreeViewBaseItem, getItemId: (item: T) => string) {
    const ids: string[] = [];

    item?.children?.forEach((child) => {
        ids.push(getItemId(child as T));
        ids.push(...getItemDescendantsIds<T>(child, getItemId));
    });

    return ids;
}

const Tree = <T,>({ treeItems, onSelectItems, getItemId, getItemLabel, multi }: TreeProps<T>): React.ReactElement => {
    const [selectedItems, setSelectedItems] = useState<string[]>([]);
    const toggledItemRef = useRef<{ [itemId: string]: boolean }>({});
    const apiRef = useTreeViewApiRef();

    const handleItemSelectionToggle = (_event: React.SyntheticEvent, itemId: string, isSelected: boolean) => {
        toggledItemRef.current[itemId] = isSelected;
    };

    const handleSelectedItemsChange = (_event: React.SyntheticEvent, newSelectedItemsPaths: string[]) => {
        if (!multi) {
            setSelectedItems([newSelectedItemsPaths[0]]);
            return;
        }

        setSelectedItems(newSelectedItemsPaths);

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

        setSelectedItems(newSelectedItemsWithChildren);

        toggledItemRef.current = {};
    };

    useEffect(() => {
        if (!onSelectItems) return;

        onSelectItems(multi ? selectedItems : selectedItems[0]);
    }, [JSON.stringify(selectedItems)]);

    return (
        <RichTreeView
            style={{ direction: 'rtl' }}
            checkboxSelection
            multiSelect
            items={treeItems}
            getItemId={getItemId}
            getItemLabel={getItemLabel}
            apiRef={apiRef}
            selectedItems={selectedItems}
            onSelectedItemsChange={handleSelectedItemsChange}
            onItemSelectionToggle={handleItemSelectionToggle}
            slots={{
                expandIcon: ChevronLeft,
                collapseIcon: ExpandLess,
            }}
        />
    );
};
export default Tree;
