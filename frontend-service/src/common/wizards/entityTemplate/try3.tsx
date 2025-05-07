import React, { useState } from 'react';
import { DndContext, closestCenter, useDroppable, useDraggable, DragOverlay } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { v4 as uuidv4 } from 'uuid';
import { Button, Grid } from '@mui/material';

const DraggableItem = ({ id, content }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id });

    const style = {
        padding: 8,
        margin: 4,
        background: '#eee',
        border: '1px solid #ccc',
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} {...attributes} {...listeners} style={style}>
            {content}
        </div>
    );
};

const DroppableGroup = ({ id, children }) => {
    const { setNodeRef, isOver } = useDroppable({ id });
    const style = {
        padding: 8,
        margin: 8,
        border: '2px dashed #ccc',
        background: isOver ? '#d0f0ff' : '#f9f9f9',
    };
    return (
        <div ref={setNodeRef} style={style}>
            <strong>Group: {id}</strong>
            <div style={{ marginTop: 8 }}>{children}</div>
        </div>
    );
};

export const DndKitNested = () => {
    const [structure, setStructure] = useState([
        { id: 'item-1', type: 'field', content: 'Item 1' },
        { id: 'group-1', type: 'group', items: ['item-3'] },
        { id: 'item-2', type: 'field', content: 'Item 2' },
    ]);
    // const [groups, setGroups] = useState([{ id: 'group-1', items: ['item-1'] }]);
    const [activeId, setActiveId] = useState(null);

    const findContainer = (id) => {
        if (structure.find((i) => i.id === id)) return 'root';
        const group = groups.find((g) => g.items.includes(id));
        return group ? group.id : null;
    };

    const handleDragStart = (event) => {
        setActiveId(event.active.id);
    };

    const handleDragEnd = ({ active, over }) => {
        if (!over || active.id === over.id) return;

        const newStructure = [...structure];
        let dragged;

        // Remove from old position
        for (let i = 0; i < newStructure.length; i++) {
            if (newStructure[i].type === 'group') {
                const index = newStructure[i].items.findIndex((it) => it.id === active.id);
                if (index > -1) {
                    dragged = newStructure[i].items.splice(index, 1)[0];
                    if (newStructure[i].items.length === 0) {
                        // remove empty group if needed
                    }
                    break;
                }
            }
            if (newStructure[i].id === active.id) {
                dragged = newStructure.splice(i, 1)[0];
                break;
            }
        }

        if (!dragged) return;

        // Insert into new position
        for (let i = 0; i < newStructure.length; i++) {
            if (newStructure[i].id === over.id) {
                if (newStructure[i].type === 'group') {
                    newStructure[i].items.push(dragged);
                } else {
                    newStructure.splice(i, 0, dragged);
                }
                break;
            }
        }

        setStructure(newStructure);
        // setActiveItem(null);
        // setActiveItemData(null);
    };

    const handleAddGroup = () => {
        const newId = `group-${uuidv4().slice(0, 6)}`;
        setStructure([...structure, { id: newId, type: 'group', items: [] }]);
    };

    return (
        <div style={{ padding: 20 }}>
            <Button onClick={handleAddGroup}>➕ Add Group</Button>

            <DndContext collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                <DroppableGroup id="root">
                    <Grid sx={{ padding: '10px' }}>
                        {/* <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}> */}
                        {structure.map((item) =>
                            item.type === 'field' ? (
                                <DraggableItem key={item.id} id={item.id} content={item.content} />
                            ) : (
                                <DraggableItem
                                    key={item.id}
                                    id={item.id}
                                    content={
                                        <DroppableGroup key={item.id} id={item.id}>
                                            {item.items?.map((id) => {
                                                const item1 = structure.find((i) => i.id === id) || { id, content: id };
                                                return <DraggableItem key={id} id={id} content={item1.content} />;
                                            })}
                                        </DroppableGroup>
                                    }
                                />
                            ),
                        )}
                    </Grid>
                </DroppableGroup>

                <DragOverlay>{activeId ? <DraggableItem id={activeId} content={activeId} /> : null}</DragOverlay>
            </DndContext>
        </div>
    );
};
