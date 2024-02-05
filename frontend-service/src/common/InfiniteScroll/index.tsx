import { Grid } from '@mui/material';
import React, { CSSProperties } from 'react';
import { PureInfiniteScroll, PureInfiniteScrollProps } from './PureInfiniteScroll';

interface InfiniteScrollProps<T> extends PureInfiniteScrollProps<T> {
    useContainer?: boolean;
    style?: CSSProperties;
}

export const InfiniteScroll = <T extends any>({ useContainer = true, style = {}, ...innerInfiniteScrollProps }: InfiniteScrollProps<T>) => {
    if (!useContainer) return <PureInfiniteScroll {...innerInfiniteScrollProps} />;

    return (
        <Grid
            container
            spacing={ 2 }
            marginBottom="3%"
            sx={{ ...style }}
        >
            <PureInfiniteScroll {...innerInfiniteScrollProps} />
        </Grid>
    );
};
