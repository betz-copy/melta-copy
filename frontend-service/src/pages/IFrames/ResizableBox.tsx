import React from 'react';
import { ResizableBox } from 'react-resizable';
import '../../css/resizable.css';
import { Grid } from '@mui/material';

interface ResizeBoxProps {
    initialHeight: number;
    initialWidth?: number;
    maxHeight?: number;
    maxWidth?: number;
    setWidth?: React.Dispatch<React.SetStateAction<number>>;
    setHeight: React.Dispatch<React.SetStateAction<number>>;
    minHeight: number;
    minWidth: number;
}

const Resizable: React.FC<ResizeBoxProps> = ({
    initialHeight,
    setHeight,
    minHeight,
    children,
    initialWidth,
    setWidth,
    maxHeight,
    maxWidth,
    minWidth,
}) => {
    const [isResizing, setIsResizing] = React.useState(false);

    const onResizeStart = () => {
        setIsResizing(true);
    };

    const onResizeStop = (_event, { size }) => {
        console.log({ size });

        setHeight(size.height);
        // eslint-disable-next-line no-unused-expressions
        if (initialWidth) setWidth!(size.width);
        setIsResizing(false);
    };
    console.log({ initialWidth });

    return (
        <ResizableBox
            resizeHandles={['se']}
            width={initialWidth}
            height={initialHeight}
            minConstraints={[minWidth, minHeight]}
            maxConstraints={[maxWidth, maxHeight]}
            onResizeStart={onResizeStart}
            onResizeStop={onResizeStop}
            className={`box-content ${isResizing ? 'resizing' : ''}`}
        >
            <Grid padding={5} height="100%" width="100%" className={`box-content ${isResizing ? 'resizing' : ''}`}>
                {children}
            </Grid>
        </ResizableBox>
    );
};

export { Resizable };
