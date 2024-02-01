import React from 'react';
import { Resizable } from 'react-resizable';
import '../../css/resizeTable.css';

interface ResizableProps {
    gridHeight: number;
    setGridHeight: React.Dispatch<React.SetStateAction<number>>;
    minHeight: number;
}

const Resize: React.FC<ResizableProps> = ({ gridHeight, setGridHeight, minHeight, children }) => {
    const [resizing, setResizing] = React.useState(false);

    const onResizeStart = () => {
        setResizing(true);
    };

    const onResizeStop = () => {
        setResizing(false);
    };

    const onResize = (_event, { size }) => {
        setGridHeight(size.height);
    };

    return (
        <Resizable
            height={gridHeight}
            onResize={onResize}
            onResizeStart={onResizeStart}
            onResizeStop={onResizeStop}
            minConstraints={[null, minHeight]}
            resizeHandles={['s']}
            axis="y"
            className={resizing ? 'resizing' : ''}
        >
            {children}
        </Resizable>
    );
};

export default Resize;
