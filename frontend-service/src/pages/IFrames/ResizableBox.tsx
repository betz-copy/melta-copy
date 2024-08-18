import React, { useEffect, useState } from 'react';
import { ResizableBox } from 'react-resizable';
import '../../css/resizable.css';
import { Grid } from '@mui/material';
// eslint-disable-next-line import/no-extraneous-dependencies
import { useDrag } from 'react-dnd';

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
    const loadFlagKey = 'page-load-flag';

    const [isResizing, setIsResizing] = React.useState(false);
    const getDimensions = () => {
        const savedDimensions = localStorage.getItem(localStorageKey);

        return savedDimensions ? JSON.parse(savedDimensions) : { width: 1000, height: 500 };
    };
    const [dimensions, setDimensions] = useState(getDimensions());
    useEffect(() => {
        localStorage.setItem(loadFlagKey, 'true');

        const handleBeforeUnload = () => {
            localStorage.removeItem(localStorageKey);
            localStorage.removeItem(loadFlagKey);
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, []);

    useEffect(() => {
        const loadFlag = localStorage.getItem(loadFlagKey);
        if (!loadFlag) {
            localStorage.removeItem(localStorageKey);
            setDimensions({ width: 1000, height: 500 });
        }
    }, []);
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
            // className={`box-content ${isResizing ? 'resizing' : ''}`}
        >
            <Grid paddingBottom="40px" height="100%" width="100%" sx={{ pointerEvents: isResizing ? 'none' : 'auto' }}>
                {children}
            </Grid>
        </ResizableBox>
    );
};

export { Resizable };
