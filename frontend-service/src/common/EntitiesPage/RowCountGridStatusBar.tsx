import React, { useState, useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Grid, Typography } from '@mui/material';
import i18next from 'i18next';
import { IStatusPanelParams } from '@ag-grid-community/core';

interface RowCountGridStatusBarProps extends IStatusPanelParams {
    selectAll: boolean;
    x: boolean;
}

export const RowCountGridStatusBar: React.FC<RowCountGridStatusBarProps> = forwardRef(({ api }, ref) => {
    const [count, setCount] = useState(0);
    const [selectedCount, setSelectedCount] = useState(0);
    const [notSelected, setNotSelected] = useState(new Set());
    const [selectAll, setSelectAll] = useState(false);

    useImperativeHandle(ref, () => ({
        getSelectAll: () => selectAll,
        setSelectAll: (newSelectAll: boolean) => setSelectAll(newSelectAll),
        getIndeterminate: () => !selectAll && selectedCount > 0,
        setNotSelectedSet: (newSet: Set<string>) => setNotSelected(newSet),
    }));

    const isMounted = useRef<boolean>(false);

    const updateRowCount = useCallback(() => {
        if (isMounted.current) setCount(api.getDisplayedRowCount());
    }, [api]);

    const updateSelectedRowCount = useCallback(() => {
        if (isMounted.current) setSelectedCount(api.getSelectedRows().length);
    }, [api]);

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
            {selectedCount > 0 && (
                <Typography fontSize="15px" sx={{ opacity: 0.5, mr: 2 }}>
                    {`${i18next.t('entitiesTableOfTemplate.selectedLines')} : ${
                        // eslint-disable-next-line no-nested-ternary
                        selectAll ? count : notSelected.size ? count - notSelected.size : selectedCount
                    }`}
                </Typography>
            )}
            <Typography fontSize="15px" sx={{ opacity: 0.5 }}>
                {`${i18next.t('entitiesTableOfTemplate.totalLines')} : ${count}`}
            </Typography>
        </Grid>
    );
});
