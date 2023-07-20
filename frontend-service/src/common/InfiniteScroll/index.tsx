import React, { CSSProperties } from 'react';
import { Grid } from '@mui/material';
import { PureInfiniteScroll, PureInfiniteScrollProps } from './PureInfiniteScroll';

interface InfiniteScrollProps<T> extends PureInfiniteScrollProps<T> {
    useContainer?: boolean;
    style?: CSSProperties;
}

export const InfiniteScroll = <T extends any>({
    useContainer = true,
    style = {},
    ...innerInfiniteScrollProps
}: InfiniteScrollProps<T>) => {
    if (!useContainer) return <PureInfiniteScroll {...innerInfiniteScrollProps} />

    return (
        <Grid
            container
            direction="column"
            wrap="nowrap"
            marginBottom="3%"
            sx={{
                overflowX: 'hidden',
                overflowY: 'overlay',
                ...style,
            }}
        >
            <PureInfiniteScroll {...innerInfiniteScrollProps} />
        </Grid>
    );
};
