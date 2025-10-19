import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import React, { createRef, useLayoutEffect, useRef, useState } from 'react';
import MeltaTooltip from '../../common/MeltaDesigns/MeltaTooltip';
import { HighlightText } from '../HighlightText';

interface IOverflowWrapperProps<T> {
    items: T[];
    getItemKey: (item: T) => React.Key;
    renderItem: (item: T, index: number) => React.JSX.Element;
    files?: T[];
    containerStyle?: React.CSSProperties;
    propertyToDisplayInTooltip?: string;
    minVisibleItems?: number;
    searchValue?: string;
}

const OverflowWrapper = <T extends any>({
    items,
    renderItem,
    getItemKey,
    containerStyle,
    files,
    propertyToDisplayInTooltip,
    minVisibleItems = 0,
    searchValue,
}: IOverflowWrapperProps<T>) => {
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
                for (let i = 0; i < itemWidths.length; i++) {
                    const itemWidth = itemWidths[i];

                    const overflowButtonWidth = 30;
                    let availableSpace = containerWidth - displayedItemsWidth;
                    if (i < itemWidths.length - 1) {
                        // if not last item, need to insert overflow button too (to show overflowItems count)
                        availableSpace -= overflowButtonWidth;
                    }

                    // if (displayedItemsWidth + itemWidth >= containerWidth - 30) {
                    if (itemWidth >= availableSpace - overflowButtonWidth) {
                        break;
                    }

                    displayedItemsCount++;
                    displayedItemsWidth += itemWidth + itemsGap;
                }
                setVisibleItems(items.slice(0, displayedItemsCount));
            });

            resizeObserver.observe(containerRef.current);
            return () => resizeObserver.disconnect();
        }

        return () => {};
    }, [items, containerRef]);

    let overflowItems = items.length > visibleItems.length ? items.slice(visibleItems.length) : [];
    if (files && files.length > 0) {
        overflowItems = items.length > visibleItems.length ? files.slice(visibleItems.length) : [];
    }

    if (visibleItems.length < minVisibleItems) {
        const itemsAmountToAdd = minVisibleItems - visibleItems.length;
        visibleItems.push(...overflowItems.slice(0, itemsAmountToAdd));
        overflowItems = overflowItems.slice(itemsAmountToAdd);
    }
    return (
        <Grid ref={containerRef} container wrap="wrap" alignItems="center" justifyItems="center" gap={`${itemsGap}px`} style={containerStyle}>
            {visibleItems.map((item, index) => (
                // eslint-disable-next-line react/no-array-index-key
                <Grid ref={itemRefs.current[index]} key={`${getItemKey(item)}/${index}`}>
                    {renderItem(item, index)}
                </Grid>
            ))}
            {overflowItems.length > 0 && (
                <Grid style={{ cursor: 'pointer' }}>
                    <MeltaTooltip
                        title={overflowItems.map((item, index) => (
                            <Typography
                                // eslint-disable-next-line react/no-array-index-key
                                key={`${getItemKey(item)}/${index}`}
                                style={{ margin: '5px' }}
                            >
                                <HighlightText
                                    text={propertyToDisplayInTooltip ? item[propertyToDisplayInTooltip] : (item as string)}
                                    searchedText={searchValue}
                                />
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
