import React from 'react';
import { Checkbox } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import ClearIcon from '@mui/icons-material/Clear';
import HorizontalRuleIcon from '@mui/icons-material/HorizontalRule';

const CheckedIcon = () => <CheckIcon htmlColor="green" />;
const UncheckedIcon = () => <ClearIcon htmlColor="#a81105" />;
const IndeterminateIcon = () => <HorizontalRuleIcon htmlColor="grey" />;

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
