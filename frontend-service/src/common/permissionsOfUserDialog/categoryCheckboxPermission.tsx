import { Collapse, Grid, IconButton, Typography, useTheme } from '@mui/material';
import React, { useState } from 'react';
import ArrowLeftRoundedIcon from '@mui/icons-material/ArrowLeftRounded';
import { MeltaCheckbox } from '../MeltaCheckbox';
import PermissionViewIcon from './PermissionViewIcon';
import { permissionTypeCheckboxProps } from './instancesPermissionsCard';

const CategoryCheckboxPermission: React.FC<{
    categoryDisplayName: string;
    viewMode: boolean;
    permissionType: permissionTypeCheckboxProps;
    disabled: boolean;
}> = ({ categoryDisplayName, viewMode, permissionType, disabled }) => {
    const theme = useTheme();
    const [openEntitiesList, setOpenEntitiesList] = useState(false);
    const array = ['a', 'b', 'c'];

    console.log({ permissionType });

    return (
        <Grid item container>
            <Grid xs={6} display="flex" alignItems="center">
                <IconButton
                    aria-label="arrowLeftRounded"
                    onClick={() => {
                        setOpenEntitiesList((prev) => !prev);
                    }}
                    size="small"
                    sx={{ color: theme.palette.primary.main, padding: '0', marginRight: '5px', transform: '180deg', boxSizing: 'border-box' }}
                >
                    <ArrowLeftRoundedIcon sx={{ rotate: openEntitiesList ? '-90deg' : '0deg', transition: 'rotate 0.5s' }} />
                </IconButton>
                <Typography>{categoryDisplayName}</Typography>
            </Grid>
            <Grid xs={3}>
                {viewMode ? (
                    <PermissionViewIcon checked={permissionType.read.checked} />
                ) : (
                    <MeltaCheckbox
                        checked={permissionType.read.checked}
                        onChange={permissionType.read.onChange}
                        disabled={disabled || permissionType.write.checked}
                    />
                )}
            </Grid>
            <Grid xs={3}>
                {viewMode ? (
                    <PermissionViewIcon checked={permissionType.write.checked} />
                ) : (
                    <MeltaCheckbox checked={permissionType.write.checked} onChange={permissionType.write.onChange} disabled={disabled} />
                )}
            </Grid>
            <Grid xs={12}>
                <Collapse in={openEntitiesList}>
                    {array.map((entityCheck) => {
                        return (
                            <Grid container xs={12} key={entityCheck} spacing={1}>
                                <Grid xs={1} />
                                <Grid xs={5} display="flex" alignItems="center">
                                    <Typography>{entityCheck}</Typography>
                                </Grid>
                                <Grid xs={0.5} />

                                <Grid xs={2.5}>
                                    {viewMode ? (
                                        <PermissionViewIcon checked={permissionType.read.checked} />
                                    ) : (
                                        <MeltaCheckbox
                                            checked={permissionType.read.checked}
                                            onChange={permissionType.read.onChange}
                                            disabled={disabled || permissionType.write.checked}
                                            height="17px"
                                            width="17px"
                                        />
                                    )}
                                </Grid>
                                <Grid xs={0.5} />
                                <Grid xs={2.5}>
                                    {viewMode ? (
                                        <PermissionViewIcon checked={permissionType.write.checked} />
                                    ) : (
                                        <MeltaCheckbox
                                            checked={permissionType.write.checked}
                                            onChange={permissionType.write.onChange}
                                            disabled={disabled}
                                            height="17px"
                                            width="17px"
                                        />
                                    )}
                                </Grid>
                            </Grid>
                        );
                    })}
                </Collapse>
            </Grid>
        </Grid>
    );
};

export default CategoryCheckboxPermission;
