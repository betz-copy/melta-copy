// import React, { useState } from 'react';
// import { DndContext, closestCenter, useSensor, useSensors, PointerSensor, DragOverlay, useDroppable } from '@dnd-kit/core';
// import { arrayMove, SortableContext, useSortable, rectSortingStrategy } from '@dnd-kit/sortable';
// import { CSS } from '@dnd-kit/utilities';

// const initialItems = [
//     { id: 'field-1', type: 'field' },
//     {
//         id: 'group-1',
//         type: 'group',
//         children: [
//             { id: 'field-2', type: 'field' },
//             { id: 'field-3', type: 'field' },
//         ],
//     },
//     { id: 'field-4', type: 'field' },
// ];

// const SortableItem = ({ id }) => {
//     const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

//     const style = {
//         padding: '8px',
//         margin: '4px 0',
//         background: '#eee',
//         border: '1px solid #ccc',
//         transform: CSS.Transform.toString(transform),
//         transition,
//     };

//     return (
//         <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
//             {id}
//         </div>
//     );
// };

// export const NestedDnD = () => {
//     const [items, setItems] = useState(initialItems);
//     const [activeId1, setActiveId] = useState(null);

//     const sensors = useSensors(useSensor(PointerSensor));

//     const findContainer = (id) => {
//         for (const item of items) {
//             if (item.id === id) return null; // top level
//             if (item.type === 'group') {
//                 if (item.children.find((c) => c.id === id)) {
//                     return item.id;
//                 }
//             }
//         }
//         return null;
//     };

//     const handleDragStart = (event) => {
//         setActiveId(event.active.id);
//     };

//     const handleDragEnd = (event) => {
//         const { active, over } = event;
//         if (!over) {
//             setActiveId(null);
//             return;
//         }

//         const activeId = active.id;
//         const overId = over.id;

//         const activeContainerId = findContainer(activeId);
//         const overContainerId = findContainer(overId);

//         if (activeContainerId === overContainerId) {
//             if (!activeContainerId) {
//                 // top-level reorder
//                 const oldIndex = items.findIndex((item) => item.id === activeId);
//                 const newIndex = items.findIndex((item) => item.id === overId);
//                 setItems(arrayMove(items, oldIndex, newIndex));
//             } else {
//                 // reorder within group
//                 const group = items.find((g) => g.id === activeContainerId);
//                 const oldIndex = group?.children?.findIndex((i) => i.id === activeId);
//                 const newIndex = group?.children?.findIndex((i) => i.id === overId);
//                 const newChildren = arrayMove(group?.children || [], oldIndex || 0, newIndex || 0);
//                 setItems((prev) => prev.map((item) => (item.id === group?.id ? { ...item, children: newChildren } : item)));
//             }
//         } else {
//             // move between containers
//             const moveItem = (sourceId, destId) => {
//                 const itemToMove =
//                     sourceId === null
//                         ? items.find((i) => i.id === activeId)
//                         : items.find((g) => g.id === sourceId)?.children?.find((c) => c.id === activeId);

//                 if (!itemToMove) return;

//                 setItems((prev) => {
//                     const updated = [...prev];

//                     if (sourceId === null) {
//                         const index = updated.findIndex((i) => i.id === activeId);
//                         updated.splice(index, 1);
//                     } else {
//                         const group = updated.find((g) => g.id === sourceId);
//                         group.children = group?.children?.filter((c) => c.id !== activeId);
//                     }

//                     if (destId === null) {
//                         updated.push(itemToMove);
//                     } else {
//                         const destGroup = updated.find((g) => g.id === destId);
//                         destGroup.children.push(itemToMove);
//                     }

//                     return updated;
//                 });
//             };

//             moveItem(activeContainerId, overContainerId);
//         }

//         setActiveId(null);
//     };

//     return (
//         <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
//             <SortableContext items={items.map((i) => i.id)} strategy={rectSortingStrategy}>
//                 {items.map((item) => (item.type === 'field' ? <SortableItem key={item.id} id={item.id} /> : <Group key={item.id} group={item} />))}
//             </SortableContext>

//             <DragOverlay>{activeId1 ? <div className="drag-preview">{activeId1}</div> : null}</DragOverlay>
//         </DndContext>
//     );
// };

// const Group = ({ group }) => {
//     const { attributes, listeners, setNodeRef: setDraggableRef, transform, transition } = useSortable({ id: group.id });

//     const { isOver, setNodeRef: setDroppableRef } = useDroppable({ id: group.id });

//     const style = {
//         margin: '8px 0',
//         border: '2px dashed #666',
//         padding: '8px',
//         background: isOver ? '#d0f0ff' : '#f9f9f9',
//         transform: CSS.Transform.toString(transform),
//         transition,
//     };

//     const setRefs = (node) => {
//         setDraggableRef(node);
//         setDroppableRef(node);
//     };

//     return (
//         <div ref={setRefs} style={style} {...attributes} {...listeners}>
//             <strong>{group.id}</strong>
//             <SortableContext items={group.children.map((i) => i.id)} strategy={rectSortingStrategy}>
//                 <div style={{ paddingLeft: '10px' }}>
//                     {group.children.map((child) => (
//                         <SortableItem key={child.id} id={child.id} />
//                     ))}
//                 </div>
//             </SortableContext>
//         </div>
//     );
// };
