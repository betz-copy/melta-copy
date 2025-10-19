import { Check, Clear, HorizontalRule } from '@mui/icons-material';
import { Checkbox } from '@mui/material';
import React from 'react';

const CheckedIcon = () => <Check htmlColor="green" />;
const UncheckedIcon = () => <Clear htmlColor="#a81105" />;
const IndeterminateIcon = () => <HorizontalRule htmlColor="grey" />;

const PermissionViewIcon = ({ checked, indeterminate }: { checked: boolean; indeterminate?: boolean }) => {
    const determineIcon = () => {
        if (checked) {
            return <CheckedIcon />;
        }
        return <UncheckedIcon />;
    };

    return (
        <Checkbox
            icon={determineIcon()}
            checkedIcon={determineIcon()}
            disableRipple
            sx={{ cursor: 'default' }}
            checked={checked}
            indeterminate={indeterminate}
            indeterminateIcon={IndeterminateIcon()}
        />
    );
};

export default PermissionViewIcon;
