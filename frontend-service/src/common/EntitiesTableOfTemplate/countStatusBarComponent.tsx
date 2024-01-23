import React, { useEffect, useState } from 'react';
import { IStatusPanelParams } from '@ag-grid-community/core';
import i18next from 'i18next';
import { Grid, Typography } from '@mui/material';

export default (props: IStatusPanelParams) => {
    const [count, setCount] = useState(0);
    const { api } = props;

    useEffect(() => {
        const updateCount = () => {
            const rowCount = api.getDisplayedRowCount();
            setCount(rowCount);
        };

        api.addEventListener('modelUpdated', updateCount);

        return () => {
            api.removeEventListener('modelUpdated', updateCount);
        };
    }, [api]);

    return (
        <Grid container alignItems="center" sx={{ height: 50 }}>
            <Typography marginRight={1}>{i18next.t('entitiesTableOfTemplate.totalLines')}</Typography>
            <Typography>{count}</Typography>
        </Grid>
    );
};
