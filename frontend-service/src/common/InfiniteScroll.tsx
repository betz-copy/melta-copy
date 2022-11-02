import { CircularProgress, Grid } from '@mui/material';
import React, { useRef, useEffect } from 'react';
import { GetNextPageParamFunction, QueryFunction, QueryKey, useInfiniteQuery } from 'react-query';

interface InfiniteScrollProps<T extends { _id: string }> {
    children: (item: T) => JSX.Element;
    queryKey: QueryKey;
    queryFunction: QueryFunction<T[]>;
    onQueryError: (err: any) => void;
    getNextPageParam?: GetNextPageParamFunction<T[]>;
    endText: string;
}

export const InfiniteScroll = <T extends { _id: string }>({
    children,
    queryKey,
    queryFunction,
    onQueryError,
    getNextPageParam = (lastPage, allPages) => (lastPage.length ? allPages.length : undefined),
    endText,
}: InfiniteScrollProps<T>) => {
    const ref = useRef(null);

    const { data, fetchNextPage, isFetchingNextPage } = useInfiniteQuery(queryKey, queryFunction, {
        getNextPageParam,
        onError: onQueryError,
        enabled: false,
        cacheTime: 0,
    });

    useEffect(() => {
        const currentRef = ref.current;
        if (!currentRef) return () => { }; // eslint-disable-line prettier/prettier

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !isFetchingNextPage) {
                    fetchNextPage();
                }
            },
            {
                rootMargin: '0px',
                threshold: 0,
            },
        );

        observer.observe(currentRef);
        return () => observer.unobserve(currentRef);
    }, [ref, isFetchingNextPage]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <Grid
            container
            direction="column"
            wrap="nowrap"
            marginBottom="3%"
            sx={{
                overflowX: 'hidden',
                overflowY: 'overlay',
            }}
        >
            {data?.pages.map((page) =>
                page.map((item) => (
                    <Grid item key={item._id}>
                        {children(item)}
                    </Grid>
                )),
            )}

            <Grid container ref={ref} justifyContent="center">
                {isFetchingNextPage ? <CircularProgress /> : endText}
            </Grid>
        </Grid>
    );
};
