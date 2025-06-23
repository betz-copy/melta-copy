import { ISearchFilter, logger } from '@microservices/shared';

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

            const cleanedFilterConditions = parsedFilter.$and.filter((filterProperty) => {
                const propertyKey = Object.keys(filterProperty)[0];
                return !removedProperties.includes(propertyKey);
            });

            parsedFilter.$and = cleanedFilterConditions;

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

export async function updateItems<T>(items: { id: string; updatedItem: T }[], updateFunction: (id: string, item: T) => Promise<any>): Promise<void> {
    await Promise.all(items.map(({ id, updatedItem }) => updateFunction(id, updatedItem)));
}

export async function processAndUpdateItems<T>(
    items: T[],
    removedProperties: string[],
    getFilter: (item: T) => string | undefined,
    setFilter: (item: T, filter: string | undefined) => void,
    getId: (item: T) => string,
    updateFunction: (id: string, item: T) => Promise<any>,
): Promise<void> {
    const processedItems = processFilteredItems(items, removedProperties, getFilter, setFilter, getId);

    await updateItems(processedItems, updateFunction);
}
