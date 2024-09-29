import React, { useEffect, useState } from 'react';
import { ResizableBox } from 'react-resizable';
import '../../css/resizable.css';
import { Grid } from '@mui/material';

interface ResizeBoxProps {
    id: string;
    isSideBarOpen: boolean;
    isDimensionsChange: boolean;
    setIsDimensionsChange: (value: boolean) => void;
}

const Resizable: React.FC<ResizeBoxProps> = ({ children, id, isSideBarOpen = false, isDimensionsChange, setIsDimensionsChange }) => {
    const localStorageKey = `iFrameDimension_${id}`;

    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const sideBarWidth = isSideBarOpen ? 310 : 130;
    const defaultWidth = (screenWidth - sideBarWidth) / 2;
    const defaultHeight = screenHeight / 2;
    const maxWidth = screenWidth - sideBarWidth;
    const maxHeight = screenHeight - 140;

    const getDimensions = () => {
        const savedDimensions = localStorage.getItem(localStorageKey);
        if (savedDimensions) return JSON.parse(savedDimensions);

        const defaultDimensions = { width: defaultWidth, height: defaultHeight };
        localStorage.setItem(localStorageKey, JSON.stringify(defaultDimensions));
        return defaultDimensions;
    };

    const [dimensions, setDimensions] = useState(getDimensions);
    const [isResizing, setIsResizing] = useState(false);

    useEffect(() => {
        if (isDimensionsChange) {
            setDimensions(getDimensions());
            setIsDimensionsChange(false);
        }
    }, [isDimensionsChange]);

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
            minConstraints={[defaultWidth, defaultHeight]}
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
