import React, { useEffect, useRef, useState } from 'react';
import { RichTreeViewPro, TreeViewBaseItem } from '@mui/x-tree-view-pro';
import { ChevronLeft, ExpandLess } from '@mui/icons-material';
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
    multi = true,
    parentInfersChildren = true,
}: TreeProps<T>): React.ReactElement => {
    const { handleSelectedItemsChange, selectedItemsIds, setSelectedItemsIds, getSelectedLeafIds, selectParentIfAllChildrenAreSelected } =
        useTreeUtils(getItemId, parentInfersChildren, treeItems);

    const isFirstRender = useRef<boolean>(true);

    useEffect(() => {
        setSelectedItemsIds(
            parentInfersChildren ? selectParentIfAllChildrenAreSelected(treeItems, preSelectedItemsIds, getItemId) : preSelectedItemsIds,
        );
    }, [JSON.stringify(preSelectedItemsIds)]);

    const [expandedItemsIds, setExpandedItemsIds] = useState<string[]>(preExpandedItemIds ?? []);

    useEffect(() => {
        if (!onSelectItems || isFirstRender.current) {
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
                <Box>
                    <SelectAll
                        allOptionIds={(flattenedTree ?? flattenTree(treeItems, getItemId)).map(getItemId)}
                        setSelectedOptionIds={setSelectedItemsIds}
                        selectedOptionIds={selectedItemsIds}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'center', my: '5px' }}>
                        <Divider style={{ width: '199px' }} />
                    </Box>
                </Box>
            )}
            <RichTreeViewPro
                style={{ direction: 'rtl' }}
                checkboxSelection
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
                slots={{
                    expandIcon: ChevronLeft,
                    collapseIcon: ExpandLess,
                    item: TreeItem,
                }}
                experimentalFeatures={{ indentationAtItemLevel: true, itemsReordering: true }}
                canMoveItemToNewPosition={(params) => allowDraggingBetweenParents || params.oldPosition.parentId === params.newPosition.parentId}
            />
        </>
    );
};
export default Tree;
