import { Box, Button, CircularProgress, DialogActions, DialogContent, DialogTitle, Grid, TextField } from '@mui/material';
import { Form, Formik, FormikProps } from 'formik';
import i18next from 'i18next';
import _cloneDeep from 'lodash.clonedeep';
import _isEqual from 'lodash.isequal';
import React from 'react';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import * as Yup from 'yup';

import { PermissionData, RelatedPermission } from '../../interfaces/users';
import { IRole } from '../../interfaces/roles';
import { createRoleRequest, getAllWorkspaceRolesRequest, syncPermissionsRequest } from '../../services/userService';
import { useDarkModeStore } from '../../stores/darkMode';
import { useUserStore } from '../../stores/user';
import { useWorkspaceStore } from '../../stores/workspace';

import { didPermissionsChange, userHasNoPermissions, createDialogCategories } from '../../utils/permissions/permissionOfUserDialog';
import { IEntityTemplateMap } from '../../interfaces/entityTemplates';
import ManagePermissions from './managePermissions';
import { BlueTitle } from '../BlueTitle';
import { IChildTemplateMap } from '../../interfaces/childTemplates';

const RoleDialog: React.FC<{
    handleClose: () => void;
    mode: 'create' | 'edit' | 'view';
    existingRole?: IRole;
    onSuccess?: (user?: IRole) => void;
}> = ({ handleClose, mode, existingRole, onSuccess }) => {
    const currentUser = useUserStore((state) => state.user);
    const setUser = useUserStore((state) => state.setUser);
    const workspace = useWorkspaceStore((state) => state.workspace);
    const darkMode = useDarkModeStore((state) => state.darkMode);

    const defaultEmptyRole = {
        permissions: {},
        name: '',
    } as IRole;

    const queryClient = useQueryClient();

    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;
    const childTemplates = queryClient.getQueryData<IChildTemplateMap>('getChildEntityTemplates')!;

    const { data: workspaceRoles, refetch: refetchWorkspaceRoles } = useQuery(
        ['getAllWorkspaceRolesRequest', workspace],
        () => getAllWorkspaceRolesRequest([workspace._id]),
        {
            enabled: !!workspace,
            staleTime: Infinity,
            cacheTime: Infinity,
            retry: false,
        },
    );

    const { mutate: createRole } = useMutation((formRole: IRole) => createRoleRequest(formRole.name, formRole.permissions), {
        onError: (error: any) => {
            console.error('failed to upsert permission. error:', error);
            const uniqueRoleNameError = error.response.data.metadata.message === 'role name needs to be unique';
            toast.error(
                i18next.t(
                    `permissions.permissionsOfRoleDialog.${
                        uniqueRoleNameError ? 'userAlreadyExistOnCreateMessage' : 'failedToCreatePermissionsOfRole'
                    }`,
                ),
            );
        },
        onSuccess: () => {
            onSuccess?.();
            queryClient.invalidateQueries('allIFrames');
            refetchWorkspaceRoles();
            toast.success(i18next.t('permissions.permissionsOfRoleDialog.succeededToCreatePermission'));
            handleClose();
        },
    });

    const { mutate: syncRolePermissions } = useMutation(
        async (formRole: IRole) => {
            return syncPermissionsRequest(formRole._id, RelatedPermission.Role, {
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
                if (!existingRole) return;

                onSuccess?.({ ...existingRole, permissions: newPermissions });

                if (existingRole?._id === currentUser._id && !_isEqual(currentUser.currentWorkspacePermissions, newPermissions[workspace._id])) {
                    setUser({
                        ...currentUser,
                        permissions: { ...currentUser.permissions, ...newPermissions },
                        currentWorkspacePermissions: newPermissions[workspace._id],
                    });
                }

                refetchWorkspaceRoles();
                queryClient.invalidateQueries('allIFrames');
                toast.success(i18next.t('permissions.permissionsOfRoleDialog.succeededToUpdatePermission'));
                handleClose();
            },
        },
    );

    return (
        <Formik
            initialValues={existingRole ? _cloneDeep(existingRole) : defaultEmptyRole}
            validationSchema={Yup.object({
                name: Yup.string().nullable().required(i18next.t('validation.required')),
            }).unknown(true)}
            validate={({ name }: IRole) => {
                if (mode === 'create' && workspaceRoles?.find((role) => role.name === name)) {
                    return { name: i18next.t('permissions.permissionsOfRoleDialog.userAlreadyExistOnCreateMessage') };
                }

                return {};
            }}
            onSubmit={(formRole) => {
                if (mode === 'create') createRole(formRole);
                else syncRolePermissions(formRole);
            }}
        >
            {(formikProps: FormikProps<IRole>) => {
                const { values, touched, errors, handleBlur, setFieldValue, isSubmitting, initialValues } = formikProps;
                return (
                    <Form>
                        <DialogTitle>
                            {mode !== 'view' && (
                                <BlueTitle
                                    title={i18next.t(`permissions.permissionsOfRoleDialog.${mode}Title`)}
                                    component="h6"
                                    variant="h6"
                                    style={{ fontWeight: 600 }}
                                />
                            )}
                        </DialogTitle>
                        <DialogContent>
                            <Box sx={{ bgcolor: darkMode ? '#242424' : 'white', marginBottom: '15px', marginTop: '5px' }}>
                                <TextField
                                    fullWidth
                                    value={values.name}
                                    onChange={({ target: { value: newValue } }) => setFieldValue('name', newValue)}
                                    onBlur={handleBlur}
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
                                    error={Boolean(touched.name && errors.name)}
                                    helperText={touched.name ? errors.name : ''}
                                />
                            </Box>

                            {/* dont show management permissions to regular user (if dont have at all) */}
                            <ManagePermissions
                                mode={mode}
                                dialogPermissionData={createDialogCategories(
                                    Array.from(entityTemplates.values()),
                                    Array.from(childTemplates.values()),
                                )}
                                formikProps={formikProps as FormikProps<PermissionData>}
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
                                                isSubmitting ||
                                                didPermissionsChange(initialValues.permissions, values.permissions) ||
                                                userHasNoPermissions(values.permissions[workspace._id])
                                            }
                                            variant="contained"
                                        >
                                            {mode === 'create' && i18next.t('permissions.permissionsOfUserDialog.createBtn')}
                                            {mode === 'edit' && i18next.t('permissions.permissionsOfUserDialog.saveBtn')}
                                            {isSubmitting && <CircularProgress size={20} />}
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
