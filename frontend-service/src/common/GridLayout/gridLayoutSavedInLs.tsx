import React, { useEffect, useState } from 'react';
import { GridLayout } from '.';
import { environment } from '../../globals';
import { generateLayoutDetails, generateNewItemSizes } from '../../utils/charts/defaultChartSizes';
import { LocalStorage } from '../../utils/localStorage';
import { LayoutItem } from './interface';

const { defaultColumnSizes } = environment.charts;

interface LocalStorageGridLayoutProps<T extends any[]> {
    items: T;
    localStorageKey: string;
    generateDom: () => React.ReactNode[];
    layout: {
        value: LayoutItem[];
        set: React.Dispatch<React.SetStateAction<LayoutItem[]>>;
    };
    textSearch?: string;
}

const LocalStorageGridLayout = <T extends any[]>({ items, localStorageKey, generateDom, layout, textSearch }: LocalStorageGridLayoutProps<T>) => {
    const [mounted, setMounted] = useState(false);

    const getSavedLayout = (): LayoutItem[] => LocalStorage.get(localStorageKey) || [];

    useEffect(() => {
        const savedLayout = getSavedLayout();
        layout.set(savedLayout.length ? savedLayout : generateLayoutDetails(items).lg);
        setMounted(true);
    }, []);

    useEffect(() => {
        const savedLayout = getSavedLayout();

        if (!savedLayout && items.length > 0) layout.set(generateLayoutDetails(items).lg);

        if (items.length > savedLayout.length) {
            const updatedLayout = new Set<LayoutItem>(savedLayout);

            items.forEach((item) => {
                if (!updatedLayout.has(item._id)) 
                    updatedLayout.add(generateNewItemSizes(localStorageKey, item._id));
            });

            layout.set(Array.from(updatedLayout));
        }

        if (textSearch) savedLayout.filter((l) => items.some((item) => item._id === l.i));
    }, [items, textSearch]);

    const handleLayoutChange = (newLayout: LayoutItem[]) => {
        const savedLayout = getSavedLayout();

        if (!newLayout.length) return;

        layout.set((prevLayout) => {
            if (prevLayout.length < newLayout.length && savedLayout && !textSearch) return savedLayout;

            const updatedLayout = newLayout.map((newItem, index) => {
                const existingItem = prevLayout[index];
                return existingItem ? { ...newItem, i: existingItem.i } : newItem;
            });

            if (savedLayout && savedLayout.length > newLayout.length) updatedLayout.push(savedLayout[savedLayout.length - 1]);

            if (!textSearch) LocalStorage.set(localStorageKey, updatedLayout);

            return updatedLayout;
        });
    };

    return (
        <div>
            {layout.value.length > 0 && (
                <GridLayout
                    style={{ direction: 'ltr' }}
                    rowHeight={30}
                    cols={defaultColumnSizes}
                    useCSSTransforms={mounted}
                    compactType="vertical"
                    generateDom={generateDom}
                    layouts={{ md: layout.value, lg: layout.value, sm: layout.value, xs: layout.value, xxs: layout.value }}
                    onLayoutChange={handleLayoutChange}
                    draggableHandle=".drag-handle"
                />
            )}
        </div>
    );
};

export { LocalStorageGridLayout };
