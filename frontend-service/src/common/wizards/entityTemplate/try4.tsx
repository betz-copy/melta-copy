import React, { useState } from 'react';
import { DndContext, closestCenter, useDraggable, useDroppable, DragOverlay } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '@mui/material';

const DraggableItem = ({ id, content, listeners, attributes, isDragging, transform, setNodeRef }) => {
    const style = {
        padding: 8,
        margin: 4,
        background: '#fff',
        border: '1px solid #ccc',
        borderRadius: 4,
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} {...attributes} {...listeners} style={style}>
            {content}
        </div>
    );
};

const DroppableZone = ({ id, children, isOver }) => {
    const style = {
        padding: 12,
        margin: 8,
        background: isOver ? '#e0f7ff' : '#f9f9f9',
        border: '2px dashed #aaa',
        borderRadius: 6,
        minWidth: 200,
        minHeight: 50,
    };
    return (
        <div id={id} style={style}>
            {children}
        </div>
    );
};

const DraggableField = ({ item }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: item.id });

    return (
        <DraggableItem
            id={item.id}
            content={item.content || item.id}
            listeners={listeners}
            attributes={attributes}
            setNodeRef={setNodeRef}
            transform={transform}
            isDragging={isDragging}
        />
    );
};

const GroupComponent = ({ group }) => {
    const { setNodeRef: setNodeRefDrop, isOver } = useDroppable({ id: group.id });
    const { attributes, listeners, setNodeRef: setNodeRefDrag, transform, isDragging } = useDraggable({ id: group.id });

    return (
        <DraggableItem
            id={group.id}
            content={
                <div ref={setNodeRefDrop}>
                    <DroppableZone id={group.id} isOver={isOver}>
                        <strong>Group: {group.id}</strong>
                        {group.items.map((item) => (
                            <DraggableField key={item.id} item={item} />
                        ))}
                    </DroppableZone>
                </div>
            }
            listeners={listeners}
            attributes={attributes}
            setNodeRef={setNodeRefDrag}
            transform={transform}
            isDragging={isDragging}
        />
    );
};

export const ManualDndLayout = () => {
    const [structure, setStructure] = useState([
        { id: 'item-1', type: 'field', content: 'Field A' },
        { id: 'group-1', type: 'group', items: [{ id: 'item-2', type: 'field', content: 'Field B' }] },
        { id: 'item-3', type: 'field', content: 'Field C' },
    ]);

    const [activeItem, setActiveItem] = useState(null);
    const [activeItemData, setActiveItemData] = useState(null);

    const handleDragStart = ({ active }) => {
        const allItems = structure.flatMap((s) => (s.type === 'group' ? [s, ...s.items] : [s]));
        const found = allItems.find((i) => i.id === active.id);
        setActiveItem(active.id);
        setActiveItemData(found);
    };

    const handleDragOver = () => {};

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
        setActiveItem(null);
        setActiveItemData(null);
    };

    const handleAddGroup = () => {
        const newId = `group-${uuidv4().slice(0, 6)}`;
        setStructure([...structure, { id: newId, type: 'group', items: [] }]);
    };

    const { setNodeRef, isOver } = useDroppable({ id: 'area' });

    return (
        <div style={{ padding: 24 }}>
            <Button onClick={handleAddGroup}>➕ Add Group</Button>

            <DndContext collisionDetection={closestCenter} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
                <div style={{ padding: '10px' }} ref={setNodeRef}>
                    <DroppableZone id="area" isOver={isOver}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 20 }}>
                            {structure.map((entry) => {
                                if (entry.type === 'group') return <GroupComponent key={entry.id} group={entry} />;
                                return <DraggableField key={entry.id} item={entry} />;
                            })}
                        </div>

                        {/* <DragOverlay>
                    {activeItemData ? (
                        <DraggableItem
                            id={activeItemData.id}
                            content={activeItemData.content}
                            listeners={{}}
                            attributes={{}}
                            isDragging
                            setNodeRef={null}
                            transform={null}
                        />
                    ) : null}
                </DragOverlay> */}
                    </DroppableZone>
                </div>
            </DndContext>
        </div>
    );
};
