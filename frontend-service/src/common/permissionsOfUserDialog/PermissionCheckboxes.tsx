import React from 'react';
import { Checkbox, Grid } from '@mui/material';
import { CheckboxProps } from '@mui/material/Checkbox';

const PermissionCheckboxes: React.FC<{
    checkedRead: boolean;
    checkedWrite: boolean;
    disabled: boolean;
    onChangeRead: CheckboxProps['onChange'];
    onChangeWrite: CheckboxProps['onChange'];
}> = ({ checkedRead, checkedWrite, disabled, onChangeRead, onChangeWrite }) => {
    const handleWriteChange: CheckboxProps['onChange'] = (event, checked) => {
        onChangeWrite(event, checked);
        if (checked) {
            onChangeRead(event, true);
        }
    };

    return (
        <Grid container spacing={1}>
            <Grid item>
                <Checkbox checked={checkedRead} onChange={onChangeRead} disabled={disabled} />
            </Grid>
            <Grid item>
                <Checkbox checked={checkedWrite} onChange={handleWriteChange} disabled={disabled} />
            </Grid>
        </Grid>
    );
};

export { PermissionCheckboxes };
