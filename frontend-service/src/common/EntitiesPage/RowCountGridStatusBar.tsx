import { IServerSideSelectionState, IStatusPanelParams } from '@ag-grid-community/core';
import { Grid, Typography } from '@mui/material';
import i18next from 'i18next';
import React, { useCallback, useEffect, useRef, useState } from 'react';

export const RowCountGridStatusBar: React.FC<IStatusPanelParams> = ({ api }) => {
    const [count, setCount] = useState(0);
    const [selectedCount, setSelectedCount] = useState(0);

    const isMounted = useRef<boolean>(false);

    const updateRowCount = useCallback(() => {
        if (isMounted.current) setCount(api.getDisplayedRowCount());
    }, [api]);

    const updateSelectedRowCount = useCallback(() => {
        const { selectAll, toggledNodes } = api.getServerSideSelectionState() as IServerSideSelectionState;

        if (selectAll) {
            const toggledNodesCount = toggledNodes.length;
            setSelectedCount(count - toggledNodesCount);
        } else setSelectedCount(api.getSelectedRows().length);
    }, [api, count]);

    useEffect(() => {
        isMounted.current = true;

        updateRowCount();
        updateSelectedRowCount();

        api.addEventListener('modelUpdated', updateRowCount);
        api.addEventListener('selectionChanged', updateSelectedRowCount);

        return () => {
            isMounted.current = false;
            api.removeEventListener('modelUpdated', updateRowCount);
            api.removeEventListener('selectionChanged', updateSelectedRowCount);
        };
    }, [api, updateRowCount, updateSelectedRowCount]);

    return (
        <Grid container alignItems="center" sx={{ height: '45px' }}>
            {!!selectedCount && (
                <Typography fontSize="15px" sx={{ opacity: 0.5, mr: 2 }}>
                    {`${i18next.t('entitiesTableOfTemplate.selectedLines')} : ${selectedCount}`}
                </Typography>
            )}
            <Typography fontSize="15px" sx={{ opacity: 0.5 }}>
                {`${i18next.t('entitiesTableOfTemplate.totalLines')} : ${count}`}
            </Typography>
        </Grid>
    );
};
