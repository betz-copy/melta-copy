import React, { useState } from 'react';
import { DndContext, DragEndEvent, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { UserItem } from './userItem';

type Field = {
    id: number;
    name: string;
    type: 'field' | 'group';
    items?: Field[];
};
const dummyData: Field[] = [
    {
        id: 1,
        name: 'John Doe',
        type: 'field',
    },
    {
        id: 2,
        name: 'Jane Smith',
        type: 'group',
        items: [
            { id: 5, name: 'aaa', type: 'field' },
            { id: 6, name: 'bbb', type: 'field' },
        ],
    },
    {
        id: 3,
        name: 'Alice Johnson',
        type: 'field',
    },
];

export const UserList = () => {
    const [structure, setStructure] = useState<Field[]>(dummyData);
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
    );

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            setStructure((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id);
                const newIndex = items.findIndex((item) => item.id === over.id);

                return arrayMove(items, oldIndex, newIndex);
            });
        }
    }
    console.log(structure);

    return (
        <div className="max-w-2xl mx-auto grid gap-2 my-10">
            <h2 className="text-2xl font-bold mb-4">User List</h2>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd} modifiers={[restrictToVerticalAxis]}>
                <SortableContext items={structure} strategy={verticalListSortingStrategy}>
                    {structure.map((item) => (item.type === 'field' ? <UserItem key={item.id} field={item} /> : <UserList key={item.id} />))}
                </SortableContext>
            </DndContext>
        </div>
    );
};
