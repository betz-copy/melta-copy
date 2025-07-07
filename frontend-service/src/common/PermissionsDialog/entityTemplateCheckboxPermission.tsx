import { Collapse, Grid, IconButton, Typography, useTheme } from '@mui/material';
import React, { useState } from 'react';
import ArrowLeftRoundedIcon from '@mui/icons-material/ArrowLeftRounded';
import { permissionTypeCheckboxProps } from './instancesPermissionsCard';
import { IDefaultPermissionDetails, IPermissionMetadata, PermissionScope } from '../../interfaces/permissions';
import PermissionScopeBtn from './PermissionScopeBtn';
import { entityTemplatePermissionDialog } from '../../utils/permissions/permissionOfUserDialog';
import { FilterList } from '@mui/icons-material';
import { ColoredEnumChip } from '../ColoredEnumChip';
import i18next from 'i18next';
import { ViewType } from '../../interfaces/entityChildTemplates';
import { InstancesSubclassesPermissions } from '../../interfaces/permissions/permissions';

const EntityTemplateCheckboxPermission: React.FC<{
    entityTemplate: entityTemplatePermissionDialog;
    changePermissions: (checked: boolean, entityId: string, permissionScope: PermissionScope, childTemplateId?: string) => void;
    disabled: boolean;
    permissionType: permissionTypeCheckboxProps;
    viewMode: boolean;
    categoryPermissions: IPermissionMetadata<
        [InstancesSubclassesPermissions.entityTemplates, InstancesSubclassesPermissions.entityChildTemplates],
        IDefaultPermissionDetails
    >;
    isParentTemplateInDifferentCategory?: boolean;
}> = ({ entityTemplate, changePermissions, disabled, permissionType, viewMode, categoryPermissions, isParentTemplateInDifferentCategory }) => {
    const theme = useTheme();
    const [openChildTemplateList, setOpenChildTemplateList] = useState(false);
    const childTemplates = entityTemplate.entityChildTemplates;
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
            {!isParentTemplateInDifferentCategory && (
                <>
                    <Grid item xs={2.5}>
                        <PermissionScopeBtn
                            viewMode={viewMode}
                            defaultChecked={
                                categoryPermissions?.entityTemplates?.[entityTemplate.id]?.scope !== undefined || permissionType.read.checked
                            }
                            onChange={(_event, checked) => changePermissions(checked, entityTemplate.id, PermissionScope.read)}
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
                            onChange={(_event, checked) => changePermissions(checked, entityTemplate.id, PermissionScope.write)}
                            disabled={disabled}
                            checkboxSx={{ width: '17px', height: '17px' }}
                        />
                    </Grid>
                </>
            )}
            <Grid item xs={12}>
                <Collapse in={openChildTemplateList}>
                    {childTemplates?.map((childTemplateCheck) => {
                        return (
                            <Grid container xs={12} key={childTemplateCheck.id}>
                                <Grid xs={1.3} />
                                <Grid xs={4.7} display="flex" alignItems="center">
                                    <Grid display="flex" alignItems="center" gap="8px">
                                        <FilterList
                                            fontSize="small"
                                            sx={{
                                                fontSize: '14px',
                                            }}
                                        />
                                        <Typography fontSize={14.5}>{childTemplateCheck.name}</Typography>
                                        {childTemplateCheck.viewType === ViewType.userPage && (
                                            <ColoredEnumChip
                                                color="#CF9030"
                                                label={i18next.t('createChildTemplateDialog.permissionsPage.userPage')}
                                            />
                                        )}
                                        {childTemplateCheck.isFilterByCurrentUser && (
                                            <ColoredEnumChip color="#0072C6" label={i18next.t('createChildTemplateDialog.permissionsPage.user')} />
                                        )}
                                        {childTemplateCheck.isFilterByUserUnit && (
                                            <ColoredEnumChip color="#2CB93A" label={i18next.t('createChildTemplateDialog.permissionsPage.unit')} />
                                        )}
                                    </Grid>
                                </Grid>
                                {childTemplateCheck.viewType === ViewType.categoryPage && (
                                    <Grid container xs={6}>
                                        <Grid xs={1} />
                                        <Grid xs={5}>
                                            <PermissionScopeBtn
                                                viewMode={viewMode}
                                                defaultChecked={
                                                    categoryPermissions?.entityTemplates?.[entityTemplate.id]?.entityChildTemplates?.[
                                                        childTemplateCheck.id
                                                    ]?.scope !== undefined || permissionType.read.checked
                                                }
                                                onChange={(_event, checked) =>
                                                    changePermissions(checked, entityTemplate.id, PermissionScope.read, childTemplateCheck.id)
                                                }
                                                disabled={
                                                    disabled ||
                                                    categoryPermissions?.entityTemplates?.[entityTemplate.id]?.entityChildTemplates?.[
                                                        childTemplateCheck.id
                                                    ]?.scope === PermissionScope.write ||
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
                                                    categoryPermissions?.entityTemplates?.[entityTemplate.id]?.entityChildTemplates?.[
                                                        childTemplateCheck.id
                                                    ]?.scope === PermissionScope.write || permissionType.write.checked
                                                }
                                                onChange={(_event, checked) =>
                                                    changePermissions(checked, entityTemplate.id, PermissionScope.write, childTemplateCheck.id)
                                                }
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
