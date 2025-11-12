import { ChevronLeft, ExpandLess } from '@mui/icons-material';
import { Box, Divider } from '@mui/material';
import { RichTreeViewPro, RichTreeViewProProps, TreeItemProps, TreeViewBaseItem, useTreeViewApiRef } from '@mui/x-tree-view-pro';
import { TreeViewItemReorderPosition } from '@mui/x-tree-view-pro/internals/plugins/useTreeViewItemsReordering';
import _ from 'lodash';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { SelectAll } from './SelectAll';
import TreeItem from './TreeItem';

interface TreeProps<T extends {}> extends Omit<RichTreeViewProProps<T, true>, 'onDragEnd' | 'items'> {
    // All of the treeItems that the tree has.
    treeItems: TreeViewBaseItem<T>[];
    getItemId: (item: T) => string;
    getItemLabel: (item: T) => string;
    // Display a selectAll checkbox
    selectAll?: boolean;
    onSelectItems?: (itemIds: string | string[]) => void;
    isDraggable?: boolean;
    allowMultiSelect?: boolean;
    allowDraggingBetweenParents?: boolean;
    preSelectedItemsIds?: string[];
    preExpandedItemIds?: string[];
    // Tree Items that should be displayed out of all of the tree items.
    // For example when a searchbar is present use this.
    filteredTreeItems?: T[];
    isSelectable?: boolean;
    dragAllowNewRoot?: boolean;
    onDragEnd?: (params: { itemId: string; oldPosition: TreeViewItemReorderPosition; newPosition: TreeViewItemReorderPosition }) => void;
    removeDivider?: boolean;
    showIcon?: boolean;
}

export const flattenTree = <T extends {}>(
    treeItems: TreeViewBaseItem<T>[],
    getItemId: (item: TreeViewBaseItem<T>) => string,
    shouldCountParents: boolean,
    revertedTemplates: TreeViewBaseItem<T>[] = [],
): TreeViewBaseItem<T>[] => {
    treeItems.forEach((treeItem) => {
        if (treeItem.children?.length) {
            flattenTree(treeItem.children, getItemId, shouldCountParents, revertedTemplates);

            if (shouldCountParents) revertedTemplates.push(treeItem);
        } else revertedTemplates.push(treeItem);
    });

    return revertedTemplates;
};

const Tree = <T extends {}>({
    treeItems,
    onSelectItems,
    getItemId,
    getItemLabel,
    preSelectedItemsIds,
    preExpandedItemIds,
    allowDraggingBetweenParents = true,
    isSelectable = true,
    allowMultiSelect = true,
    isDraggable = false,
    dragAllowNewRoot = true,
    onDragEnd,
    removeDivider,
    selectAll,
    showIcon,
    filteredTreeItems = treeItems,
    onClick,
    onKeyUp,
    selectionPropagation = { descendants: true, parents: true }, // In order to auto select children
    ...restOfProps
}: TreeProps<T>): React.ReactElement => {
    const [expandedItemsIds, setExpandedItemsIds] = useState<string[]>(preExpandedItemIds ?? []);
    const [selectedItemIds, setSelectedItemIds] = useState<string[]>(preSelectedItemsIds ?? []);

    const apiRef = useTreeViewApiRef();

    const memoizedTreeItem = useCallback(
        (props: TreeItemProps) => <TreeItem {...props} removeDivider={removeDivider} showIcon={showIcon} />,
        [showIcon, removeDivider],
    );

    const flattenTreeIds = useMemo(
        () => flattenTree(treeItems, getItemId, !selectionPropagation.parents).map(getItemId),
        [getItemId, treeItems, selectionPropagation],
    );

    useEffect(() => {
        onSelectItems?.(selectedItemIds);
    }, [selectedItemIds, onSelectItems]);

    useEffect(() => {
        setExpandedItemsIds(preExpandedItemIds ?? []);
    }, [preExpandedItemIds]);

    useEffect(() => {
        if (!_.isEqual(preSelectedItemsIds, selectedItemIds)) setSelectedItemIds(preSelectedItemsIds ?? []);
    }, [preSelectedItemsIds, selectedItemIds]);

    return (
        <>
            {selectAll && (
                <>
                    <SelectAll allOptionIds={flattenTreeIds} setSelectedOptionIds={setSelectedItemIds} selectedOptionIds={selectedItemIds} />
                    <Box sx={{ display: 'flex', justifyContent: 'center', my: '5px' }}>
                        <Divider style={{ width: '199px' }} />
                    </Box>
                </>
            )}
            <RichTreeViewPro
                style={{ direction: 'rtl' }}
                checkboxSelection={isSelectable}
                multiSelect
                items={filteredTreeItems}
                getItemId={getItemId}
                getItemLabel={getItemLabel}
                apiRef={apiRef}
                onSelectedItemsChange={(_, itemIds) => setSelectedItemIds(itemIds)}
                selectedItems={selectedItemIds}
                onExpandedItemsChange={(_, itemIds) => setExpandedItemsIds(itemIds)}
                expandedItems={expandedItemsIds}
                itemsReordering={isDraggable}
                expansionTrigger="iconContainer"
                slots={{
                    expandIcon: ChevronLeft,
                    collapseIcon: ExpandLess,
                    item: memoizedTreeItem,
                }}
                canMoveItemToNewPosition={(params) => {
                    const isDraggingToRoot = params.newPosition.parentId === null;

                    return (
                        (!isDraggingToRoot || dragAllowNewRoot) &&
                        (allowDraggingBetweenParents || params.oldPosition.parentId === params.newPosition.parentId)
                    );
                }}
                onItemPositionChange={onDragEnd}
                selectionPropagation={selectionPropagation}
                {...restOfProps}
            />
        </>
    );
};
export default Tree;
