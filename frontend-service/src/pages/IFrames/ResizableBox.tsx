import React, { useState } from 'react';
import { ResizableBox } from 'react-resizable';
import '../../css/resizable.css';
import { Grid } from '@mui/material';
import { BorderColor } from '@mui/icons-material';
// eslint-disable-next-line import/no-extraneous-dependencies

interface ResizeBoxProps {
    // initialHeight: number;
    // initialWidth?: number;
    maxHeight?: number;
    maxWidth?: number;
    // setWidth?: React.Dispatch<React.SetStateAction<number>>;
    // setHeight: React.Dispatch<React.SetStateAction<number>>;
    minHeight: number;
    minWidth: number;
    id: string;
}

const Resizable: React.FC<ResizeBoxProps> = ({ minHeight, children, maxHeight, maxWidth, minWidth, id }) => {
    const localStorageKey = `iFrameDimension_${id}`;
    // const loadFlagKey = 'page-load-flag';

    const [isResizing, setIsResizing] = React.useState(false);
    const getDimensions = () => {
        const savedDimensions = localStorage.getItem(localStorageKey);

        return savedDimensions ? JSON.parse(savedDimensions) : { width: 900, height: 500 };
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
            minConstraints={[minWidth, minHeight]}
            maxConstraints={[maxWidth, maxHeight]}
            onResizeStart={onResizeStart}
            onResizeStop={onResizeStop}
            axis="both"
            style={{
                borderRadius: '12px', // Apply border-radius to ResizableBox
                overflow: 'hidden', // Ensure content doesn't overflow the rounded corners
            }}
        >
            <Grid paddingBottom="40px" height="100%" width="100%" sx={{ pointerEvents: isResizing ? 'none' : 'auto' }}>
                {children}
            </Grid>
        </ResizableBox>
    );
};

export { Resizable };
