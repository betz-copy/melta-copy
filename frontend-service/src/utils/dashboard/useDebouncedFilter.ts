import { QueryClient } from "react-query";
import { IAGGridFilter, IFilterRelationReference } from "../../common/wizards/entityTemplate/commonInterfaces";
import { ISearchFilter } from "../../interfaces/entities";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { filterRelationListToSearchFilter } from "../../common/wizards/entityTemplate/RelationshipReference/RelationFilterToBackend";
import { debounce } from "lodash";

export function isValidAGGridFilter(filter: IAGGridFilter | undefined): boolean {
    if (!filter) return false;

    switch (filter.filterType) {
        case 'text':
            return filter.filter !== undefined && filter.filter !== '';
        case 'number':
            return filter.filter !== undefined || (filter.type === 'inRange' && filter.filterTo !== undefined);
        case 'date':
            return filter.dateFrom !== null && (filter.type !== 'inRange' || filter.dateTo !== null);
        case 'set':
            return Array.isArray(filter.values) && filter.values.length > 0;
        default:
            return false;
    }
}

type FilterProcessingInput = {
    filter?: IFilterRelationReference[];
    templateId?: string;
};

export const useDebouncedFilter = (values: FilterProcessingInput, queryClient: QueryClient, debounceMs: number = 500) => {
    const memoizedFilter = useMemo((): ISearchFilter | undefined => {
        const { filter, templateId } = values;

        if (!templateId || !filter || filter.length === 0) return undefined;

        const validFilters = filter.filter(({ filterField }) => isValidAGGridFilter(filterField));

        if (validFilters.length === 0) return undefined;

        return filterRelationListToSearchFilter(validFilters, templateId, queryClient);
    }, [values.templateId, values.filter, queryClient]);

    const [debouncedFilter, setDebouncedFilter] = useState<ISearchFilter | undefined>(memoizedFilter);
    const isInitialMount = useRef(true);

    const debouncedSetFilter = useCallback(
        debounce((newFilter: ISearchFilter | undefined) => {
            setDebouncedFilter(newFilter);
        }, debounceMs),
        [debounceMs],
    );

    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            setDebouncedFilter(memoizedFilter);
            return;
        }

        debouncedSetFilter(memoizedFilter);
    }, [memoizedFilter, debouncedSetFilter]);

    useEffect(() => {
        return () => {
            debouncedSetFilter.cancel();
        };
    }, [debouncedSetFilter]);

    return debouncedFilter;
};
