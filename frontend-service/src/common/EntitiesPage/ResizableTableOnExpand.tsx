import React from 'react';
import { Resizable } from 'react-resizable';
import '../../css/resizeTable.css';

interface ResizableProps {
    gridHeight: number;
    setGridHeight: React.Dispatch<React.SetStateAction<number>>;
    minHeight: number;
}

const Resize: React.FC<ResizableProps> = ({ gridHeight, setGridHeight, minHeight, children }) => {
    const onResize = (_event, { size }) => {
        setGridHeight(size.height);
    };

    return (
        <Resizable height={gridHeight} onResize={onResize} minConstraints={[null, minHeight]} resizeHandles={['s']} axis="y">
            {children}
        </Resizable>
    );
};

export default Resize;
