import { IAgGridSort } from '@packages/rule-breach';

export const translateAgGridSortModel = (sortModel: IAgGridSort[]): Record<string, number> => {
    return sortModel.reduce(
        (acc, { colId, sort: sortType }) => {
            acc[colId] = sortType === 'asc' ? 1 : -1;
            return acc;
        },
        {} as Record<string, number>,
    );
};
