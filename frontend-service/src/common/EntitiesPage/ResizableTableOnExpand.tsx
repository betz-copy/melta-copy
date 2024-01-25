import React from 'react';
import { ResizableBox } from 'react-resizable';

interface ResizableProps {
    gridHeight: number;
    setGridHeight: React.Dispatch<React.SetStateAction<number>>;
    minHeight: number;
}

const Resizable: React.FC<ResizableProps> = ({ gridHeight, setGridHeight, minHeight, children }) => {
    const onResizeStop = (_event, { size }) => {
        setGridHeight(size.height);
    };

    return (
        <ResizableBox
            height={gridHeight}
            axis="y"
            onResizeStop={onResizeStop}
            minConstraints={[null, minHeight]}
            handle={<div style={{ height: '10px', cursor: 'ns-resize' }} />}
        >
            {children}
        </ResizableBox>
    );
};

export default Resizable;
