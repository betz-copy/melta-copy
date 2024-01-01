import React from 'react';
import { Checkbox, Tooltip } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import ClearIcon from '@mui/icons-material/Clear';
import { Scope } from '../../services/permissionsService';

const ReadIcon = () => (
    <Tooltip title="Add" arrow>
        <VisibilityOutlinedIcon htmlColor="green" />
    </Tooltip>
);
const CheckedIcon = () => <CheckIcon htmlColor="green" />;
const UncheckedIcon = () => <ClearIcon htmlColor="#a81105" />;

const PermissionViewIcon = ({ checked, scope }: { checked: boolean; scope?: Scope }) => {
    const determineIcon = () => {
        if (checked) {
            return scope === 'Read' ? <ReadIcon /> : <CheckedIcon />;
        }
        return <UncheckedIcon />;
    };

    return <Checkbox icon={determineIcon()} checkedIcon={determineIcon()} disableRipple sx={{ cursor: 'default' }} checked={checked} />;
};

export default PermissionViewIcon;
