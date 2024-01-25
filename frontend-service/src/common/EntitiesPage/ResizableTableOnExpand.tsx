import React from 'react';
import { Resizable } from 'react-resizable';
import '../../css/resizeTable.css';

interface ResizableProps {
    gridHeight: number;
    setGridHeight: React.Dispatch<React.SetStateAction<number>>;
    minHeight: number;
}

const Resize: React.FC<ResizableProps> = ({ gridHeight, setGridHeight, minHeight, children }) => {
    const onResizeStop = (_event, { size }) => {
        setGridHeight(size.height);
    };

    return (
        <Resizable height={gridHeight} onResize={onResizeStop} minConstraints={[null, minHeight]} resizeHandles={['s']}>
            {children}
        </Resizable>
    );
};

export default Resize;
