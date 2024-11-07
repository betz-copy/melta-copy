import React, { useEffect, useState } from 'react';
import { Checkbox } from '@mui/material';
import { IHeaderParams } from '@ag-grid-community/core';

interface CustomHeaderCheckboxProps extends IHeaderParams {
    setSelectAll: React.Dispatch<React.SetStateAction<boolean>>;
}

export const CustomHeaderCheckbox: React.FC<CustomHeaderCheckboxProps> = ({ api, setSelectAll }) => {
    const [isChecked, setIsChecked] = useState(false);
    const [indeterminate, setIndeterminate] = useState(false);

    const getStatusBarComponent = () =>
        // TODO use interface
        api.getStatusPanel<{
            getSelectAll: () => boolean;
            setSelectAll: (newSelectAll: boolean) => void;
            getIndeterminate: () => boolean;
        }>('selectRowCount')!;

    useEffect(() => {
        if (isChecked) api.forEachNode((node) => node.setSelected(true));
        else api.forEachNode((node) => node.setSelected(false));
    }, [isChecked, api]);

    const handleCheckboxChange = () => {
        setIsChecked((prev) => {
            const newCheckedState = !prev;
            api.forEachNode((node) => node.setSelected(!!newCheckedState));

            getStatusBarComponent().setSelectAll(newCheckedState);

            setSelectAll(!!newCheckedState);
            return newCheckedState;
        });
    };

    useEffect(() => {
        const handleIndeterminate = () => {
            setIndeterminate(getStatusBarComponent().getIndeterminate());
        };

        api.addEventListener('selectionChanged', handleIndeterminate);

        return () => api.removeEventListener('selectionChanged', handleIndeterminate);
    }, [api]);

    return (
        <Checkbox checked={isChecked} sx={{ marginLeft: '-0.7rem' }} onChange={handleCheckboxChange} color="primary" indeterminate={indeterminate} />
    );
};
