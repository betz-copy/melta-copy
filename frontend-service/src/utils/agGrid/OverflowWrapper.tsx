import React, { useState, useRef, useLayoutEffect, createRef } from 'react';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import { MeltaTooltip } from '../../common/MeltaTooltip';

interface IOverflowWrapperProps<T> {
    items: T[];
    getItemKey: (item: T) => React.Key;
    renderItem: (item: T) => React.JSX.Element;
    containerStyle?: React.CSSProperties;
}

const OverflowWrapper = <T extends any>({ items, renderItem, getItemKey, containerStyle }: IOverflowWrapperProps<T>) => {
    const [visibleItems, setVisibleItems] = useState(items);
    const containerRef = useRef(null);
    const itemRefs = useRef<React.RefObject<HTMLDivElement>[]>([]);
    const itemsGap = 5;

    itemRefs.current = items.map((_, i) => itemRefs.current[i] || createRef());

    useLayoutEffect(() => {
        const itemWidths = itemRefs.current.map((ref) => (ref.current ? ref.current.offsetWidth : 0));

        if (containerRef.current) {
            const resizeObserver = new ResizeObserver(([entry]) => {
                const containerWidth = entry.contentRect.width;
                let displayedItemsWidth = 0;
                let displayedItemsCount = 0;
                itemWidths.forEach((itemWidth) => {
                    if (displayedItemsWidth + itemWidth < containerWidth - 30) {
                        displayedItemsCount++;
                        displayedItemsWidth += itemWidth + itemsGap;
                    }
                });

                setVisibleItems(items.slice(0, displayedItemsCount));
            });
            resizeObserver.observe(containerRef.current);
            return () => resizeObserver.disconnect();
        }
        return undefined;
    }, [items, containerRef]);

    const overflowItems = items.length > visibleItems.length ? items.slice(visibleItems.length) : [];

    return (
        <Grid ref={containerRef} container wrap="nowrap" alignItems="center" justifyItems="center" gap={`${itemsGap}px`} style={containerStyle}>
            {visibleItems.map((item, index) => (
                <Grid ref={itemRefs.current[index]} item key={getItemKey(item)}>
                    {renderItem(item)}
                </Grid>
            ))}
            {overflowItems.length > 0 && (
                <Grid item>
                    <MeltaTooltip
                        title={overflowItems.map((item) => (
                            <Typography key={getItemKey(item)} style={{ margin: '5px' }}>
                                {item}
                            </Typography>
                        ))}
                        arrow
                    >
                        <Grid
                            container
                            alignItems="center"
                            justifyContent="center"
                            sx={{ borderRadius: '30px', height: '24px', width: '24px', background: 'var(--Gray-Medium, #9398C2)' }}
                        >
                            <Typography color="white" fontWeight={500} fontSize="12px">
                                +{overflowItems.length}
                            </Typography>
                        </Grid>
                    </MeltaTooltip>
                </Grid>
            )}
        </Grid>
    );
};

export default OverflowWrapper;
