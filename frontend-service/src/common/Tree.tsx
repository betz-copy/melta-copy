import React, { useEffect, useRef, useState } from 'react';
import { RichTreeViewPro, useTreeViewApiRef } from '@mui/x-tree-view-pro';
import { ChevronLeft, ExpandLess } from '@mui/icons-material';
import { TreeType } from '../interfaces/Tree';
import { useTreeUtils } from '../utils/hooks/useTreeUtils';

interface TreeProps<T> {
    treeItems: TreeType<T>[];
    getItemId: (item: T) => string;
    getItemLabel: (item: T) => string;
    multi: boolean;
    onSelectItems?: (item: string | string[]) => any;
    isDraggable?: boolean;
    allowDraggingBetweenParents?: boolean;
    preSelectedItemsIds?: string[];
    preExpandedItemIds?: string[];

    // If parents is selectable than they are not simply representing the state of their children.
    isParentsSelectable?: boolean;
}

const Tree = <T,>({
    treeItems,
    onSelectItems,
    getItemId,
    getItemLabel,
    multi,
    preSelectedItemsIds,
    preExpandedItemIds,
    isDraggable,
    allowDraggingBetweenParents,
    isParentsSelectable = false,
}: TreeProps<T>): React.ReactElement => {
    const { handleSelectedItemsChange, selectedItemsIds } = useTreeUtils(getItemId, isParentsSelectable, preSelectedItemsIds, treeItems);

    const [expandedItemsIds, setExpandedItemsIds] = useState<string[]>(preExpandedItemIds ?? []);

    const toggledItemRef = useRef<{ [itemId: string]: boolean }>({});

    const apiRef = useTreeViewApiRef();

    useEffect(() => {
        if (!onSelectItems || selectedItemsIds.toString() === preSelectedItemsIds?.toString()) return;
        onSelectItems(multi ? selectedItemsIds : selectedItemsIds?.[0]);
    }, [JSON.stringify(selectedItemsIds)]);

    return (
        <RichTreeViewPro
            style={{ direction: 'rtl' }}
            checkboxSelection
            multiSelect
            items={treeItems}
            getItemId={getItemId}
            getItemLabel={getItemLabel}
            apiRef={apiRef}
            selectedItems={selectedItemsIds}
            onSelectedItemsChange={(_event, itemIds) => {
                handleSelectedItemsChange(itemIds, multi, toggledItemRef.current, apiRef.current);
                toggledItemRef.current = {};
            }}
            onItemSelectionToggle={(_event: React.SyntheticEvent, itemId: string, isSelected: boolean) => {
                toggledItemRef.current[itemId] = isSelected;
            }}
            onExpandedItemsChange={(_event: React.SyntheticEvent, itemIds: string[]) => {
                setExpandedItemsIds(itemIds);
            }}
            expandedItems={expandedItemsIds}
            itemsReordering={isDraggable}
            slots={{
                expandIcon: ChevronLeft,
                collapseIcon: ExpandLess,
            }}
            experimentalFeatures={{ indentationAtItemLevel: true, itemsReordering: true }}
            canMoveItemToNewPosition={(params) => allowDraggingBetweenParents || params.oldPosition.parentId === params.newPosition.parentId}
        />
    );
};
export default Tree;
