import { Collapse, Grid, IconButton, Typography, useTheme } from '@mui/material';
import React, { useState } from 'react';
import { FilterList } from '@mui/icons-material';
import i18next from 'i18next';
import ArrowLeftRoundedIcon from '@mui/icons-material/ArrowLeftRounded';
import { permissionTypeCheckboxProps } from './instancesPermissionsCard';
import { IDefaultPermissionDetails, IPermissionMetadata, PermissionScope } from '../../interfaces/permissions';
import PermissionScopeBtn from './PermissionScopeBtn';
import { entityTemplatePermissionDialog } from '../../utils/permissions/permissionOfUserDialog';
import { ColoredEnumChip } from '../ColoredEnumChip';
import { ViewType } from '../../interfaces/childTemplates';
import { InstancesSubclassesPermissions } from '../../interfaces/permissions/permissions';

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
    const { childTemplates } = entityTemplate;

    const hasChildTemplates = childTemplates && childTemplates.length > 0;

    return (
        <Grid container xs={12} key={entityTemplate.id}>
            <Grid item xs={1.2} />
            <Grid item xs={4.8} display="flex" alignItems="center">
                {hasChildTemplates && (
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
                )}
                <Typography fontSize={14.5}>{entityTemplate.name}</Typography>
            </Grid>
            <Grid item xs={0.5} />
            {!entityTemplate.isParentTemplateInDifferentCategory && (
                <>
                    <Grid item xs={2.5}>
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
                    <Grid item xs={0.5} />
                    <Grid item xs={2.5}>
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
            <Grid item xs={12}>
                <Collapse in={openChildTemplateList}>
                    {childTemplates?.map((childTemplate) => {
                        return (
                            <Grid container xs={12} key={childTemplate.id}>
                                <Grid xs={1.3} />
                                <Grid xs={4.7} display="flex" alignItems="center">
                                    <Grid display="flex" alignItems="center" gap="8px">
                                        <FilterList
                                            fontSize="small"
                                            sx={{
                                                fontSize: '14px',
                                            }}
                                        />
                                        <Typography fontSize={14.5}>{childTemplate.name}</Typography>
                                        {childTemplate.viewType === ViewType.userPage && (
                                            <ColoredEnumChip
                                                color="#CF9030"
                                                label={i18next.t('createChildTemplateDialog.permissionsPage.userPage')}
                                            />
                                        )}
                                        {childTemplate.isFilterByCurrentUser && (
                                            <ColoredEnumChip color="#0072C6" label={i18next.t('createChildTemplateDialog.permissionsPage.user')} />
                                        )}
                                        {childTemplate.isFilterByUserUnit && (
                                            <ColoredEnumChip color="#2CB93A" label={i18next.t('createChildTemplateDialog.permissionsPage.unit')} />
                                        )}
                                    </Grid>
                                </Grid>
                                {childTemplate.viewType === ViewType.categoryPage && (
                                    <Grid container xs={6}>
                                        <Grid xs={1} />
                                        <Grid xs={5}>
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
                                        <Grid xs={1} />
                                        <Grid xs={5}>
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
