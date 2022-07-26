import { Checkbox } from '@mui/material';
import React from 'react';
import CheckIcon from '@mui/icons-material/Check';
import ClearIcon from '@mui/icons-material/Clear';

const CheckboxReadOnly: React.FC<{ checked: boolean }> = ({ checked }) => {
    return (
        <Checkbox
            icon={<ClearIcon htmlColor="#a81105" />}
            checkedIcon={<CheckIcon htmlColor="green" />}
            disableRipple
            sx={{ cursor: 'default' }}
            checked={checked}
        />
    );
};

export default CheckboxReadOnly;
