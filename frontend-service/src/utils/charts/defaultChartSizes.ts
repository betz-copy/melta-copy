import { LayoutItem, Layouts } from '../../common/GridLayout/interface';
import { environment } from '../../globals';
import { LocalStorage } from '../localStorage';

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

export const generateNewItemSizes = (localStorageKey: string, itemId: string) => {
    const savedLayout: LayoutItem[] = LocalStorage.get(localStorageKey) || [];

    const maxY = savedLayout.length ? Math.max(...savedLayout.map((item) => item.y)) : 0;
    const lastRowItems = savedLayout.filter((item) => item.y === maxY);

    const gridMap = Array(cols).fill(false);
    lastRowItems.forEach(({ x, w }) => {
        for (let i = x; i < x + w; i++) gridMap[i] = true;
    });

    const availableX = gridMap.findLastIndex((__, x) => x <= cols - itemWidth && gridMap.slice(x, x + itemWidth).every((slot) => !slot));

    const availableY = availableX !== -1 ? maxY : maxY + cols;

    const newItem = {
        i: itemId,
        x: availableX !== -1 ? availableX : cols - itemWidth - (savedLayout.length % (cols / itemWidth)) * itemWidth,
        y: availableY,
        w: itemWidth,
        h: 11,
        minH: 7,
        minW: 3,
    };

    LocalStorage.set(localStorageKey, [...savedLayout, newItem]);

    return newItem;
};
