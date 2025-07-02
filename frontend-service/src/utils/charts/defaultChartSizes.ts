import { LayoutItem, Layouts } from '../../common/GridLayout/interface';
import { environment } from '../../globals';
import { LocalStorage } from '../localStorage';

const { defaultColumnSizes } = environment.charts;

export const generateLayoutDetails = <T extends { _id: string }>(items: T[]) =>
    Object.keys(defaultColumnSizes).reduce((acc, col) => {
        // eslint-disable-next-line no-param-reassign
        acc[col] = items.map(({ _id }, index) => ({
            i: _id,
            x: (index % 3) * 4,
            y: Math.floor(index / 3) * 3,
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

    const cols = 12;
    const itemWidth = 4;

    const gridMap = Array(cols).fill(false);
    lastRowItems.forEach(({ x, w }) => {
        for (let i = x; i < x + w; i++) gridMap[i] = true;
    });

    const availableX = gridMap.findIndex((__, x) => x <= cols - itemWidth && gridMap.slice(x, x + itemWidth).every((slot) => !slot));

    const availableY = availableX !== -1 ? maxY : maxY + 12;

    const newItem = {
        i: itemId,
        x: availableX !== -1 ? availableX : (savedLayout.length % 3) * 4,
        y: availableY,
        w: itemWidth,
        h: 11,
        minH: 7,
        minW: 3,
    };

    LocalStorage.set(localStorageKey, [...savedLayout, newItem]);

    return newItem;
};
