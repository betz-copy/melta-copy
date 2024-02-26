import React, { useEffect, useState } from 'react';
import { IStatusPanelParams } from '@ag-grid-community/core';
import i18next from 'i18next';
import { Grid, Typography } from '@mui/material';

const RowCountGridStatusBar: React.FC<IStatusPanelParams> = ({ api }) => {
    const [count, setCount] = useState<number>(0);

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
        <Grid container alignItems="center" sx={{ height: '45px' }}>
            <Typography fontSize="15px" color="rgba(0,0,0,0.54)">
                {`${i18next.t('entitiesTableOfTemplate.totalLines')} ${count}`}
            </Typography>
        </Grid>
    );
};

export { RowCountGridStatusBar };
