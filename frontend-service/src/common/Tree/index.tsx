/** biome-ignore-all lint/correctness/useExhaustiveDependencies: useEffect dependencies */
import { ChevronLeft, ExpandLess } from '@mui/icons-material';
import { Box, Divider, SxProps, Theme, ThemeProvider } from '@mui/material';
import { RichTreeViewPro, RichTreeViewProProps, TreeItemProps, TreeViewBaseItem, UseTreeItemStatus, useTreeViewApiRef } from '@mui/x-tree-view-pro';
import { TreeViewItemReorderPosition } from '@mui/x-tree-view-pro/internals/plugins/useTreeViewItemsReordering';
import _ from 'lodash';
import React, { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { SelectAll } from './SelectAll';
import TreeItem from './TreeItem';

type IFlattenedTree<T extends {}, K extends boolean> = Omit<TreeViewBaseItem<T>, 'children'> & (K extends true ? { path: string } : object);

export interface TreeProps<T extends {}> extends Omit<RichTreeViewProProps<T, true>, 'onDragEnd' | 'items'> {
    // All of the treeItems that the tree has.
    treeItems: TreeViewBaseItem<T>[];
    getItemId: (item: T) => string;
    getItemLabel: (item: T) => string;
    // Custom render for the item label
    renderItemLabel?: (node: T) => React.ReactNode;
    // Display a selectAll checkbox
    selectAll?: boolean;
    onSelectItems?: (itemIds: string | string[]) => void;
    isDraggable?: boolean;
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
    // Left side buttons
    additionalOptions?: ((node: T) => ReactNode)[];
    showIcon?: boolean;
    getStyles?: (params: { node: T; status: UseTreeItemStatus; itemDepth: number }) => {
        treeItemContent?: SxProps<Theme>;
        treeNodeGroupTransition?: SxProps<Theme>;
    };
}

export const flattenTree = <T extends {}, K extends boolean>(
    treeItems: TreeViewBaseItem<T>[],
    getItemId: (item: TreeViewBaseItem<T>) => string,
    shouldCountParents: boolean,
    includePath: K = true as K,
    flattenedNodes: IFlattenedTree<T, K>[] = [],
    parentPath = '',
): IFlattenedTree<T, K>[] => {
    treeItems.forEach((treeItem) => {
        const { children, ...rest } = treeItem;
        const currentId = getItemId(rest as T);
        const path = parentPath ? `${parentPath}/${currentId}` : currentId;
        const newNode = { ...rest, ...(includePath && { path }) };

        if (children?.length) {
            flattenTree(children, getItemId, shouldCountParents, includePath, flattenedNodes, path);

            if (shouldCountParents) flattenedNodes.push(newNode);
        } else flattenedNodes.push(newNode);
    });

    return flattenedNodes;
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
    isDraggable = false,
    dragAllowNewRoot = true,
    additionalOptions,
    getStyles,
    onDragEnd,
    removeDivider,
    selectAll,
    showIcon,
    filteredTreeItems = treeItems,
    onClick,
    onKeyUp,
    selectionPropagation = { descendants: true, parents: true }, // In order to auto select children
    multiSelect = true,
    renderItemLabel,
    ...restOfProps
}: TreeProps<T>): React.ReactElement => {
    const [expandedItemsIds, setExpandedItemsIds] = useState<string[]>(preExpandedItemIds ?? []);
    const [selectedItemIds, setSelectedItemIds] = useState<string[]>(preSelectedItemsIds ?? []);

    const apiRef = useTreeViewApiRef();

    const getItemById = useCallback((itemId: string) => apiRef.current?.getItem(itemId), [apiRef]);

    const memoizedTreeItem = useCallback(
        (props: TreeItemProps) => (
            <TreeItem
                {...props}
                removeDivider={removeDivider}
                node={getItemById(props.itemId)}
                showIcon={showIcon}
                // biome-ignore lint/suspicious/noExplicitAny: blame Itay
                getStyles={getStyles as any}
                renderItemLabel={renderItemLabel as (node: unknown) => ReactNode}
                additionalOptions={additionalOptions as ((node: unknown) => ReactNode)[]}
            />
        ),
        [showIcon, additionalOptions, getItemById, getStyles, removeDivider],
    );

    const flattenTreeIds = useMemo(
        () => flattenTree(treeItems, getItemId, !selectionPropagation.parents).map((node) => getItemId(node as unknown as T)),
        [getItemId, treeItems, selectionPropagation],
    );

    useEffect(() => {
        onSelectItems?.(selectedItemIds);
    }, [selectedItemIds]);

    useEffect(() => {
        setExpandedItemsIds(preExpandedItemIds ?? []);
    }, [preExpandedItemIds]);

    useEffect(() => {
        if (!_.isEqual(preSelectedItemsIds, selectedItemIds)) {
            setSelectedItemIds(preSelectedItemsIds ?? []);
        }
    }, [preSelectedItemsIds]);

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
            <ThemeProvider theme={{ direction: 'rtl' }}>
                <RichTreeViewPro
                    checkboxSelection={isSelectable}
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
                    multiSelect={multiSelect}
                    {...restOfProps}
                />
            </ThemeProvider>
        </>
    );
};
export default Tree;
