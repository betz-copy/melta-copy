import { ArrowLeftRounded, FilterList } from '@mui/icons-material';
import { Collapse, Grid, IconButton, Typography, useTheme } from '@mui/material';
import i18next from 'i18next';
import React, { useState } from 'react';
import { ViewType } from '../../interfaces/childTemplates';
import { IDefaultPermissionDetails, IPermissionMetadata, PermissionScope } from '../../interfaces/permissions';
import { InstancesSubclassesPermissions } from '../../interfaces/permissions/permissions';
import { entityTemplatePermissionDialog } from '../../utils/permissions/permissionOfUserDialog';
import { ColoredEnumChip } from '../ColoredEnumChip';
import { permissionTypeCheckboxProps } from './instancesPermissionsCard';
import PermissionScopeBtn from './PermissionScopeBtn';

const EntityTemplateCheckboxPermission: React.FC<{
    entityTemplate: entityTemplatePermissionDialog;
    changePermissions: (checked: boolean, templateIds: string[], permissionScope: PermissionScope) => void;
    disabled: boolean;
    permissionType: permissionTypeCheckboxProps;
    viewMode: boolean;
    categoryPermissions: IPermissionMetadata<[InstancesSubclassesPermissions.entityTemplates], IDefaultPermissionDetails>;
}> = ({ entityTemplate, changePermissions, disabled, permissionType, viewMode, categoryPermissions }) => {
    const theme = useTheme();
    const [openChildTemplateList, setOpenChildTemplateList] = useState(false);

    return (
        <Grid container size={{ xs: 12 }} key={entityTemplate.id}>
            <Grid size={{ xs: 1.2 }} />
            <Grid size={{ xs: 4.8 }} display="flex" alignItems="center">
                {entityTemplate.childTemplates && entityTemplate.childTemplates.length > 0 && (
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
                        <ArrowLeftRounded sx={{ rotate: openChildTemplateList ? '-90deg' : '0deg', transition: 'rotate 0.5s' }} />
                    </IconButton>
                )}
                <Typography fontSize={14.5}>{entityTemplate.name}</Typography>
            </Grid>
            <Grid size={{ xs: 0.5 }} />
            {!entityTemplate.isParentTemplateInDifferentCategory && (
                <>
                    <Grid size={{ xs: 2.5 }}>
                        <PermissionScopeBtn
                            viewMode={viewMode}
                            defaultChecked={
                                categoryPermissions?.entityTemplates?.[entityTemplate.id]?.scope !== undefined || permissionType.read.checked
                            }
                            onChange={(_event, checked) => {
                                changePermissions(
                                    checked,
                                    [entityTemplate.id, ...entityTemplate.childTemplates.map(({ id }) => id)],
                                    PermissionScope.read,
                                );
                            }}
                            disabled={
                                disabled ||
                                categoryPermissions?.entityTemplates?.[entityTemplate.id]?.scope === PermissionScope.write ||
                                permissionType.write.checked
                            }
                            checkboxSx={{ width: '17px', height: '17px' }}
                        />
                    </Grid>
                    <Grid size={{ xs: 0.5 }} />
                    <Grid size={{ xs: 2.5 }}>
                        <PermissionScopeBtn
                            viewMode={viewMode}
                            defaultChecked={
                                categoryPermissions?.entityTemplates?.[entityTemplate.id]?.scope === PermissionScope.write ||
                                permissionType.write.checked
                            }
                            onChange={(_event, checked) => {
                                changePermissions(
                                    checked,
                                    [entityTemplate.id, ...entityTemplate.childTemplates.map(({ id }) => id)],
                                    PermissionScope.write,
                                );
                            }}
                            disabled={disabled}
                            checkboxSx={{ width: '17px', height: '17px' }}
                        />
                    </Grid>
                </>
            )}
            <Grid size={{ xs: 12 }}>
                <Collapse in={openChildTemplateList}>
                    {entityTemplate.childTemplates?.map((childTemplate) => {
                        return (
                            <Grid container size={{ xs: 12 }} key={childTemplate.id}>
                                <Grid size={{ xs: 1.3 }} />
                                <Grid size={{ xs: 4.7 }} display="flex" alignItems="center">
                                    <Grid display="flex" alignItems="center" gap="8px">
                                        <FilterList
                                            fontSize="small"
                                            sx={{
                                                fontSize: '14px',
                                            }}
                                        />
                                        <Typography fontSize={14.5}>{childTemplate.name}</Typography>
                                        {childTemplate.viewType === ViewType.userPage && (
                                            <ColoredEnumChip enumColor="#CF9030" label={i18next.t('childTemplate.permissionsPage.userPage')} />
                                        )}
                                        {childTemplate.isFilterByCurrentUser && (
                                            <ColoredEnumChip enumColor="#0072C6" label={i18next.t('childTemplate.permissionsPage.user')} />
                                        )}
                                        {childTemplate.isFilterByUserUnit && (
                                            <ColoredEnumChip enumColor="#2CB93A" label={i18next.t('childTemplate.permissionsPage.unit')} />
                                        )}
                                    </Grid>
                                </Grid>
                                {childTemplate.viewType === ViewType.categoryPage && (
                                    <Grid container size={{ xs: 6 }}>
                                        <Grid size={{ xs: 1 }} />
                                        <Grid size={{ xs: 5 }}>
                                            <PermissionScopeBtn
                                                viewMode={viewMode}
                                                defaultChecked={
                                                    categoryPermissions?.entityTemplates?.[childTemplate.id]?.scope !== undefined ||
                                                    permissionType.read.checked
                                                }
                                                onChange={(_event, checked) => changePermissions(checked, [childTemplate.id], PermissionScope.read)}
                                                disabled={
                                                    disabled ||
                                                    categoryPermissions?.entityTemplates?.[childTemplate.id]?.scope === PermissionScope.write ||
                                                    permissionType.write.checked
                                                }
                                                checkboxSx={{ width: '17px', height: '17px' }}
                                            />
                                        </Grid>
                                        <Grid size={{ xs: 1 }} />
                                        <Grid size={{ xs: 5 }}>
                                            <PermissionScopeBtn
                                                viewMode={viewMode}
                                                defaultChecked={
                                                    categoryPermissions?.entityTemplates?.[childTemplate.id]?.scope === PermissionScope.write ||
                                                    permissionType.write.checked
                                                }
                                                onChange={(_event, checked) => changePermissions(checked, [childTemplate.id], PermissionScope.write)}
                                                disabled={disabled}
                                                checkboxSx={{ width: '17px', height: '17px' }}
                                            />
                                        </Grid>
                                    </Grid>
                                )}
                            </Grid>
                        );
                    })}
                </Collapse>
            </Grid>
        </Grid>
    );
};

export default EntityTemplateCheckboxPermission;
