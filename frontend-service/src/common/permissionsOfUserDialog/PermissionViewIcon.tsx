import React from 'react';
import { Checkbox, Tooltip } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import ClearIcon from '@mui/icons-material/Clear';

const CheckedIcon = () => <CheckIcon htmlColor="green" />;
const UncheckedIcon = () => <ClearIcon htmlColor="#a81105" />;

const PermissionViewIcon = ({ checked }: { checked: boolean }) => {
    const determineIcon = () => {
        if (checked) {
            return <CheckedIcon />;
        }
        return <UncheckedIcon />;
    };

    return <Checkbox icon={determineIcon()} checkedIcon={determineIcon()} disableRipple sx={{ cursor: 'default' }} checked={checked} />;
};

export default PermissionViewIcon;
