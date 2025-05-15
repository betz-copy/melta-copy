import { Box, Button, CircularProgress, DialogActions, DialogContent, DialogTitle, Grid, TextField } from '@mui/material';
import { Form, Formik, FormikProps } from 'formik';
import i18next from 'i18next';
import _cloneDeep from 'lodash.clonedeep';
import _isEqual from 'lodash.isequal';
import React from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import * as Yup from 'yup';

import { IRole, IUser } from '../../interfaces/users';
import { createUserRequest, syncRolePermissionsRequest } from '../../services/userService';
import { useDarkModeStore } from '../../stores/darkMode';
import { useUserStore } from '../../stores/user';
import { useWorkspaceStore } from '../../stores/workspace';

import {
    CategoryWithTemplates,
    didPermissionsChange,
    entityTemplatePermissionDialog,
    userHasNoPermissions,
} from '../../utils/permissions/permissionOfUserDialog';
import { IEntityTemplateMap } from '../../interfaces/entityTemplates';
import ManagePermissions from './managePermissions';
import { BlueTitle } from '../BlueTitle';

const RoleDialog: React.FC<{
    handleClose: () => void;
    mode: 'create' | 'edit' | 'view';
    existingUser?: IUser;
    onSuccess?: (user?: IUser) => void;
}> = ({ handleClose, mode, existingUser, onSuccess }) => {
    const currentUser = useUserStore((state) => state.user);
    const setUser = useUserStore((state) => state.setUser);
    const workspace = useWorkspaceStore((state) => state.workspace);
    const darkMode = useDarkModeStore((state) => state.darkMode);

    const defaultEmptyRole = {
        permissions: {},
        name: '',
    } as IRole;

    const queryClient = useQueryClient();
    const allUsers = queryClient.getQueryData<IUser[]>('getAllUsers');

    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;
    const dialogPermissionData: Map<string, CategoryWithTemplates> = new Map();

    Array.from(entityTemplates.values()).forEach((entity) => {
        const category: CategoryWithTemplates = {
            entityTemplates: dialogPermissionData.get(entity.category._id)?.entityTemplates || [],
            ...entity.category,
        };
        const displayEntity: entityTemplatePermissionDialog = {
            id: entity._id,
            name: entity.displayName,
        };
        category.entityTemplates = category?.entityTemplates ? [...category.entityTemplates, displayEntity] : [displayEntity];
        dialogPermissionData.set(entity.category._id, category);
    });

    // const { mutate: createRole } = useMutation(
    //     (formRole: IRole) =>
    //         createUserRequest(formRole.externalMetadata.kartoffelId, formRole.externalMetadata.digitalIdentitySource, formRole.permissions),
    //     {
    //         onError: (error) => {
    //             console.error('failed to upsert permission. error:', error);
    //             toast.error(i18next.t('permissions.permissionsOfRoleDialog.failedToCreatePermissionsOfRole'));
    //         },
    //         onSuccess: () => {
    //             onSuccess?.();
    //             queryClient.invalidateQueries('allIFrames');
    //             toast.success(i18next.t('permissions.permissionsOfRoleDialog.succeededToCreatePermission'));
    //             handleClose();
    //         },
    //     },
    // );

    const { mutate: syncRolePermissions } = useMutation(
        async (formRole: IRole) => {
            return syncRolePermissionsRequest(formRole.name, {
                [workspace._id]: {
                    ...formRole.permissions[workspace._id],
                },
            });
        },
        {
            onError: (error) => {
                console.error('failed to upsert permission. error:', error);
                toast.error(i18next.t('permissions.permissionsOfRoleDialog.failedToEditPermissionsOfRole'));
            },
            onSuccess: (newPermissions) => {
                if (!existingUser) return;

                onSuccess?.({ ...existingUser, permissions: newPermissions });

                if (existingUser?._id === currentUser._id && !_isEqual(currentUser.currentWorkspacePermissions, newPermissions[workspace._id])) {
                    setUser({
                        ...currentUser,
                        permissions: { ...currentUser.permissions, ...newPermissions },
                        currentWorkspacePermissions: newPermissions[workspace._id],
                    });
                }

                queryClient.invalidateQueries('allIFrames');
                toast.success(i18next.t('permissions.permissionsOfRoleDialog.succeededToUpdatePermission'));
                handleClose();
            },
        },
    );

    return (
        <Formik
            initialValues={existingUser ? _cloneDeep(existingUser) : defaultEmptyRole}
            validationSchema={Yup.object({
                name: Yup.string().nullable().required(i18next.t('validation.required')),
            }).unknown(true)}
            validate={(formRole: IRole) => {
                if (mode === 'create' && allUsers?.some(({ _id }) => _id === formRole.name)) {
                    return { fullName: i18next.t('permissions.permissionsOfRoleDialog.userAlreadyExistOnCreateMessage') };
                }

                return {};
            }}
            onSubmit={(formRole) => {
                // if (mode === 'create') createRole(formRole);
                // else
                syncRolePermissions(formRole);
            }}
        >
            {(formikProps: FormikProps<IRole>) => {
                return (
                    <Form>
                        <DialogTitle>
                            {mode !== 'view' && (
                                <BlueTitle title={i18next.t(`permissions.permissionsOfRoleDialog.${mode}Title`)} component="h6" variant="h6" />
                            )}
                        </DialogTitle>
                        <DialogContent>
                            <Box sx={{ bgcolor: darkMode ? '#242424' : 'white', marginBottom: '15px' }}>
                                <TextField
                                    fullWidth
                                    value={formikProps.values.name}
                                    onChange={({ target: { value: newValue } }) => {
                                        formikProps.setFieldValue('name', newValue);
                                    }}
                                    onBlur={formikProps.handleBlur}
                                    label={i18next.t('permissions.roleHeaderName')}
                                    InputLabelProps={{
                                        shrink: mode === 'view' || undefined,
                                        style: {
                                            fontSize: '14px',
                                        },
                                    }}
                                    inputProps={{
                                        readOnly: mode === 'view',
                                        style: {
                                            textOverflow: 'ellipsis',
                                            fontSize: '14px',
                                        },
                                    }}
                                    disabled={mode === 'edit'}
                                    error={Boolean(formikProps.touched.name && formikProps.errors.name)}
                                    helperText={formikProps.touched.name ? formikProps.errors.name : ''}
                                />
                            </Box>

                            {/* dont show management permissions to regular user (if dont have at all) */}
                            <ManagePermissions
                                mode={mode}
                                dialogPermissionData={dialogPermissionData}
                                formikProps={formikProps}
                                workspace={workspace}
                            />
                        </DialogContent>

                        <DialogActions sx={{ direction: 'rtl', marginRight: '1rem', marginBottom: '0.5rem' }}>
                            <Grid container justifyContent="space-between">
                                <Grid>
                                    {mode !== 'view' && (
                                        <Button
                                            type="submit"
                                            disabled={
                                                formikProps.isSubmitting ||
                                                didPermissionsChange(formikProps.initialValues.permissions, formikProps.values.permissions) ||
                                                userHasNoPermissions(formikProps.values.permissions[workspace._id])
                                            }
                                            variant="contained"
                                        >
                                            {mode === 'create' && i18next.t('permissions.permissionsOfUserDialog.createBtn')}
                                            {mode === 'edit' && i18next.t('permissions.permissionsOfUserDialog.saveBtn')}
                                            {formikProps.isSubmitting && <CircularProgress size={20} />}
                                        </Button>
                                    )}
                                </Grid>
                            </Grid>
                        </DialogActions>
                    </Form>
                );
            }}
        </Formik>
    );
};
export default RoleDialog;
