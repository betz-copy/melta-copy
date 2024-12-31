import React, { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react';
import { SimpleTreeView, TreeItem, TreeViewBaseItem, useTreeViewApiRef } from '@mui/x-tree-view';
import { ChevronLeft, ExpandLess } from '@mui/icons-material';
import { DragDropContext, Draggable, Droppable, DropResult } from 'react-beautiful-dnd';
import { TreeType } from '../interfaces/Tree';

interface TreeProps<T> {
    treeItems: TreeType<T>[];
    setTreeItems: Dispatch<SetStateAction<TreeType<T>[]>>;
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
    setTreeItems,
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

    const renderTree = (items, countIndex = 0) =>
        items.map((item, index) => {
            const itemId = getItemId(item);
            const label = getItemLabel(item);
            const children = item.children || [];
            const correctIndex = index + countIndex;

            return (
                <Draggable index={correctIndex} key={itemId} draggableId={itemId}>
                    {(draggableProvided) => (
                        <div ref={draggableProvided.innerRef} {...draggableProvided.draggableProps} {...draggableProvided.dragHandleProps}>
                            <TreeItem itemId={itemId} label={label}>
                                {children.length > 0 && renderTree(children, correctIndex + 1)}
                            </TreeItem>
                        </div>
                    )}
                </Draggable>
            );
        });

    const reorderTree = (tree, draggableId, _sourceIndex, destinationIndex) => {
        const reorderItems = (items) => {
            return items.map((item) => {
                if (item.id === draggableId) {
                    return { ...item, index: destinationIndex };
                }

                if (item.children && item.children.length) {
                    return { ...item, children: reorderItems(item.children) };
                }
                return item;
            });
        };

        const reorderedItems = reorderItems(tree);
        return reorderedItems;
    };

    // Helper function to find and update the tree with the new order after drag
    const onDragEndHandler = (result, tree) => {
        const { source, destination, draggableId } = result;

        if (!destination) return tree; // If dropped outside

        // Find the source and destination parent and update order
        const updatedTree = reorderTree(tree, draggableId, source.index, destination.index);

        return updatedTree;
    };

    return (
        <DragDropContext
            onDragEnd={(result: DropResult) => {
                const reorderedTree = onDragEndHandler(result, treeItems);
                console.log({ reorderedTree });
            }}
        >
            <Droppable droppableId="selectCheckboxDroppable">
                {(provided) => (
                    <div ref={provided.innerRef} {...provided.droppableProps}>
                        <SimpleTreeView
                            style={{ direction: 'rtl' }}
                            checkboxSelection
                            multiSelect
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
