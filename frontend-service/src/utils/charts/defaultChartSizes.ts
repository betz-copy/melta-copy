import { LayoutItem, Layouts } from '../../common/GridLayout/interface';
import { environment } from '../../globals';

const { defaultColumnSizes, cols, itemWidth } = environment.charts;

export const generateLayoutDetails = <T extends { _id: string }>(items: T[]) =>
    Object.keys(defaultColumnSizes).reduce((acc, col) => {
        // eslint-disable-next-line no-param-reassign
        acc[col] = items.map(({ _id }, index) => ({
            i: _id,
            x: cols - itemWidth - (index % (cols / itemWidth)) * itemWidth,
            y: Math.floor(index / (cols / itemWidth)) * (cols / itemWidth),
            w: 4,
            h: 11,
            minH: 7,
            minW: 3,
        }));
        return acc;
    }, {} as Layouts);

export const generateNewItemSizes = (layout: LayoutItem[], itemId: string) => {
    const maxY = layout.length ? Math.max(...layout.map((item) => item.y)) : 0;
    const lastRowItems = layout.filter((item) => item.y === maxY);

    const gridMap: boolean[] = Array(cols).fill(false);

    lastRowItems.forEach(({ x, w }) => {
        for (let i = x; i < x + w; i++) gridMap[i] = true;
    });

    const reversedGrid = [...gridMap].reverse();

    const availableXFromRight = reversedGrid.findIndex((_, index) => {
        if (index > cols - itemWidth) return false;

        const slotsToCheck = reversedGrid.slice(index, index + itemWidth);
        return slotsToCheck.every((slot) => !slot);
    });

    let x: number;
    let y: number;
    
    if (availableXFromRight !== -1) {
        x = cols - itemWidth - availableXFromRight;
        y = maxY;
    } else {
        const itemsPerRow = cols / itemWidth;
        const positionInNewRow = layout.length % itemsPerRow;
        x = cols - itemWidth - positionInNewRow * itemWidth;
        y = maxY + 1;
    }

    return {
        i: itemId,
        x,
        y,
        w: itemWidth,
        h: 11,
        minH: 7,
        minW: 3,
    };
};
