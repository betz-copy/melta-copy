import { Button } from '@mui/material';
import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { v4 as uuidv4 } from 'uuid';

// Initial Data
const initialItems = {
    'item-1': { id: 'item-1', content: 'Item 1' },
    'item-2': { id: 'item-2', content: 'Item 2' },
};

const initialGroups = {
    'group-1': { id: 'group-1', title: 'Group 1', itemIds: ['item-1'] },
};

export const DragDropNested = () => {
    const [items, setItems] = useState(initialItems);
    const [groups, setGroups] = useState(initialGroups);
    const [rootItemIds, setRootItemIds] = useState(['group-1', 'item-2']);

    // Handling the drag and drop event
    const onDragEnd = (result) => {
        const { source, destination, draggableId } = result;
        if (!destination) return;

        // Get the list for source and destination
        const getList = (droppableId) => {
            if (groups[droppableId]) return groups[droppableId].itemIds;
            return rootItemIds;
        };

        const setList = (droppableId, newList) => {
            if (groups[droppableId]) {
                setGroups((prev) => ({
                    ...prev,
                    [droppableId]: {
                        ...prev[droppableId],
                        itemIds: newList,
                    },
                }));
            } else {
                setRootItemIds(newList);
            }
        };

        const sourceList = [...getList(source.droppableId)];
        const destList = [...getList(destination.droppableId)];

        // Move item from source to destination
        sourceList.splice(source.index, 1);
        destList.splice(destination.index, 0, draggableId);

        // Set new state lists for source and destination
        setList(source.droppableId, sourceList);
        setList(destination.droppableId, destList);
    };

    // Adding a new group dynamically
    const addGroup = () => {
        const id = `group-${uuidv4().slice(0, 6)}`;
        const newGroup = { id, title: `New Group ${id}`, itemIds: [] };

        // Add new group to the groups state and rootItemIds for the outer layer
        setGroups((prev) => ({
            ...prev,
            [id]: newGroup,
        }));

        setRootItemIds((prev) => [...prev, id]); // Ensure new group appears in the list of root items
    };

    // Rendering item or group
    const renderItem = (id, index) => {
        if (groups[id]) {
            const group = groups[id];
            return (
                <Draggable key={id} draggableId={id} index={index}>
                    {(provided) => (
                        <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            style={{
                                border: '1px solid #ccc',
                                marginBottom: 8,
                                ...provided.draggableProps.style,
                            }}
                        >
                            <div
                                {...provided.dragHandleProps}
                                style={{
                                    padding: 8,
                                    background: '#ddd',
                                }}
                            >
                                {group.title}
                            </div>
                            <Droppable droppableId={group.id} type="ITEM">
                                {(dropProvided, snapshot) => (
                                    <div
                                        ref={dropProvided.innerRef}
                                        {...dropProvided.droppableProps}
                                        style={{
                                            minHeight: 50,
                                            padding: 8,
                                            background: snapshot.isDraggingOver ? '#d0f0ff' : '#fafafa',
                                            borderTop: '1px dashed #999',
                                        }}
                                    >
                                        {group.itemIds.map((itemId, idx) => renderItem(itemId, idx))}
                                        {group.itemIds.length === 0 && <div style={{ height: 24, color: '#aaa' }}>(Drop items here)</div>}
                                        {dropProvided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </div>
                    )}
                </Draggable>
            );
        }
        return (
            <Draggable key={id} draggableId={id} index={index}>
                {(provided) => (
                    <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        style={{
                            padding: 8,
                            marginBottom: 8,
                            background: '#eee',
                            ...provided.draggableProps.style,
                        }}
                    >
                        {items[id].content}
                    </div>
                )}
            </Draggable>
        );
    };

    return (
        <div style={{ padding: 16 }}>
            <Button onClick={addGroup} style={{ marginBottom: 16 }}>
                ➕ Add New Group
            </Button>

            <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="root" type="ITEM">
                    {(provided) => (
                        <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            style={{
                                background: '#f8f8f8',
                                padding: 8,
                                minHeight: 300,
                            }}
                        >
                            {rootItemIds.map((id, index) => renderItem(id, index))}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            </DragDropContext>
        </div>
    );
};
