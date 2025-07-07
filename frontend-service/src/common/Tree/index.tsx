/* eslint-disable react-hooks/exhaustive-deps */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RichTreeViewPro, TreeItem2Props, TreeViewBaseItem } from '@mui/x-tree-view-pro';
import { ChevronLeft, ExpandLess } from '@mui/icons-material';
import { TreeViewItemReorderPosition } from '@mui/x-tree-view-pro/internals/plugins/useTreeViewItemsReordering';
import { Box, Divider } from '@mui/material';
import { flattenTree, useTreeUtils } from '../../utils/hooks/useTreeUtils';
import { SelectAll } from './SelectAll';
import TreeItem from './TreeItem';

interface TreeProps<T extends {}> {
    treeItems: TreeViewBaseItem<T>[];
    getItemId: (item: T) => string;
    getItemLabel: (item: T) => string;
    multi: boolean;
    onSelectItems?: (itemIds: string | string[]) => any;
    isDraggable?: boolean;
    allowDraggingBetweenParents?: boolean;
    preSelectedItemsIds?: string[];
    preExpandedItemIds?: string[];
    selectAll?: boolean;
    flattenedTree?: T[];
    filteredTreeItems?: T[];
    isSelectDisabled?: boolean;
    onDragEnd?: (params: { itemId: string; oldPosition: TreeViewItemReorderPosition; newPosition: TreeViewItemReorderPosition }) => void;
    showIcon?: boolean;
    // If true parents only represent the state of their children.
    parentInfersChildren?: boolean;
}

const Tree = <T extends {}>({
    treeItems,
    onSelectItems,
    getItemId,
    getItemLabel,
    preSelectedItemsIds,
    preExpandedItemIds,
    isDraggable,
    allowDraggingBetweenParents,
    selectAll,
    flattenedTree,
    filteredTreeItems = treeItems,
    isSelectDisabled,
    multi = true,
    parentInfersChildren = true,
    onDragEnd,
    showIcon,
}: TreeProps<T>): React.ReactElement => {
    const { handleSelectedItemsChange, selectedItemsIds, setSelectedItemsIds, getSelectedLeafIds, selectParentIfAllChildrenAreSelected } =
        useTreeUtils(getItemId, parentInfersChildren, treeItems);

    const isFirstRender = useRef<boolean>(true);

    const selectedIdsWithParents = useMemo(
        () => selectParentIfAllChildrenAreSelected(treeItems, getItemId, preSelectedItemsIds),
        [getItemId, preSelectedItemsIds, selectParentIfAllChildrenAreSelected, treeItems],
    );

    const TreeItemWrapper = useCallback((props: TreeItem2Props) => <TreeItem {...props} showIcon={showIcon} />, [showIcon]);

    useEffect(() => {
        setSelectedItemsIds(parentInfersChildren ? selectedIdsWithParents : preSelectedItemsIds ?? []);
    }, [JSON.stringify(preSelectedItemsIds), JSON.stringify(selectedIdsWithParents)]);

    const [expandedItemsIds, setExpandedItemsIds] = useState<string[]>(preExpandedItemIds ?? []);

    useEffect(() => {
        if (!onSelectItems || isFirstRender.current || JSON.stringify(selectedIdsWithParents) === JSON.stringify(selectedItemsIds)) {
            isFirstRender.current = false;
            return;
        }

        let result: string[];

        if (multi) {
            if (parentInfersChildren) {
                result = getSelectedLeafIds();
            } else {
                result = selectedItemsIds;
            }
        } else {
            result = [selectedItemsIds?.[0]];
        }

        onSelectItems(result);
    }, [JSON.stringify(selectedItemsIds)]);

    return (
        <>
            {selectAll && (
                <>
                    <SelectAll
                        allOptionIds={(flattenedTree ?? flattenTree(treeItems, getItemId)).map(getItemId)}
                        setSelectedOptionIds={setSelectedItemsIds}
                        selectedOptionIds={selectedItemsIds}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'center', my: '5px' }}>
                        <Divider style={{ width: '199px' }} />
                    </Box>
                </>
            )}
            <RichTreeViewPro
                style={{ direction: 'rtl' }}
                checkboxSelection={!isSelectDisabled}
                multiSelect
                items={filteredTreeItems}
                getItemId={getItemId}
                getItemLabel={getItemLabel}
                selectedItems={selectedItemsIds}
                onSelectedItemsChange={(_event, itemIds) => {
                    setSelectedItemsIds(handleSelectedItemsChange(itemIds, multi));
                }}
                onExpandedItemsChange={(_event: React.SyntheticEvent, itemIds: string[]) => {
                    setExpandedItemsIds(itemIds);
                }}
                expandedItems={expandedItemsIds}
                itemsReordering={isDraggable}
                expansionTrigger="iconContainer"
                slots={{
                    expandIcon: ChevronLeft,
                    collapseIcon: ExpandLess,
                    item: TreeItemWrapper,
                }}
                experimentalFeatures={{ indentationAtItemLevel: true, itemsReordering: true }}
                canMoveItemToNewPosition={(params) => allowDraggingBetweenParents || params.oldPosition.parentId === params.newPosition.parentId}
                onItemPositionChange={onDragEnd}
                disableSelection={isSelectDisabled}
            />
        </>
    );
};
export default Tree;
