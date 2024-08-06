import React from 'react';
import { ResizableBox } from 'react-resizable';
import '../../css/resizeTable.css';
import { Grid } from '@mui/material';

interface ResizeBoxProps {
    initialHeight: number;
    setHeight: React.Dispatch<React.SetStateAction<number>>;
    minHeight: number;
}

const ResizeBox: React.FC<ResizeBoxProps> = ({ initialHeight, setHeight, minHeight, children }) => {
    const [isResizing, setIsResizing] = React.useState(false);

    const onResizeStart = () => {
        setIsResizing(true);
    };

    const onResizeStop = (_event, { size }) => {
        setHeight(size.height);
        setIsResizing(false);
    };

    return (
        <ResizableBox
            width={Infinity}
            height={initialHeight}
            minConstraints={[Infinity, minHeight]}
            maxConstraints={[Infinity, Infinity]}
            onResizeStart={onResizeStart}
            onResizeStop={onResizeStop}
            resizeHandles={['s']}
            axis="y"
            className={`box-content ${isResizing ? 'resizing' : ''}`}
        >
            <Grid className={`box-content ${isResizing ? 'resizing' : ''}`}>{children}</Grid>
        </ResizableBox>
    );
};

export { ResizeBox };
