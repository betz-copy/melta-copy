import { CircularProgress, Grid } from '@mui/material';
import React, { forwardRef } from 'react';

interface ShowMoreProps {
    isLoading: boolean;
    isEmpty: boolean;
    emptyText?: string;
    endText?: string;
}

export const ShowMore = forwardRef<HTMLDivElement, ShowMoreProps>(({ isLoading, isEmpty, emptyText, endText = '' }, ref) => {
    const gridProps = { ref, container: true, justifyContent: 'center', marginTop: '2rem' };

    if (isLoading)
        return (
            <Grid {...gridProps}>
                <CircularProgress />
            </Grid>
        );

    if (isEmpty && emptyText) return <Grid {...gridProps}>{emptyText}</Grid>;

    if (endText) return <Grid {...gridProps}>{endText}</Grid>;

    return <div />;
});
