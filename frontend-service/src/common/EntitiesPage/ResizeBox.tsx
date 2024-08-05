import React from 'react';
import { ResizableBox } from 'react-resizable';
import '../../css/resizeTable.css';
import { Grid } from '@mui/material';

interface ResizeBoxProps {
    initialHeight: number;
    initialWidth?: number;
    setWidth?: React.Dispatch<React.SetStateAction<number>>;
    setHeight: React.Dispatch<React.SetStateAction<number>>;
    minHeight: number;
}

const ResizeBox: React.FC<ResizeBoxProps> = ({ initialHeight, setHeight, minHeight, children, initialWidth, setWidth }) => {
    const [isResizing, setIsResizing] = React.useState(false);

    const onResizeStart = () => {
        setIsResizing(true);
    };

    const onResizeStop = (_event, { size }) => {
        setHeight(size.height);
        // eslint-disable-next-line no-unused-expressions
        if (initialWidth) setWidth!(size.width);
        setIsResizing(false);
    };
    console.log({ initialWidth });

    return (
        <ResizableBox
            width={initialWidth}
            height={initialHeight}
            minConstraints={[400, minHeight]}
            maxConstraints={[Infinity, Infinity]}
            onResizeStart={onResizeStart}
            onResizeStop={onResizeStop}
            resizeHandles={['s', 'e', 'se']} // Allow resizing from bottom (s), right (e), and bottom-right corner (se)
            axis="both"
            className={`box-content ${isResizing ? 'resizing' : ''}`}
        >
            <Grid className={`box-content ${isResizing ? 'resizing' : ''}`}>{children}</Grid>
        </ResizableBox>
    );
};

export { ResizeBox };
