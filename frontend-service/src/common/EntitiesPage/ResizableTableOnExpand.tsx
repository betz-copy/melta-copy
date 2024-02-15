import React from 'react';
import { ResizableBox } from 'react-resizable';
import '../../css/resizeTable.css'; // Make sure the CSS is correctly imported for handle visibility
import { Grid } from '@mui/material';

interface ResizableBoxProps {
    gridHeight: number;
    setGridHeight: React.Dispatch<React.SetStateAction<number>>;
    minHeight: number;
}

const ResizeBoxComponent: React.FC<ResizableBoxProps> = ({ gridHeight, setGridHeight, minHeight, children }) => {
    const [isResizing, setIsResizing] = React.useState(false);

    const onResizeStart = () => {
        setIsResizing(true); // This triggers the visual feedback to start
    };

    const onResizeStop = (_event, { size }) => {
        setGridHeight(size.height);
        setIsResizing(false); // This stops the visual feedback
    };

    return (
        <ResizableBox
            width={Infinity}
            height={gridHeight}
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

export default ResizeBoxComponent;
