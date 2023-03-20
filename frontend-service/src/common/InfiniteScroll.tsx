import { CircularProgress, Grid } from '@mui/material';
import React, { useRef, useEffect, Key, CSSProperties } from 'react';
import { GetNextPageParamFunction, QueryFunction, QueryKey, useInfiniteQuery } from 'react-query';

interface InfiniteScrollProps<T> {
    children: (item: T) => JSX.Element;
    getItemId?: (item: T) => Key;
    queryKey: QueryKey;
    queryFunction: QueryFunction<T[]>;
    onQueryError: (err: any) => void;
    getNextPageParam?: GetNextPageParamFunction<T[]>;
    endText: string;
    styles?: CSSProperties;
}

export const InfiniteScroll = <T extends any>({
    children,
    queryKey,
    queryFunction,
    onQueryError,
    getItemId = (item) => (item as { _id: string })._id,
    getNextPageParam = (lastPage, allPages) => (lastPage.length ? allPages.length : undefined),
    endText,
    styles = {},
}: InfiniteScrollProps<T>) => {
    const showMoreRef = useRef(null);

    const { data, fetchNextPage, isFetchingNextPage, hasNextPage, isLoading, isRefetching } = useInfiniteQuery(queryKey, queryFunction, {
        getNextPageParam,
        onError: onQueryError,
    });

    useEffect(() => {
        const currentShowMoreRef = showMoreRef.current;
        if (!currentShowMoreRef) return () => { };

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
    }, [showMoreRef, isFetchingNextPage, hasNextPage]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <Grid
            container
            direction="column"
            wrap="nowrap"
            marginBottom="3%"
            sx={{
                overflowX: 'hidden',
                overflowY: 'overlay',
                ...styles,
            }}
        >
            {data?.pages.map((page) =>
                page.map((item) => (
                    <Grid item key={getItemId(item)}>
                        {children(item)}
                    </Grid>
                )),
            )}

            <Grid container ref={showMoreRef} justifyContent="center" marginTop="0.5rem">
                {/* always show loading if hasNextPage, even if not started loading */}
                {isLoading || isFetchingNextPage || hasNextPage || isRefetching ? <CircularProgress /> : endText}
            </Grid>
        </Grid>
    );
};
