import React, { useState, useEffect, useRef } from 'react';
import { Grid, Typography } from '@mui/material'; 
import i18next from 'i18next'; 

interface IStatusPanelParams {
    api: any; 
}

const RowCountGridStatusBar: React.FC<IStatusPanelParams> = ({ api }) => {
    const [count, setCount] = useState<number>(0);
    const isMounted = useRef<boolean>(false);

    useEffect(() => {
        isMounted.current = true;

        const updateCount = () => {
            if (isMounted.current) { 
                const rowCount = api.getDisplayedRowCount();
                setCount(rowCount);
            }
        };

        updateCount();
        api.addEventListener('modelUpdated', updateCount);

        return () => {
            isMounted.current = false;
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
