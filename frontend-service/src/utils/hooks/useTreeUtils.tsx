import { TreeItem, TreeViewBaseItem } from '@mui/x-tree-view';
import React, { useState } from 'react';
import { Draggable } from 'react-beautiful-dnd';

export const useTreeUtils = (getItemId: (item) => string, getItemLabel: (item) => string, preSelectedItemsIds?: string[]) => {
    const [selectedItemsIds, setSelectedItemsIds] = useState<string[]>(preSelectedItemsIds ?? []);

    // Select functions
    const getItemDescendantsIds = (item: TreeViewBaseItem) => {
        const ids: string[] = [];

        item?.children?.forEach((child) => {
            ids.push(getItemId(child));
            ids.push(...getItemDescendantsIds(child));
        });

        return ids;
    };

    const handleSelectedItemsChange = (newSelectedItemsPaths: string[], multi: boolean, toggledItem: Record<string, boolean>, apiRef: any) => {
        if (!multi) {
            setSelectedItemsIds([newSelectedItemsPaths?.[0]]);
            return;
        }

        setSelectedItemsIds(newSelectedItemsPaths);

        const itemsToSelect: string[] = [];
        const itemsToUnSelect: { [itemId: string]: boolean } = {};

        Object.entries(toggledItem).forEach(([itemId, isSelected]) => {
            const item = (apiRef.current as any)!.getItem(itemId);

            if (isSelected) {
                itemsToSelect.push(...getItemDescendantsIds(item));
            } else {
                getItemDescendantsIds(item).forEach((descendantId) => {
                    itemsToUnSelect[descendantId] = true;
                });
            }
        });

        const newSelectedItemsWithChildren = Array.from(
            new Set([...newSelectedItemsPaths, ...itemsToSelect].filter((itemId) => !itemsToUnSelect[itemId])),
        );

        setSelectedItemsIds(newSelectedItemsWithChildren);
    };

    // Render functions
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

    // Dragging functions
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

    const onDragEndHandler = (result, tree) => {
        const { source, destination, draggableId } = result;

        if (!destination) return tree;

        const updatedTree = reorderTree(tree, draggableId, source.index, destination.index);

        return updatedTree;
    };

    return { onDragEndHandler, handleSelectedItemsChange, selectedItemsIds, renderTree };
};
