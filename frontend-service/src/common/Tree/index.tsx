import React, { useEffect, useRef, useState } from 'react';
import { SimpleTreeView, useTreeViewApiRef } from '@mui/x-tree-view';
import { ChevronLeft, ExpandLess } from '@mui/icons-material';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';
import { TreeType } from '../../interfaces/Tree';
import { useTreeUtils } from '../../utils/hooks/useTreeUtils';

interface TreeProps<T> {
    treeItems: TreeType<T>[];
    // setTreeItems: Dispatch<SetStateAction<TreeType<T>[]>>;
    getItemId: (item: T) => string;
    getItemLabel: (item: T) => string;
    multi: boolean;
    onSelectItems?: (item: string | string[]) => any;
    isDraggable?: boolean; // TODO
    preSelectedItemsIds?: string[];
    preExpandedItemIds?: string[];
}

const Tree = <T,>({
    treeItems,
    // setTreeItems,
    onSelectItems,
    getItemId,
    getItemLabel,
    multi,
    preSelectedItemsIds,
    preExpandedItemIds,
}: TreeProps<T>): React.ReactElement => {
    const { handleSelectedItemsChange, selectedItemsIds, renderTree } = useTreeUtils(getItemId, getItemLabel, preSelectedItemsIds);
    const [expandedItemsIds, setExpandedItemsIds] = useState<string[]>(preExpandedItemIds ?? []);

    const toggledItemRef = useRef<{ [itemId: string]: boolean }>({});

    const apiRef = useTreeViewApiRef();

    useEffect(() => {
        if (!onSelectItems || selectedItemsIds.toString() === preSelectedItemsIds?.toString()) return;
        onSelectItems(multi ? selectedItemsIds : selectedItemsIds?.[0]);
    }, [JSON.stringify(selectedItemsIds)]);

    return (
        <DragDropContext>
            <Droppable droppableId="selectCheckboxDroppable">
                {(provided) => (
                    <div ref={provided.innerRef} {...provided.droppableProps}>
                        <SimpleTreeView
                            style={{ direction: 'rtl' }}
                            checkboxSelection
                            multiSelect
                            apiRef={apiRef}
                            selectedItems={selectedItemsIds}
                            onSelectedItemsChange={(_event, itemIds) => {
                                handleSelectedItemsChange(itemIds, multi, toggledItemRef.current, apiRef);
                                toggledItemRef.current = {};
                            }}
                            onItemSelectionToggle={(_event: React.SyntheticEvent, itemId: string, isSelected: boolean) => {
                                toggledItemRef.current[itemId] = isSelected;
                            }}
                            onExpandedItemsChange={(_event: React.SyntheticEvent, itemIds: string[]) => {
                                setExpandedItemsIds(itemIds);
                            }}
                            expandedItems={expandedItemsIds}
                            slots={{
                                expandIcon: ChevronLeft,
                                collapseIcon: ExpandLess,
                            }}
                        >
                            {renderTree(treeItems)}
                        </SimpleTreeView>
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>
        </DragDropContext>
    );
};
export default Tree;
