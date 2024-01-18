import React, { useState, useEffect, useRef } from 'react';
import Grid from '@mui/material/Grid';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

interface IOverflowWrapperProps<T> {
    items: T[];
    getItemKey: (item: T) => React.Key;
    renderItem: (item: T) => React.JSX.Element;
    itemWidth: number;
}

const OverflowWrapper = <T extends any>({ items, renderItem, getItemKey, itemWidth }: IOverflowWrapperProps<T>) => {
    const [visibleItems, setVisibleItems] = useState(items);
    const containerRef = useRef(null);

    useEffect(() => {
        if (containerRef.current) {
            const resizeObserver = new ResizeObserver((entries) => {
                for (const entry of entries) {
                    const containerWidth = entry.contentRect.width;
                    const maxDisplayCount = Math.floor(containerWidth / itemWidth);
                    setVisibleItems(items.slice(0, maxDisplayCount));
                }
            });

            resizeObserver.observe(containerRef.current);
            return () => resizeObserver.disconnect();
        }
    }, [items, itemWidth, containerRef.current]);

    const overflowItems = items.length > visibleItems.length ? items.slice(visibleItems.length) : [];

    return (
        <Grid ref={containerRef} container wrap="nowrap" alignItems="center" justifyItems="center" gap="5px" sx={{ textOverflow: 'ellipsis' }}>
            {visibleItems.map((item) => (
                <Grid item key={getItemKey(item)}>
                    {renderItem(item)}
                </Grid>
            ))}
            {overflowItems.length > 0 && (
                <Tooltip
                    title={overflowItems.map((item) => (
                        <Typography key={getItemKey(item)} style={{ margin: '5px' }}>
                            {renderItem(item)}
                        </Typography>
                    ))}
                    arrow
                >
                    <Grid
                        item
                        container
                        alignItems="center"
                        justifyContent="center"
                        sx={{ borderRadius: '30px', height: '24px', width: '24px', background: 'var(--Gray-Medium, #9398C2)' }}
                    >
                        <Typography color="white" fontWeight={700} fontSize="14px">
                            +{overflowItems.length}
                        </Typography>
                    </Grid>
                </Tooltip>
            )}
        </Grid>
    );
};

export default OverflowWrapper;
