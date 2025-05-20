import { Grid, IconButton, Typography, useTheme } from '@mui/material';
import React, { useState } from 'react';
import ArrowLeftRoundedIcon from '@mui/icons-material/ArrowLeftRounded';
import { permissionTypeCheckboxProps } from './instancesPermissionsCard';
import { PermissionScope } from '../../interfaces/permissions';
import PermissionScopeBtn from './PermissionScopeBtn';
import { entityTemplatePermissionDialog } from '../../utils/permissions/permissionOfUserDialog';
const EntityTemplateCheckboxPermission: React.FC<{
    entityTemplate: entityTemplatePermissionDialog;
    changePermissions: (checked: boolean, entityId: string, permissionScope: PermissionScope) => void;
    disabled: boolean;
    permissionType: permissionTypeCheckboxProps;
    viewMode: boolean;
    categoryPermissions: any;
}> = ({ entityTemplate, changePermissions, disabled, permissionType, viewMode, categoryPermissions }) => {
    const theme = useTheme();
    const [openChildTemplateList, setOpenChildTemplateList] = useState(false);

    return (
        <Grid container xs={12} key={entityTemplate.id}>
            <Grid xs={1.2} />
            <Grid xs={4.8} display="flex" alignItems="center">
                <IconButton
                    aria-label="arrowLeftRounded"
                    onClick={() => {
                        setOpenChildTemplateList((prev) => !prev);
                    }}
                    size="small"
                    sx={{
                        color: theme.palette.primary.main,
                        padding: '0',
                        marginRight: '5px',
                        transform: '180deg',
                        boxSizing: 'border-box',
                    }}
                >
                    <ArrowLeftRoundedIcon sx={{ rotate: openChildTemplateList ? '-90deg' : '0deg', transition: 'rotate 0.5s' }} />
                </IconButton>
                <Typography fontSize={14.5}>{entityTemplate.name}</Typography>
            </Grid>
            <Grid xs={0.5} />
            <Grid xs={2.5}>
                <PermissionScopeBtn
                    viewMode={viewMode}
                    defaultChecked={categoryPermissions?.entityTemplates?.[entityTemplate.id]?.scope !== undefined || permissionType.read.checked}
                    onChange={(_event, checked) => changePermissions(checked, entityTemplate.id, PermissionScope.read)}
                    disabled={
                        disabled ||
                        categoryPermissions?.entityTemplates?.[entityTemplate.id]?.scope === PermissionScope.write ||
                        permissionType.write.checked
                    }
                    checkboxSx={{ width: '17px', height: '17px' }}
                />
            </Grid>
            <Grid xs={0.5} />
            <Grid xs={2.5}>
                <PermissionScopeBtn
                    viewMode={viewMode}
                    defaultChecked={
                        categoryPermissions?.entityTemplates?.[entityTemplate.id]?.scope === PermissionScope.write || permissionType.write.checked
                    }
                    onChange={(_event, checked) => changePermissions(checked, entityTemplate.id, PermissionScope.write)}
                    disabled={disabled}
                    checkboxSx={{ width: '17px', height: '17px' }}
                />
            </Grid>
        </Grid>
    );
};

export default EntityTemplateCheckboxPermission;
