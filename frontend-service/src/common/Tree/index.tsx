import React, { useEffect, useRef, useState } from 'react';
import { RichTreeViewPro, useTreeViewApiRef } from '@mui/x-tree-view-pro';
import { ChevronLeft, ExpandLess } from '@mui/icons-material';
import { Box, Divider } from '@mui/material';
import { TreeType } from '../../interfaces/Tree';
import { flattenTree, useTreeUtils } from '../../utils/hooks/useTreeUtils';
import { SelectAll } from './SelectAll';

interface TreeProps<T> {
    treeItems: TreeType<T>[];
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

    // If true parents only represent the state of their children.
    parentInfersChildren?: boolean;
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
    selectAll,
    parentInfersChildren = true,
    flattenedTree,
}: TreeProps<T>): React.ReactElement => {
    const { handleSelectedItemsChange, selectedItemsIds, setSelectedItemsIds, getSelectedLeafIds } = useTreeUtils(
        getItemId,
        parentInfersChildren,
        preSelectedItemsIds,
        treeItems,
    );

    const [expandedItemsIds, setExpandedItemsIds] = useState<string[]>(preExpandedItemIds ?? []);

    const toggledItemRef = useRef<{ [itemId: string]: boolean }>({});

    const apiRef = useTreeViewApiRef();

    useEffect(() => {
        if (!onSelectItems || selectedItemsIds.toString() === preSelectedItemsIds?.toString()) return;
        onSelectItems(multi ? getSelectedLeafIds() : selectedItemsIds?.[0]);
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
        </>
    );
};
export default Tree;
