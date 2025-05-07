// import React, { useState } from 'react';
// import { DndContext, closestCenter, useDraggable, useDroppable, DragOverlay } from '@dnd-kit/core';
// import { CSS } from '@dnd-kit/utilities';
// import { v4 as uuidv4 } from 'uuid';
// import { Button } from '@mui/material';
// import { arrayMove, SortableContext } from '@dnd-kit/sortable';

// const DraggableItem = ({ id, content, listeners, attributes, isDragging, transform, setNodeRef }) => {
//     const style = {
//         padding: 8,
//         margin: 4,
//         background: '#fff',
//         border: '1px solid #ccc',
//         borderRadius: 4,
//         transform: CSS.Translate.toString(transform),
//         opacity: isDragging ? 0.5 : 1,
//     };

//     return (
//         <div ref={setNodeRef} {...attributes} {...listeners} style={style}>
//             {content}
//         </div>
//     );
// };

// const DroppableZone = ({ id, children, isOver, setNodeRef }) => {
//     const style = {
//         padding: 12,
//         margin: 8,
//         background: id === 'area' ? 'pink' : isOver ? '#e0f7ff' : '#f9f9f9',
//         border: '2px dashed #aaa',
//         borderRadius: 6,
//         minWidth: 200,
//         minHeight: 50,
//     };
//     return (
//         <div id={id} style={style} ref={setNodeRef}>
//             {children}
//         </div>
//     );
// };

// const DraggableField = ({ item }) => {
//     const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: item.id });

//     return (
//         <DraggableItem
//             id={item.id}
//             content={item.content || item.id}
//             listeners={listeners}
//             attributes={attributes}
//             setNodeRef={setNodeRef}
//             transform={transform}
//             isDragging={isDragging}
//         />
//     );
// };

// const GroupComponent = ({ group }) => {
//     const { setNodeRef: setNodeRefDrop, isOver } = useDroppable({ id: group.id });
//     const { attributes, listeners, setNodeRef: setNodeRefDrag, transform, isDragging } = useDraggable({ id: group.id });
//     // const [{ isDragging }, drag] = useDrag({ id: group.id });

//     return (
//         <DraggableItem
//             id={group.id}
//             content={
//                 <DroppableZone id={group.id} isOver={isOver} setNodeRef={setNodeRefDrop}>
//                     <strong>Group: {group.id}</strong>
//                     {group.items.map((item) => (
//                         <DraggableField key={item.id} item={item} />
//                     ))}
//                 </DroppableZone>
//             }
//             listeners={listeners}
//             attributes={attributes}
//             setNodeRef={setNodeRefDrag}
//             transform={transform}
//             isDragging={isDragging}
//         />
//     );
// };

// export const ManualDndLayout = () => {
//     const [structure, setStructure] = useState([
//         { id: 'item-1', type: 'field', content: 'Field A' },
//         { id: 'group-1', type: 'group', items: [{ id: 'item-2', type: 'field', content: 'Field B' }] },
//         { id: 'item-3', type: 'field', content: 'Field C' },
//         { id: 'item-4', type: 'field', content: 'Field D' },
//     ]);

//     const [activeItem, setActiveItem] = useState(null);
//     const [activeItemData, setActiveItemData] = useState(null);

//     const handleDragStart = ({ active }) => {
//         const allItems = structure.flatMap((s) => (s.type === 'group' ? [s, ...s.items] : [s]));
//         const found = allItems.find((i) => i.id === active.id);
//         setActiveItem(active.id);
//         setActiveItemData(found);
//     };

//     const handleDragOver = () => {};

//     const handleDragEnd = ({ active, over }) => {
//         if (!over || active.id === over.id) return;
//         console.log({ active, over });

//         if (over && active.id !== over.id) {
//             setStructure((items) => {
//                 const oldIndex = items.find((item) => item.id === active.id);
//                 const newIndex = items.find((item) => item.id === over.id);
//                 return arrayMove(items, oldIndex, newIndex);
//             });
//             return;
//         }

//         const newStructure = [...structure];
//         let dragged;

//         // Remove from old position
//         for (let i = 0; i < newStructure.length; i++) {
//             if (newStructure[i].type === 'group') {
//                 const index = newStructure[i].items.findIndex((it) => it.id === active.id);
//                 if (index > -1) {
//                     dragged = newStructure[i].items.splice(index, 1)[0];
//                     break;
//                 }
//             }
//             if (newStructure[i].id === active.id) {
//                 dragged = newStructure.splice(i, 1)[0];
//                 break;
//             }
//         }

//         if (!dragged) return;

//         // Insert into new position (handle dropping into a group or area)
//         let inserted = false;

//         // Check if the drop target is a group
//         for (let i = 0; i < newStructure.length; i++) {
//             if (newStructure[i].id === over.id && newStructure[i].type === 'group') {
//                 newStructure[i].items.push(dragged); // Insert into group
//                 inserted = true;
//                 break;
//             }
//         }

//         // If it's not a group, it means it's the area
//         if (!inserted) {
//             if (over.id === 'area') {
//                 newStructure.push(dragged); // Insert into area
//                 inserted = true;
//             }
//         }

//         // If no insert occurred, add at the end (as a fallback)
//         if (!inserted) {
//             newStructure.push(dragged);
//         }

//         setStructure(newStructure);
//         setActiveItem(null);
//         setActiveItemData(null);
//     };

//     const handleAddGroup = () => {
//         const newId = `group-${uuidv4().slice(0, 6)}`;
//         setStructure([...structure, { id: newId, type: 'group', items: [] }]);
//     };

//     const { setNodeRef, isOver } = useDroppable({ id: 'area' });

//     return (
//         <div style={{ padding: 24 }}>
//             <Button onClick={handleAddGroup}>➕ Add Group</Button>

//             <DndContext collisionDetection={closestCenter} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
//                 <SortableContext items={structure}>
//                     <DroppableZone id="area" isOver={isOver} setNodeRef={setNodeRef}>
//                         <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 20, flexDirection: 'column' }}>
//                             {structure.map((entry) => {
//                                 if (entry.type === 'group') return <GroupComponent key={entry.id} group={entry} />;
//                                 return <DraggableField key={entry.id} item={entry} />;
//                             })}
//                         </div>
//                     </DroppableZone>
//                 </SortableContext>
//             </DndContext>
//         </div>
//     );
// };

// App.js
// App.tsx or App.jsx
// import React, { useState } from 'react';
// import { DndProvider, useDrag, useDrop } from 'react-dnd';
// import { HTML5Backend } from 'react-dnd-html5-backend';

// const ItemTypes = {
//     FIELD: 'field',
// };

// const Field = ({ field, onDrop, dragItem, index, parentId }) => {
//     const [{ isDragging }, drag] = useDrag({
//         type: ItemTypes.FIELD,
//         item: { ...field, index, parentId },
//         collect: (monitor) => ({
//             isDragging: monitor.isDragging(),
//         }),
//     });

//     const [, drop] = useDrop({
//         accept: ItemTypes.FIELD,
//         drop: (item) => {
//             if (item.id !== field.id) {
//                 onDrop(item, index, parentId);
//             }
//         },
//     });

//     return (
//         <div
//             ref={(node) => drag(drop(node))}
//             style={{
//                 opacity: isDragging ? 0.4 : 1,
//                 padding: 8,
//                 margin: 4,
//                 background: '#f5f5f5',
//                 border: '1px solid #aaa',
//                 borderRadius: 4,
//             }}
//         >
//             {field.content}
//         </div>
//     );
// };

// const Group = ({ group, onDrop }) => {
//     const [, drop] = useDrop({
//         accept: ItemTypes.FIELD,
//         drop: (item) => {
//             if (item.parentId !== group.id) {
//                 onDrop(item, group.items.length, group.id);
//             }
//         },
//     });

//     return (
//         <div
//             ref={drop}
//             style={{
//                 margin: 8,
//                 padding: 8,
//                 background: '#e0e0e0',
//                 border: '2px solid #888',
//                 borderRadius: 6,
//             }}
//         >
//             <strong>Group:</strong>
//             {group.items.map((field, idx) => (
//                 <Field key={field.id} field={field} index={idx} parentId={group.id} onDrop={onDrop} />
//             ))}
//         </div>
//     );
// };

// const StructureEditor = () => {
//     const [structure, setStructure] = useState([
//         { id: 'item-1', type: 'field', content: 'Field A' },
//         {
//             id: 'group-1',
//             type: 'group',
//             items: [{ id: 'item-2', type: 'field', content: 'Field B' }],
//         },
//         { id: 'item-3', type: 'field', content: 'Field C' },
//         { id: 'item-4', type: 'field', content: 'Field D' },
//     ]);

//     const moveField = (draggedItem, toIndex, toParentId) => {
//         setStructure((prevStructure) => {
//             const newStructure = JSON.parse(JSON.stringify(prevStructure)); // deep clone

//             // Remove from old location
//             let draggedField = null;
//             if (!draggedItem.parentId) {
//                 const index = newStructure.findIndex((el) => el.id === draggedItem.id);
//                 draggedField = newStructure.splice(index, 1)[0];
//             } else {
//                 const group = newStructure.find((el) => el.id === draggedItem.parentId);
//                 const index = group.items.findIndex((el) => el.id === draggedItem.id);
//                 draggedField = group.items.splice(index, 1)[0];
//             }

//             // Add to new location
//             if (!toParentId) {
//                 newStructure.splice(toIndex, 0, draggedField);
//             } else {
//                 const group = newStructure.find((el) => el.id === toParentId);
//                 group.items.splice(toIndex, 0, draggedField);
//             }

//             return newStructure;
//         });
//     };

//     // ⬇️ Add drop support to the main container
//     const [, drop] = useDrop({
//         accept: ItemTypes.FIELD,
//         drop: (item) => {
//             // If it's already at top level, don't do anything
//             if (!item.parentId) return;

//             moveField(item, structure.length, null); // drop at end of main list
//         },
//     });

//     return (
//         <div
//             ref={drop}
//             style={{
//                 border: '2px dashed #aaa',
//                 padding: 10,
//                 margin: 10,
//                 borderRadius: 8,
//                 minHeight: 100,
//             }}
//         >
//             <strong>Main Area</strong>
//             {structure.map((item, idx) =>
//                 item.type === 'group' ? (
//                     <Group key={item.id} group={item} onDrop={moveField} />
//                 ) : (
//                     <Field key={item.id} field={item} index={idx} parentId={null} onDrop={moveField} />
//                 ),
//             )}
//         </div>
//     );
// };

// shirel - save this part of code
// import React, { useState } from 'react';
// import { DndProvider, useDrag, useDrop } from 'react-dnd';
// import { HTML5Backend } from 'react-dnd-html5-backend';

// const ItemTypes = {
//     FIELD: 'field',
// };

// let idCounter = 5;
// const generateId = () => `item-${idCounter++}`;

// const Field = ({ field, onDrop, index, parentId }) => {
//     const ref = React.useRef(null);

//     const [, drop] = useDrop({
//         accept: ItemTypes.FIELD,
//         hover(item, monitor) {
//             if (!ref.current || item.id === field.id) return;

//             const dragIndex = item.index;
//             const hoverIndex = index;

//             if (dragIndex === hoverIndex && item.parentId === parentId) return;

//             onDrop(item, hoverIndex, parentId);
//             item.index = hoverIndex;
//             item.parentId = parentId;
//         },
//     });

//     const [{ isDragging }, drag] = useDrag({
//         type: ItemTypes.FIELD,
//         item: { ...field, index, parentId },
//         collect: (monitor) => ({
//             isDragging: monitor.isDragging(),
//         }),
//     });

//     drag(drop(ref));

//     return (
//         <div
//             ref={ref}
//             style={{
//                 opacity: isDragging ? 0.4 : 1,
//                 padding: 8,
//                 margin: 4,
//                 background: '#f5f5f5',
//                 border: '1px solid #aaa',
//                 borderRadius: 4,
//             }}
//         >
//             {field.content}
//         </div>
//     );
// };

// const Group = ({ group, onDrop }) => {
//     const [, drop] = useDrop({
//         accept: ItemTypes.FIELD,
//         drop: (item) => {
//             if (item.parentId !== group.id) {
//                 onDrop(item, group.items.length, group.id);
//             }
//         },
//     });

//     return (
//         <div
//             ref={drop}
//             style={{
//                 margin: 8,
//                 padding: 8,
//                 background: '#e0e0e0',
//                 border: '2px solid #888',
//                 borderRadius: 6,
//             }}
//         >
//             <strong>Group:</strong>
//             {group.items.map((field, idx) => (
//                 <Field key={field.id} field={field} index={idx} parentId={group.id} onDrop={onDrop} />
//             ))}
//         </div>
//     );
// };

// const StructureEditor = () => {
//     const [structure, setStructure] = useState([
//         { id: 'item-1', type: 'field', content: 'Field A' },
//         {
//             id: 'group-1',
//             type: 'group',
//             items: [{ id: 'item-2', type: 'field', content: 'Field B' }],
//         },
//         { id: 'item-3', type: 'field', content: 'Field C' },
//         { id: 'item-4', type: 'field', content: 'Field D' },
//     ]);

//     const moveField = (item, toIndex, toGroupId = null) => {
//         setStructure((prevStructure) => {
//             const newStructure = [...prevStructure];
//             let movedItem;
//             console.log({ item, toIndex, toGroupId });

//             // Remove from original location
//             if (item.parentId) {
//                 const fromGroupIndex = newStructure.findIndex((el) => el.id === item.parentId);
//                 const fromGroup = newStructure[fromGroupIndex];
//                 const itemIndex = fromGroup.items.findIndex((el) => el.id === item.id);
//                 console.log({ itemIndex });

//                 movedItem = fromGroup.items.splice(itemIndex, 1)[0];
//             } else {
//                 const itemIndex = newStructure.findIndex((el) => el.id === item.id);
//                 movedItem = newStructure.splice(itemIndex, 1)[0];
//             }

//             // Add to new location
//             if (toGroupId) {
//                 const toGroupIndex = newStructure.findIndex((el) => el.id === toGroupId);
//                 newStructure[toGroupIndex].items.splice(toIndex, 0, movedItem);
//             } else {
//                 newStructure.splice(toIndex, 0, movedItem);
//             }

//             return newStructure;
//         });
//     };

//     const [, drop] = useDrop({
//         accept: ItemTypes.FIELD,
//         drop: (item, monitor) => {
//             if (!item.parentId) return;

//             if (monitor.didDrop()) return;

//             moveField(item, structure.length, null);
//         },
//     });

//     const addField = () => {
//         const newField = {
//             id: generateId(),
//             type: 'field',
//             content: `Field ${String.fromCharCode(65 + idCounter - 5)}`,
//         };
//         setStructure((s) => [...s, newField]);
//     };

//     const addGroup = () => {
//         const newGroup = {
//             id: `group-${idCounter++}`,
//             type: 'group',
//             items: [],
//         };
//         setStructure((s) => [...s, newGroup]);
//     };

//     return (
//         <div>
//             <div style={{ marginBottom: 10 }}>
//                 <button onClick={addField} style={{ marginRight: 8 }}>
//                     ➕ Add Field
//                 </button>
//                 <button onClick={addGroup}>📦 Add Group</button>
//             </div>

//             <div
//                 ref={drop}
//                 style={{
//                     border: '2px dashed #aaa',
//                     padding: 10,
//                     margin: 10,
//                     borderRadius: 8,
//                     minHeight: 100,
//                 }}
//             >
//                 <strong>Main Area</strong>
//                 {structure.map((item, idx) =>
//                     item.type === 'group' ? (
//                         <Group key={item.id} group={item} onDrop={moveField} />
//                     ) : (
//                         <Field key={item.id} field={item} index={idx} parentId={null} onDrop={moveField} />
//                     ),
//                 )}
//             </div>
//         </div>
//     );
// };

// export const ManualDndLayout = () => {
//     return (
//         <DndProvider backend={HTML5Backend}>
//             <h3 style={{ padding: '10px' }}>Drag & Drop Fields and Groups</h3>
//             <StructureEditor />
//         </DndProvider>
//     );
// };

import { Button, Grid } from '@mui/material';
import React, { useState } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

const ItemTypes = {
    FIELD: 'field',
    GROUP: 'group',
};

let idCounter = 5;
const generateId = () => `item-${idCounter++}`;
const MainItemWrapper = ({ item, index, moveField, moveGroup, children }) => {
    const ref = React.useRef(null);

    const [, drop] = useDrop({
        accept: [ItemTypes.FIELD, ItemTypes.GROUP],
        hover(dragItem, monitor) {
            if (!ref.current || dragItem.id === item.id) return;

            const hoverIndex = index;
            const dragIndex = dragItem.index;

            if (dragIndex === hoverIndex && !dragItem.parentId) return;

            if (dragItem.type === 'field' && !dragItem.parentId) {
                moveField(dragItem, hoverIndex, null);
                dragItem.index = hoverIndex;
            }

            if (dragItem.type === 'group') {
                moveGroup(dragItem, hoverIndex);
                dragItem.index = hoverIndex;
            }
        },
    });

    drop(ref);

    return <div ref={ref}>{children}</div>;
};

const Field = ({ field, onDrop, index, parentId }) => {
    const ref = React.useRef(null);

    const [, drop] = useDrop({
        accept: ItemTypes.FIELD,
        hover(item, monitor) {
            if (!ref.current || item.id === field.id) return;

            const dragIndex = item.index;
            const hoverIndex = index;

            if (dragIndex === hoverIndex && item.parentId === parentId) return;

            onDrop(item, hoverIndex, parentId);
            item.index = hoverIndex;
            item.parentId = parentId;
        },
    });

    const [{ isDragging }, drag] = useDrag({
        type: ItemTypes.FIELD,
        item: { ...field, index, parentId },
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    });

    drag(drop(ref));

    return (
        <div
            ref={ref}
            style={{
                opacity: isDragging ? 0.4 : 1,
                padding: 8,
                margin: 4,
                background: '#f5f5f5',
                border: '1px solid #aaa',
                borderRadius: 4,
            }}
        >
            {field.content}
        </div>
    );
};

const Group = ({ group, onDrop, index, moveField }) => {
    const ref = React.useRef(null);

    const [, drop] = useDrop({
        accept: [ItemTypes.GROUP, ItemTypes.FIELD],
        hover(item, monitor) {
            if (!ref.current || item.id === group.id) return;

            const dragIndex = item.index;
            const hoverIndex = index;

            // Handle group reordering
            if (item.type === 'group' && dragIndex !== hoverIndex) {
                onDrop(item, hoverIndex);
                item.index = hoverIndex;
            }

            // Handle field dropping into an empty group
            if (item.type === 'field' && group.items.length === 0 && item.parentId !== group.id) {
                moveField(item, 0, group.id);
                item.index = 0;
                item.parentId = group.id;
            }
        },
    });

    const [{ isDragging }, drag] = useDrag({
        type: ItemTypes.GROUP,
        item: { ...group, index },
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    });

    drag(drop(ref));

    return (
        <div
            ref={ref}
            style={{
                margin: 8,
                padding: 8,
                background: '#e0e0e0',
                border: '2px solid #888',
                borderRadius: 6,
                opacity: isDragging ? 0.4 : 1,
                minHeight: '200px',
            }}
        >
            <strong>Group:</strong>
            {group.items.length === 0 ? (
                <div style={{ padding: 8, color: '#777', fontStyle: 'italic' }}>Drop a field here</div>
            ) : (
                group.items.map((field, idx) => (
                    <Field
                        key={field.id}
                        field={field}
                        index={idx}
                        parentId={group.id}
                        onDrop={(item, toIndex, toGroupId) => {
                            moveField(item, toIndex, toGroupId);
                        }}
                    />
                ))
            )}
        </div>
    );
};

const StructureEditor = () => {
    const [structure, setStructure] = useState([
        { id: 'item-1', type: 'field', content: 'Field A' },
        {
            id: 'group-1',
            type: 'group',
            items: [{ id: 'item-2', type: 'field', content: 'Field B' }],
        },
        { id: 'item-3', type: 'field', content: 'Field C' },
        {
            id: 'group-2',
            type: 'group',
            items: [
                { id: 'item-5', type: 'field', content: 'Field E' },
                { id: 'item-6', type: 'field', content: 'Field F' },
            ],
        },
        { id: 'item-4', type: 'field', content: 'Field D' },
    ]);

    const moveField = (item, toIndex, toGroupId = null) => {
        setStructure((prevStructure) => {
            const newStructure = [...prevStructure];
            let movedItem;
            console.log({ item, toIndex, toGroupId });

            // Remove from original location
            if (item.parentId) {
                const fromGroupIndex = newStructure.findIndex((el) => el.id === item.parentId);
                const fromGroup = newStructure[fromGroupIndex];
                const itemIndex = fromGroup.items.findIndex((el) => el.id === item.id);
                console.log({ itemIndex });

                movedItem = fromGroup.items.splice(itemIndex, 1)[0];
            } else {
                const itemIndex = newStructure.findIndex((el) => el.id === item.id);
                movedItem = newStructure.splice(itemIndex, 1)[0];
            }

            // Add to new location
            if (toGroupId) {
                const toGroupIndex = newStructure.findIndex((el) => el.id === toGroupId);
                newStructure[toGroupIndex].items.splice(toIndex, 0, movedItem);
            } else {
                // Add the item to the exact position it was dropped in the main area
                newStructure.splice(toIndex, 0, movedItem);
            }

            return newStructure;
        });
    };
    const moveGroup = (group, toIndex) => {
        setStructure((prevStructure) => {
            const newStructure = [...prevStructure];

            // Remove the group from its original position
            const groupIndex = newStructure.findIndex((el) => el.id === group.id);
            const movedGroup = newStructure.splice(groupIndex, 1)[0];

            // Insert the group at the new index
            newStructure.splice(toIndex, 0, movedGroup);
            console.log({ toIndex, movedGroup });

            return newStructure;
        });
    };

    const [, drop] = useDrop({
        accept: [ItemTypes.FIELD, ItemTypes.GROUP],
        drop: (item, monitor) => {
            if (monitor.didDrop()) return;

            // Calculate the correct index to drop at based on the position in the main area
            const dropIndex = structure.findIndex((el) => el.id === item.id);

            if (item.type === 'field') {
                moveField(item, dropIndex, null); // Move field to the new index
            } else if (item.type === 'group') {
                moveGroup(item, dropIndex); // Move the group to the new index
            }
        },
    });

    const addField = () => {
        const newField = {
            id: generateId(),
            type: 'field',
            content: `Field ${String.fromCharCode(65 + idCounter - 5)}`,
        };
        setStructure((s) => [...s, newField]);
    };

    const addGroup = () => {
        const newGroup = {
            id: `group-${idCounter++}`,
            type: 'group',
            items: [],
        };
        setStructure((s) => [...s, newGroup]);
    };

    return (
        <Grid>
            <Grid style={{ marginBottom: 10 }}>
                <Button onClick={addField} style={{ marginRight: 8 }}>
                    ➕ Add Field
                </Button>
                <Button onClick={addGroup}>📦 Add Group</Button>
            </Grid>

            <Grid
                ref={drop}
                style={{
                    border: '2px dashed #aaa',
                    padding: 30,
                    margin: 10,
                    borderRadius: 8,
                    minHeight: 100,
                    display: 'flex',
                    flexDirection: 'column',
                    minWidth: '500px',
                }}
            >
                <Grid padding={2}>
                    <strong>Main Area</strong>
                </Grid>
                {structure.map((item, idx) => (
                    <MainItemWrapper key={item.id} item={item} index={idx} moveField={moveField} moveGroup={moveGroup}>
                        {item.type === 'group' ? (
                            <Group group={item} onDrop={moveGroup} index={idx} moveField={moveField} />
                        ) : (
                            <Field field={item} index={idx} parentId={null} onDrop={moveField} />
                        )}
                    </MainItemWrapper>
                ))}
            </Grid>
        </Grid>
    );
};

export const ManualDndLayout = () => {
    // return (
    //     <DndProvider backend={HTML5Backend}>
    //         <h3 style={{ padding: '10px' }}>Drag & Drop Fields and Groups</h3>
    //         <StructureEditor />
    //     </DndProvider>
    // );
    return (
        <DndProvider backend={HTML5Backend}>
            <StructureEditor />
        </DndProvider>
    );
};
