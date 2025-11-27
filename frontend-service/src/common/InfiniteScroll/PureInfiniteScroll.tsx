import { Grid } from '@mui/material';
import { JSX, Key, useEffect, useRef } from 'react';
import { GetNextPageParamFunction, QueryFunction, QueryKey, useInfiniteQuery } from 'react-query';
import { ShowMore } from './ShowMore';

export interface PureInfiniteScrollProps<T> {
    children: (item: T) => JSX.Element;
    getItemId?: (item: T) => Key;
    queryKey: QueryKey;
    queryFunction: QueryFunction<T[]>;
    onQueryError: (err: any) => void;
    getNextPageParam?: GetNextPageParamFunction<T[]>;
    emptyText?: string;
    endText?: string;
    openIds?: Map<string, boolean>;
}

export const PureInfiniteScroll = <T,>({
    children,
    queryKey,
    queryFunction,
    onQueryError,
    getItemId = (item) => (item as { _id: string })._id,
    getNextPageParam = (lastPage, allPages) => (lastPage.length ? allPages.length : undefined),
    emptyText,
    endText,
    openIds,
}: PureInfiniteScrollProps<T>) => {
    const showMoreRef = useRef<HTMLDivElement>(null);

    const { data, fetchNextPage, isFetchingNextPage, hasNextPage, isLoading, isRefetching } = useInfiniteQuery(queryKey, queryFunction, {
        getNextPageParam,
        onError: onQueryError,
    });

    useEffect(() => {
        const currentShowMoreRef = showMoreRef.current;
        if (!currentShowMoreRef) return () => {};

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !isFetchingNextPage && hasNextPage) {
                    fetchNextPage();
                }
            },
            {
                rootMargin: '0px',
                threshold: 0,
            },
        );

        observer.observe(currentShowMoreRef);
        return () => observer.unobserve(currentShowMoreRef);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showMoreRef, isFetchingNextPage, hasNextPage]);

    return (
        <Grid direction="column" width="100%">
            <Grid container direction="row" gap={3}>
                {data?.pages.map((page) =>
                    page.map((item) => (
                        <Grid
                            justifyContent="space-between"
                            key={getItemId(item)}
                            {...(openIds ? { xs: openIds?.get(getItemId(item) as string) && 12 } : {})}
                        >
                            {children(item)}
                        </Grid>
                    )),
                )}
            </Grid>

            <ShowMore
                ref={showMoreRef}
                isLoading={isLoading || isFetchingNextPage || hasNextPage || isRefetching}
                isEmpty={Boolean(data && data.pages.length && !data.pages[0].length)}
                emptyText={emptyText}
                endText={endText}
            />
        </Grid>
    );
};
