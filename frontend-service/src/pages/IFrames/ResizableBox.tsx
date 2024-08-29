import React, { useState } from 'react';
import { ResizableBox } from 'react-resizable';
import '../../css/resizable.css';
import { Grid } from '@mui/material';

interface ResizeBoxProps {
    id: string;
}

const Resizable: React.FC<ResizeBoxProps> = ({ children, id }) => {
    const localStorageKey = `iFrameDimension_${id}`;

    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    const maxWidth = screenWidth - 160;
    const maxHeight = screenHeight - 140;
    const defaultWidth = maxWidth / 2;
    const defaultHight = screenHeight / 2;

    const [isResizing, setIsResizing] = React.useState(false);
    const getDimensions = () => {
        const savedDimensions = localStorage.getItem(localStorageKey);

        if (savedDimensions) return JSON.parse(savedDimensions);
        localStorage.setItem(localStorageKey, JSON.stringify({ width: defaultWidth, height: defaultHight }));
        return { width: defaultWidth, height: defaultHight };
    };

    const [dimensions, setDimensions] = useState(getDimensions());
    const onResizeStart = () => {
        setIsResizing(true);
    };

    const onResizeStop = (_event, { size }) => {
        const newDimensions = { width: size.width, height: size.height };
        setDimensions(newDimensions);
        localStorage.setItem(localStorageKey, JSON.stringify(newDimensions));
        setIsResizing(false);
    };

    return (
        <ResizableBox
            resizeHandles={['se']}
            width={dimensions.width}
            height={dimensions.height}
            minConstraints={[defaultWidth, defaultHight]}
            maxConstraints={[maxWidth, maxHeight]}
            onResizeStart={onResizeStart}
            onResizeStop={onResizeStop}
            axis="both"
            style={{
                margin: '6px',
            }}
        >
            <Grid container height="100%" width="100%" sx={{ pointerEvents: isResizing ? 'none' : 'auto' }}>
                {children}
            </Grid>
        </ResizableBox>
    );
};

export { Resizable };
