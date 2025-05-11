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

import { AccordionDetails, AccordionSummary, Box, Button, Grid, IconButton, TextField, Typography } from '@mui/material';
import React, { SetStateAction, useCallback, useEffect, useRef, useState } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { FieldArray } from 'formik';
import { DragHandle as DragHandleIcon, ExpandMore as ExpandMoreIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { _debounce } from '@ag-grid-community/core';
import i18next from 'i18next';
import { v4 as uuid } from 'uuid';
import { FieldBlockAccordion, FieldBlockProps } from './FieldBlock';
import { CommonFormInputProperties, FieldCommonFormInputProperties, GroupCommonFormInputProperties, PropertyItem } from './commonInterfaces';
import { MemoAttachmentEditCard } from './AttachmentEditCard';
import { MemoFieldEditCard } from './FieldEditCard';
import { FieldEditCardProps } from './RelationshipReferenceField';
import { MeltaTooltip } from '../../MeltaTooltip';
import { AreYouSureDialog } from '../../dialogs/AreYouSureDialog';

const ItemTypes = {
    FIELD: 'field',
    GROUP: 'group',
};

let idCounter = 5;
const generateId = () => `item-${idCounter++}`;
// const MainItemWrapper = ({ item, index, moveField, moveGroup, children }) => {
//     const ref = React.useRef(null);

//     const [, drop] = useDrop({
//         accept: [ItemTypes.FIELD, ItemTypes.GROUP],
//         hover(dragItem, monitor) {
//             if (!ref.current || dragItem.id === item.id) return;

//             const hoverIndex = index;
//             const dragIndex = dragItem.index;

//             if (dragIndex === hoverIndex && !dragItem.parentId) return;

//             if (dragItem.type === 'field' && !dragItem.parentId) {
//                 moveField(dragItem, hoverIndex, null);
//                 dragItem.index = hoverIndex;
//             }

//             if (dragItem.type === 'group') {
//                 moveGroup(dragItem, hoverIndex);
//                 dragItem.index = hoverIndex;
//             }
//         },
//     });

//     drop(ref);

//     return <div ref={ref}>{children}</div>;
// };
const Attachment = ({ field, index, buildProps, onDrop, parentId }) => {
    const ref = React.useRef(null);

    const [, drop] = useDrop({
        accept: ItemTypes.FIELD,
        hover(item, monitor) {
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
        item: { ...field, index },
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    });

    drag(drop(ref));

    return <MemoAttachmentEditCard {...buildProps} refDragAndDrop={ref} key={field.id} />;
};

const Field = ({ field, onDrop, index, parentId, buildProps, setFieldValue, setValues, uniqueConstraints, setUniqueConstraints }) => {
    const ref = React.useRef(null);

    const [, drop] = useDrop({
        accept: ItemTypes.FIELD,
        hover(item, monitor) {
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
    console.log({ field, ref });

    return (
        <MemoFieldEditCard
            {...buildProps}
            refDragAndDrop={ref}
            key={field.id}
            setFieldValue={setFieldValue}
            setValues={setValues}
            uniqueConstraints={uniqueConstraints}
            setUniqueConstraints={setUniqueConstraints}
        />
    );
};

const Group = ({
    group,
    onDrop,
    index,
    moveField,
    touched,
    errors,
    propertiesType,
    onChangeGroupData,
    remove,
    uniqueConstraints,
    setUniqueConstraints,
    setFieldDisplayValueWrapper,
    setDisplayValueWrapper,
    buildProps,
    addFieldToGroup,
    addPropertyButtonLabel,
}) => {
    const ref = React.useRef(null);

    const [, drop] = useDrop({
        accept: [ItemTypes.GROUP, ItemTypes.FIELD],
        hover(item, monitor) {
            if (!ref.current || item.id === group.id) return;

            const dragIndex = item.index;
            const hoverIndex = index;

            // console.log('hover a group', { item, group }, { dragIndex, hoverIndex });
            // Handle group reordering
            if (item.type === 'group' && dragIndex !== hoverIndex) {
                console.log('move group!!!');

                onDrop(item, hoverIndex);
                item.index = hoverIndex;
            }

            // Handle field dropping into an empty group
            if (group.fields.length === 0 && item.parentId !== group.id) {
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
    const groupName = `properties[${index}].name`;
    const touchedName = touched?.[propertiesType]?.[index]?.name;
    const errorName = errors?.[propertiesType]?.[index]?.name;
    const displayName = `properties[${index}].displayName`;
    const touchedTitle = touched?.[propertiesType]?.[index]?.displayName;
    const errorTitle = errors?.[propertiesType]?.[index]?.displayName;

    return (
        <FieldBlockAccordion
            ref={ref}
            sx={{
                padding: '0.5rem',
                backgroundColor: 'rgb(224, 225, 237,0.4)',
                marginTop: 1.5,
                marginBottom: 1.5,
            }}
        >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Grid container wrap="nowrap">
                    <Box style={{ display: 'flex', alignItems: 'center' }}>
                        <DragHandleIcon fontSize="large" />
                    </Box>

                    <TextField
                        label={i18next.t('wizard.entityTemplate.groupName')}
                        id={groupName}
                        name={groupName}
                        value={group.name ?? ''}
                        onChange={(e) => onChangeGroupData(e, group.id)}
                        error={touchedName && Boolean(errorName)}
                        helperText={touchedName && errorName}
                        sx={{ marginRight: '6px' }}
                        fullWidth
                        onClick={(e) => e.stopPropagation()}
                    />
                    <TextField
                        label={i18next.t('wizard.entityTemplate.groupDisplayName')}
                        id={displayName}
                        name={displayName}
                        value={group.displayName ?? ''}
                        onChange={(e) => onChangeGroupData(e, group.id)}
                        error={touchedTitle && Boolean(errorTitle)}
                        helperText={touchedTitle && errorTitle}
                        sx={{ marginRight: '6px' }}
                        fullWidth
                        onClick={(e) => e.stopPropagation()}
                    />

                    <MeltaTooltip
                        title={
                            group.fields.length > 0
                                ? i18next.t('wizard.entityTemplate.cantDeleteGroupWithFields')
                                : i18next.t('wizard.entityTemplate.deleteGroup')
                        }
                    >
                        <Grid>
                            <IconButton onClick={() => remove(index, true)} disabled={group.fields.length > 0}>
                                <DeleteIcon />
                            </IconButton>
                        </Grid>
                    </MeltaTooltip>
                </Grid>
            </AccordionSummary>

            <AccordionDetails ref={drop}>
                {group.fields.length === 0 ? (
                    <div style={{ padding: 8, color: '#777', fontStyle: 'italic', minHeight: '100px' }}>Drop a field here</div>
                ) : (
                    group.fields.map((field, idx) => (
                        <Field
                            field={field}
                            index={idx}
                            parentId={group.id}
                            onDrop={moveField}
                            buildProps={{ ...buildProps(field, idx, index) }}
                            key={field.id}
                            setFieldValue={setFieldDisplayValueWrapper(idx, index) as FieldEditCardProps['setFieldValue']}
                            setValues={setDisplayValueWrapper(idx, group.id)}
                            uniqueConstraints={uniqueConstraints}
                            setUniqueConstraints={setUniqueConstraints}
                        />
                    ))
                )}

                <Grid
                    sx={{
                        display: 'flex',
                        justifyContent: 'center',
                    }}
                >
                    <Button
                        type="button"
                        variant="contained"
                        style={{
                            margin: '8px',
                            display: 'flex',
                            justifyContent: 'center',
                        }}
                        onClick={() => {
                            if (group.id !== '') addFieldToGroup(group);
                        }}
                    >
                        <Typography>{addPropertyButtonLabel}</Typography>
                    </Button>
                </Grid>
                {errors?.[propertiesType]?.[index]?.fields === i18next.t('validation.oneField') && (
                    <div style={{ color: '#d32f2f' }}>{i18next.t('validation.oneField')}</div>
                )}
            </AccordionDetails>
        </FieldBlockAccordion>
        // </div>
    );
};

export const StructureEditor = <PropertiesType extends string, Values extends Record<PropertiesType, CommonFormInputProperties[]>>({
    propertiesType,
    values,
    uniqueConstraints,
    setUniqueConstraints,
    initialValues,
    setFieldValue,
    areThereAnyInstances,
    isEditMode,
    setBlock,
    title,
    addPropertyButtonLabel,
    touched,
    errors,
    supportSerialNumberType,
    supportUserType,
    supportEntityReferenceType,
    supportChangeToRequiredWithInstances,
    supportArrayFields,
    supportDeleteForExistingInstances,
    supportRelationshipReference,
    supportEditEnum,
    supportUnique,
    supportLocation,
    supportArchive,
    locationSearchFields,
    supportIdentifier,
    hasIdentifier,
    supportAddFieldButton = true,
    hasActions,
    draggable = { isDraggable: false },
    initialFieldCardDataOnAdd = {
        name: '',
        title: '',
        type: '',
        required: false,
        preview: false,
        hide: false,
        groupName: undefined,
        uniqueCheckbox: false,
        options: [],
        optionColors: {},
        pattern: '',
        patternCustomErrorMessage: '',
        dateNotification: undefined,
        calculateTime: undefined,
        relationshipReference: undefined,
        serialStarter: 0,
        archive: false,
        mapSearch: false,
    },
    supportConvertingToMultipleFields = true,
}: React.PropsWithChildren<FieldBlockProps<PropertiesType, Values>>) => {
    // copy of values of formik in order to show changes on inputs fast (formik rerenders are slow)
    const [showAreUSureDialogForRemoveProperty, setShowAreUSureDialogForRemoveProperty] = useState(false);
    const [selectedIndexToRemove, setSelectedIndexToRemove] = useState<{ index: number; groupIndex?: number }>({
        index: -1,
        groupIndex: -1,
    });

    // using ordered item ref because update functions (push/remove/...) are not updated for the field cards on
    // every re-render and if displayValues changes, it does not update in the functions of the field cards.
    // therefore using a reference for them to always use the current orderedItems.

    const [orderedItems, setOrderedItems] = useState(values[propertiesType]);
    const orderedItemsRef = useRef(orderedItems);
    orderedItemsRef.current = orderedItems;

    useEffect(() => {
        setFieldValue(propertiesType, orderedItems);
        console.log({ orderedItems });
    }, []);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const updateFormikDebounced = useCallback(
        _debounce(() => {
            setFieldValue(propertiesType, [...orderedItemsRef.current], true);
            setBlock(false);
        }, 1000),
        [],
    );

    const updateFormik = () => {
        setBlock(true);
        updateFormikDebounced();
    };

    const setFieldDisplayValue = (index: number, field: keyof Values, value: any, groupIndex?: number) => {
        const displayValuesCopy: any = [...orderedItemsRef.current];

        if (groupIndex !== undefined) {
            const group = displayValuesCopy[groupIndex];

            if (group === -1) return;

            group.fields = group.fields.map((fieldData: any, i: number) => (i === index ? { ...fieldData, [field]: value } : fieldData));
        } else {
            displayValuesCopy[index] = {
                ...displayValuesCopy[index],
                data: {
                    ...displayValuesCopy[index].data,
                    [field]: value,
                },
            };
        }
        setOrderedItems(displayValuesCopy);
        updateFormik();
    };

    const onDeleteSure = () => {
        setShowAreUSureDialogForRemoveProperty(false);
        setFieldDisplayValue(selectedIndexToRemove.index, 'deleted' as keyof Values, true, selectedIndexToRemove.groupIndex);
    };

    const push = (properties) => {
        const updatedItems = [...orderedItemsRef.current, properties];
        // console.log({ updatedItems });

        setOrderedItems(updatedItems);
        updateFormik();
    };

    const remove = (index: number, isNewProperty: Boolean, groupIndex?: number) => {
        const displayValuesCopy = [...orderedItemsRef.current];

        const isDeleted = groupIndex ? displayValuesCopy[groupIndex].fields[index].deleted : displayValuesCopy[index].deleted;

        if (isDeleted) {
            setFieldDisplayValue(index, 'deleted' as keyof Values, false, groupIndex);
        } else if (areThereAnyInstances && !isNewProperty) {
            setShowAreUSureDialogForRemoveProperty(true);
            setSelectedIndexToRemove({ index, groupIndex });
        } else {
            if (groupIndex) {
                const group = displayValuesCopy[groupIndex];
                if (group === -1) return;
                group.fields.splice(index, 1);
            } else displayValuesCopy.splice(index, 1);

            setOrderedItems(displayValuesCopy);
            updateFormik();
        }
    };

    const setDisplayValue = (
        index: number,
        valueOrFunc: SetStateAction<FieldCommonFormInputProperties | GroupCommonFormInputProperties>,
        groupId?: string,
    ) => {
        const displayValuesCopy: any = [...orderedItemsRef.current];

        if (groupId) {
            console.log({ groupId });

            const group = displayValuesCopy.find((val) => val.type === 'group' && val.id === groupId);
            if (!group) return;

            const updatedField = typeof valueOrFunc === 'function' ? valueOrFunc(group.fields[index]) : valueOrFunc;
            group.fields[index] = updatedField;
        } else {
            const updatedValue =
                typeof valueOrFunc === 'function' ? valueOrFunc(displayValuesCopy[index] as FieldCommonFormInputProperties) : valueOrFunc;
            displayValuesCopy[index] = updatedValue;
        }
        setOrderedItems(displayValuesCopy);
        updateFormik();
    };

    const onChange = (index: number, event: React.ChangeEvent<HTMLInputElement>, groupIndex?: number) => {
        const inputName = event.target.name.split('.')[1]; // the input name is in the format `properties[index].field`
        const inputValue = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
        setFieldDisplayValue(index, inputName as keyof Values, inputValue, groupIndex);
    };

    const onChangeGroupData = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, groupId: string) => {
        const inputName = event.target.name.split('.')[1];
        const inputValue = event.target.type === 'checkbox' && event.target instanceof HTMLInputElement ? event.target.checked : event.target.value;

        const displayValuesCopy = [...orderedItemsRef.current];

        const groupIndex = displayValuesCopy.findIndex((value) => value.type === 'group' && value.id === groupId);

        if (groupIndex === -1) return;

        const oldGroup = displayValuesCopy[groupIndex];

        const updatedGroup = {
            ...oldGroup,
            [inputName]: inputValue,
            fields: oldGroup.fields.map((field: CommonFormInputProperties) => ({
                ...field,
                fieldGroup: {
                    ...field.fieldGroup,
                    [inputName]: inputValue,
                },
            })),
        };

        displayValuesCopy[groupIndex] = updatedGroup;

        setOrderedItems(displayValuesCopy);
        updateFormik();
    };

    const onChangeWrapper = (index: number, groupIndex?: number) => (event: React.ChangeEvent<HTMLInputElement>) =>
        onChange(index, event, groupIndex);

    const setFieldDisplayValueWrapper = (index: number, groupIndex?: number) => (field: keyof Values, value: any) =>
        setFieldDisplayValue(index, field, value, groupIndex);
    const setDisplayValueWrapper = (index: number, groupId?: string) => (value: SetStateAction<PropertyItem>) =>
        setDisplayValue(index, value, groupId);
    const isFieldBlockError = Boolean(touched?.[propertiesType]) && Boolean(errors?.[propertiesType]);
    console.log({ errors });

    const buildProps = (propertyProp, index: number, groupIndex?: number) => {
        const isGroup = groupIndex !== undefined;
        const currentTypeValues = initialValues?.[propertiesType]; // as ValueWrapper[] | undefined;
        let error;
        let touch;

        const getTouchedOrError = (obj: any) => {
            return isGroup ? obj?.[propertiesType]?.[groupIndex]?.fields?.[index] : obj?.[propertiesType]?.[index]?.data;
        };

        const findInitialValue = (): any => {
            error = getTouchedOrError(errors);
            touch = getTouchedOrError(touched);
            const directField = currentTypeValues?.find((item) => item.type === 'field' && item.data?.id === propertyProp.id);
            if (directField) return directField;

            const group = currentTypeValues?.find((item) => item.type === 'group' && item.fields?.some((f) => f.id === propertyProp.id));
            if (group) {
                return {
                    data: group.fields?.find((f) => f.id === propertyProp.id),
                };
            }

            return undefined;
        };

        const initialVal = findInitialValue();

        return {
            entity: (values as any).displayName,
            value: propertyProp,
            index,
            isEditMode,
            initialValue: initialVal?.data,
            areThereAnyInstances,
            touched: touch,
            errors: error,
            remove,
            onChange: onChangeWrapper(index, groupIndex),
            supportSerialNumberType,
            supportUserType,
            supportEntityReferenceType,
            supportChangeToRequiredWithInstances,
            templateId: (values as any)._id,
            supportArrayFields,
            supportDeleteForExistingInstances,
            supportEditEnum,
            supportRelationshipReference,
            supportUnique,
            supportLocation,
            supportArchive,
            supportIdentifier,
            hasIdentifier,
            locationSearchFields,
            hasActions,
            supportConvertingToMultipleFields,
            groupIndex,
        };
    };

    const addFieldToGroup = (item) => {
        const { name, displayName, id } = item;
        const displayValuesCopy = [...orderedItemsRef.current];

        const newField = { ...initialFieldCardDataOnAdd, id: uuid(), fieldGroup: { name, displayName, id } };

        const group = displayValuesCopy.find((val) => val.type === 'group' && val.id === id);

        if (group === -1) return;

        group.fields = [...group.fields, newField];

        setOrderedItems(displayValuesCopy);

        updateFormik();
    };
    const moveField = (item, toIndex: number, toGroupId: string | null) => {
        const orderedItemsCopy = [...orderedItemsRef.current];
        let movedField: any = null;

        if (item.fieldGroup) {
            const fromGroupIndex = orderedItemsCopy.findIndex((el) => el.type === 'group' && el.id === item.fieldGroup.id);
            if (fromGroupIndex === -1) return;

            const fromGroup = orderedItemsCopy[fromGroupIndex];
            const fieldIndex = fromGroup.fields.findIndex((f) => f.id === item.id);
            if (fieldIndex === -1) return;

            movedField = fromGroup.fields.splice(fieldIndex, 1)[0];
        } else {
            const index = orderedItemsCopy.findIndex((el) => el.type === 'field' && el.data.id === item.id);
            console.log({ index, toGroupId });

            if (index === -1) return;

            movedField = orderedItemsCopy.splice(index, 1)[0].data;
        }

        if (toGroupId) {
            const toGroupIndex = orderedItemsCopy.findIndex((el) => el.type === 'group' && el.id === toGroupId);
            if (toGroupIndex === -1) return;

            orderedItemsCopy[toGroupIndex].fields.splice(toIndex, 0, {
                ...movedField,
                fieldGroup: { name: orderedItemsCopy[toGroupIndex].name, displayName: orderedItemsCopy[toGroupIndex].displayName, id: toGroupId },
            });
        } else {
            const { fieldGroup, ...movedGroupData } = movedField;
            orderedItemsCopy.splice(toIndex, 0, { type: 'field', data: movedGroupData });
        }

        setOrderedItems(orderedItemsCopy);
        updateFormik();
    };
    const moveGroup = (group, toIndex: number, toGroupId: string | null = null) => {
        if (toGroupId) {
            console.warn('Groups cannot be moved into other groups.');
            return;
        }

        const orderedItemsCopy = [...orderedItemsRef.current];
        const fromIndex = orderedItemsCopy.findIndex((el) => el.type === 'group' && el.id === group.id);
        if (fromIndex === -1) return;

        const movedGroup = orderedItemsCopy.splice(fromIndex, 1)[0];
        orderedItemsCopy.splice(toIndex, 0, movedGroup);

        setOrderedItems(orderedItemsCopy);
        updateFormik();
    };

    const [, drop] = useDrop(() => ({
        accept: [ItemTypes.FIELD, ItemTypes.GROUP],
        drop: (item: any, monitor) => {
            console.log(0, { monitor });
            if (monitor.didDrop()) return;
            console.log(1, item);

            // Detect if it's a group (has `fields` array) or a single field (pure property)
            const isGroup = Array.isArray(item.fields);
            console.log(2, isGroup);

            const dropIndex = orderedItems.findIndex((el) => {
                if (isGroup) return el.id === item.id;
                return el.type === 'field' && el.data.id === item.id;
            });
            console.log(3, dropIndex);

            if (isGroup) {
                console.log(4);
                moveGroup(item, dropIndex, null);
            } else {
                console.log(5);

                const toGroupId = null; // dropping into main area
                moveField(item, dropIndex, toGroupId);
            }
        },
        collect: (m) => ({
            isOver: m.isOver({ shallow: true }),
        }),
    }));
    // drop(ref);
    return (
        <FieldBlockAccordion style={{ border: isFieldBlockError ? '1px solid red' : '' }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Grid container wrap="nowrap" alignItems="center">
                    {draggable.isDraggable && (
                        <Box {...draggable.dragHandleProps} style={{ display: 'flex', alignItems: 'center' }}>
                            <DragHandleIcon fontSize="large" />
                        </Box>
                    )}
                    <Typography>{title}</Typography>
                </Grid>
            </AccordionSummary>

            <AccordionDetails>
                <FieldArray name={propertiesType} key={propertiesType}>
                    {() => (
                        <Grid>
                            <div
                                key={propertiesType}
                                ref={drop}
                                style={{
                                    margin: 10,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    minWidth: '500px',
                                    backgroundColor: 'pink',
                                }}
                            >
                                {orderedItems.map((item, index) => {
                                    if (
                                        propertiesType === 'properties' ||
                                        propertiesType === 'detailsProperties' ||
                                        propertiesType === 'archiveProperties'
                                    )
                                        return (
                                            <Box key={item.type === 'group' ? item.id : item.data.id}>
                                                {item.type === 'group' ? (
                                                    <Group
                                                        group={item}
                                                        onDrop={moveGroup}
                                                        index={index}
                                                        moveField={moveField}
                                                        errors={errors}
                                                        propertiesType={propertiesType}
                                                        touched={touched}
                                                        onChangeGroupData={onChangeGroupData}
                                                        remove={remove}
                                                        setDisplayValueWrapper={setDisplayValueWrapper}
                                                        setFieldDisplayValueWrapper={setFieldDisplayValueWrapper}
                                                        setUniqueConstraints={setUniqueConstraints}
                                                        uniqueConstraints={uniqueConstraints}
                                                        buildProps={buildProps}
                                                        addFieldToGroup={addFieldToGroup}
                                                        addPropertyButtonLabel={addPropertyButtonLabel}
                                                    />
                                                ) : (
                                                    <Field
                                                        field={item.data}
                                                        index={index}
                                                        parentId={null}
                                                        onDrop={moveField}
                                                        buildProps={{ ...buildProps(item.data, index) }}
                                                        key={item.data.id}
                                                        setFieldValue={setFieldDisplayValueWrapper(index) as FieldEditCardProps['setFieldValue']}
                                                        setValues={setDisplayValueWrapper(index)}
                                                        uniqueConstraints={uniqueConstraints}
                                                        setUniqueConstraints={setUniqueConstraints}
                                                    />
                                                )}
                                            </Box>
                                        );
                                    // return undefined;
                                    return (
                                        <Attachment
                                            key={item.data.id}
                                            field={item.data}
                                            parentId={null}
                                            index={index}
                                            buildProps={{ ...buildProps(item.data, index) }}
                                            onDrop={moveField}
                                        />
                                    );
                                })}
                                {supportAddFieldButton && (
                                    <Grid
                                        sx={{
                                            display: 'flex',
                                            justifyContent: 'center',
                                            paddingTop: '5px',
                                        }}
                                    >
                                        <Button
                                            style={{ margin: '8px' }}
                                            type="button"
                                            variant="contained"
                                            onClick={() => push({ type: 'field', data: { id: uuid(), ...initialFieldCardDataOnAdd } })}
                                        >
                                            <Typography>{addPropertyButtonLabel}</Typography>
                                        </Button>
                                        {(propertiesType === 'properties' ||
                                            propertiesType === 'detailsProperties' ||
                                            propertiesType === 'archiveProperties') && (
                                            <Button
                                                type="button"
                                                variant="contained"
                                                style={{ margin: '8px' }}
                                                onClick={() =>
                                                    push({
                                                        type: 'group',
                                                        id: uuid(),
                                                        name: '',
                                                        displayName: '',
                                                        fields: [],
                                                    })
                                                }
                                            >
                                                <Typography>צור קבוצה</Typography>
                                            </Button>
                                        )}
                                    </Grid>
                                )}
                            </div>
                        </Grid>
                    )}
                </FieldArray>
            </AccordionDetails>
            <AreYouSureDialog
                open={showAreUSureDialogForRemoveProperty}
                handleClose={() => setShowAreUSureDialogForRemoveProperty(false)}
                title={i18next.t('systemManagement.deleteField')}
                body={`${i18next.t('systemManagement.warningOnDeleteField')}
                                ${
                                    selectedIndexToRemove.index > -1 &&
                                    (selectedIndexToRemove.groupIndex
                                        ? orderedItemsRef.current[selectedIndexToRemove.groupIndex].fields[selectedIndexToRemove.index].title
                                        : orderedItemsRef.current[selectedIndexToRemove.index].data.title)
                                }
                                ${i18next.t('systemManagement.continueWarningOnDeleteField')} ${
                    (initialValues as unknown as IMongoEntityTemplatePopulated)?.displayName
                }`}
                onYes={onDeleteSure}
            />
        </FieldBlockAccordion>
    );
};

export const ManualDndLayout = <PropertiesType extends string, Values extends Record<PropertiesType, CommonFormInputProperties[]>>({
    propertiesType,
    values,
    uniqueConstraints,
    setUniqueConstraints,
    initialValues,
    setFieldValue,
    areThereAnyInstances,
    isEditMode,
    setBlock,
    title,
    addPropertyButtonLabel,
    touched,
    errors,
    supportSerialNumberType,
    supportUserType,
    supportEntityReferenceType,
    supportChangeToRequiredWithInstances,
    supportArrayFields,
    supportDeleteForExistingInstances,
    supportRelationshipReference,
    supportEditEnum,
    supportUnique,
    supportLocation,
    supportArchive,
    locationSearchFields,
    supportIdentifier,
    hasIdentifier,
    supportAddFieldButton = true,
    hasActions,
    draggable = { isDraggable: false },
    initialFieldCardDataOnAdd = {
        name: '',
        title: '',
        type: '',
        required: false,
        preview: false,
        hide: false,
        groupName: undefined,
        uniqueCheckbox: false,
        options: [],
        optionColors: {},
        pattern: '',
        patternCustomErrorMessage: '',
        dateNotification: undefined,
        calculateTime: undefined,
        relationshipReference: undefined,
        serialStarter: 0,
        archive: false,
        mapSearch: false,
    },
    supportConvertingToMultipleFields = true,
}: React.PropsWithChildren<FieldBlockProps<PropertiesType, Values>>) => {
    return (
        <DndProvider backend={HTML5Backend}>
            <StructureEditor
                propertiesType={propertiesType}
                values={values}
                uniqueConstraints={uniqueConstraints}
                setUniqueConstraints={setUniqueConstraints}
                initialValues={initialValues}
                setFieldValue={setFieldValue}
                areThereAnyInstances={areThereAnyInstances}
                isEditMode={isEditMode}
                setBlock={setBlock}
                title={title}
                addPropertyButtonLabel={addPropertyButtonLabel}
                touched={touched}
                errors={errors}
                supportSerialNumberType={supportSerialNumberType}
                supportUserType={supportUserType}
                supportEntityReferenceType={supportEntityReferenceType}
                supportChangeToRequiredWithInstances={supportChangeToRequiredWithInstances}
                supportArrayFields={supportArrayFields}
                supportDeleteForExistingInstances={supportDeleteForExistingInstances}
                supportRelationshipReference={supportRelationshipReference}
                supportEditEnum={supportEditEnum}
                supportUnique={supportUnique}
                supportLocation={supportLocation}
                supportArchive={supportArchive}
                locationSearchFields={locationSearchFields}
                supportIdentifier={supportIdentifier}
                hasIdentifier={hasIdentifier}
                supportAddFieldButton={supportAddFieldButton ?? true}
                hasActions={hasActions}
                draggable={draggable ?? { isDraggable: false }}
                initialFieldCardDataOnAdd={
                    initialFieldCardDataOnAdd ?? {
                        name: '',
                        title: '',
                        type: '',
                        required: false,
                        preview: false,
                        hide: false,
                        groupName: undefined,
                        uniqueCheckbox: false,
                        options: [],
                        optionColors: {},
                        pattern: '',
                        patternCustomErrorMessage: '',
                        dateNotification: undefined,
                        calculateTime: undefined,
                        relationshipReference: undefined,
                        serialStarter: 0,
                        archive: false,
                        mapSearch: false,
                    }
                }
                supportConvertingToMultipleFields={supportConvertingToMultipleFields ?? true}
            />
        </DndProvider>
    );
};
