import { Grid, GridProps } from '@mui/material';
import { useMemo } from 'react';
import { PureInfiniteScroll, PureInfiniteScrollProps } from './PureInfiniteScroll';

interface InfiniteScrollProps<T> extends PureInfiniteScrollProps<T> {
    useContainer?: boolean;
    direction?: GridProps['direction'];
    wrap?: GridProps['wrap'];
    spacing?: GridProps['spacing'];
    style?: object;
}

export const InfiniteScroll = <T,>({
    useContainer = true,
    direction = 'column',
    wrap = 'nowrap',
    spacing,
    style = {},
    ...innerInfiniteScrollProps
}: InfiniteScrollProps<T>) => {
    const overflow = useMemo(() => {
        switch (direction) {
            case 'row':
            case 'row-reverse':
                return { overflowX: 'overlay', overflowY: 'hidden' };
            default:
                return { overflowX: 'hidden', overflowY: 'overlay' };
        }
    }, [direction]);

    if (!useContainer) return <PureInfiniteScroll {...innerInfiniteScrollProps} />;

    return (
        <Grid container direction={direction} wrap={wrap} spacing={spacing} marginBottom="3%" sx={{ ...overflow, ...style }}>
            <PureInfiniteScroll {...innerInfiniteScrollProps} />
        </Grid>
    );
};
