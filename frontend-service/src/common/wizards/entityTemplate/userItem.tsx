import React, { FC } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

type Field = {
    id: number;
    name: string;
    type: 'field' | 'group';
    items?: Field[];
};

interface UserItemProps {
    field: Field;
}
export const UserItem: FC<UserItemProps> = (props) => {
    const { id, name } = props.field;
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        backgroundColor: 'pink',
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <div>
                <h3 className="text-lg font-semibold">{name}</h3>
            </div>
            {/* <button {...attributes} {...listeners} className='cursor-move'>
        Drag
      </button> */}
        </div>
    );
};
