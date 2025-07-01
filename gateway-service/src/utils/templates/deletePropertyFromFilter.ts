import { IMongoChart, ISearchFilter, logger, MongoBaseFields, TableItem } from '@microservices/shared';
import { omit } from 'lodash';

export function processFilteredItems<T>(
    items: T[],
    removedProperties: string[],
    getFilter: (item: T) => string | undefined,
    setFilter: (item: T, filter: string | undefined) => void,
    getId: (item: T) => string,
): { id: string; updatedItem: T }[] {
    const itemsWithFilters = items.filter((item) => getFilter(item));

    const processedItems = itemsWithFilters.map((item) => {
        try {
            const filterString = getFilter(item)!;
            const parsedFilter: ISearchFilter = JSON.parse(filterString);
            parsedFilter.$and = Array.isArray(parsedFilter.$and) ? parsedFilter.$and : [];

            parsedFilter.$and = parsedFilter.$and.filter((filterProperty) => {
                const propertyKey = Object.keys(filterProperty)[0];
                return !removedProperties.includes(propertyKey);
            });

            const updatedFilterString = parsedFilter.$and.length > 0 ? JSON.stringify(parsedFilter) : undefined;

            setFilter(item, updatedFilterString);

            return { id: getId(item), updatedItem: item };
        } catch (error) {
            logger.error(`Error parsing filter for item ${getId(item)}:`, { error });
            return null;
        }
    });

    return processedItems.filter(Boolean) as { id: string; updatedItem: T }[];
}

export async function updateItems<T extends object>(
    items: { id: string; updatedItem: T }[],
    updateFunction: (id: string, item: T) => Promise<any>,
    prepareItem?: (item: T) => T,
): Promise<void> {
    await Promise.all(
        items.map(({ id, updatedItem }) => {
            const baseItem = omit(updatedItem, ['_id', 'createdAt', 'updatedAt']) as T;
            const preparedItem = prepareItem ? prepareItem(baseItem) : baseItem;
            return updateFunction(id, preparedItem);
        }),
    );
}

export async function processAndUpdateItems<T extends object>(
    items: T[],
    removedProperties: string[],
    getFilter: (item: T) => string | undefined,
    setFilter: (item: T, filter: string | undefined) => void,
    getId: (item: T) => string,
    updateFunction: (id: string, item: T) => Promise<any>,
    prepareItem?: (item: T) => T,
): Promise<void> {
    const processedItems = processFilteredItems(items, removedProperties, getFilter, setFilter, getId);
    await updateItems(processedItems, updateFunction, prepareItem);
}

const parseString = (str?: string) => {
    if (typeof str !== 'string') return undefined;
    try {
        return JSON.parse(str);
    } catch {
        return undefined;
    }
};

export const prepareChartForUpdate = (chart: IMongoChart) => ({
    ...chart,
    filter: parseString(chart.filter) ?? chart.filter,
});

export const prepareDashboardItemForUpdate = (item: TableItem & MongoBaseFields) => ({
    ...item,
    metaData: {
        ...item.metaData,
        filter: parseString(item.metaData?.filter) ?? item.metaData?.filter,
    },
});
