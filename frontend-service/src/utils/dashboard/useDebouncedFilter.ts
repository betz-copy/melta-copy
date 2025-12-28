import { debounce } from 'lodash';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { QueryClient } from 'react-query';
import { isValidAGGridFilter } from '../../common/FilterComponent';
import { IFilterTemplate } from '../../common/wizards/entityTemplate/commonInterfaces';
import { filterTemplateToSearchFilter } from '../../common/wizards/entityTemplate/RelationshipReference/TemplateFilterToBackend';
import { ISearchFilter } from '../../interfaces/entities';

type FilterProcessingInput = {
    filter?: IFilterTemplate[];
    templateId?: string;
};

export const useDebouncedFilter = (values: FilterProcessingInput, queryClient: QueryClient, debounceMs: number = 500) => {
    const memoizedFilter = useMemo((): ISearchFilter | undefined => {
        const { filter, templateId } = values;

        if (!templateId || !filter || filter.length === 0) return undefined;

        const validFilters = filter.filter(({ filterField }) => isValidAGGridFilter(filterField));

        if (validFilters.length === 0) return undefined;

        return filterTemplateToSearchFilter(validFilters, templateId, queryClient);
    }, [values, queryClient]);

    const [debouncedFilter, setDebouncedFilter] = useState<ISearchFilter | undefined>(memoizedFilter);
    const isInitialMount = useRef(true);

    const debouncedSetFilter = useCallback(
        debounce((newFilter: ISearchFilter | undefined) => {
            setDebouncedFilter(newFilter);
        }, debounceMs),
        [],
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
