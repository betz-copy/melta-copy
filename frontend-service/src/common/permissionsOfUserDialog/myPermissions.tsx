import { Box, Button, CircularProgress, DialogActions, DialogContent, DialogTitle, Grid } from '@mui/material';
import { Form, Formik, FormikProps } from 'formik';
import i18next from 'i18next';
import _cloneDeep from 'lodash.clonedeep';
import _isEqual from 'lodash.isequal';
import React, { useMemo } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import * as Yup from 'yup';
import { ICategoryMap } from '../../interfaces/categories';
import { PermissionScope, PermissionType } from '../../interfaces/permissions';
import { IUser } from '../../interfaces/users';
import { createUserRequest, deletePermissionsFromMetadata, syncUserPermissionsRequest } from '../../services/userService';
import { useDarkModeStore } from '../../stores/darkMode';
import { useUserStore } from '../../stores/user';
import { useWorkspaceStore } from '../../stores/workspace';
import {
    checkUserCategoryPermission,
    getCategoryPermissionsToSyncAndDelete,
    getUserPermissionScopeOfCategory,
} from '../../utils/permissions/instancePermissions';
import UserAutocomplete from '../inputs/UserAutocomplete';
import InstancesPermissionsCard from './instancesPermissionsCard';
import ManagementPermissionsCard from './managementPermissionsCard';
import { didPermissionsChange, userHasNoPermissions } from '../../utils/permissions/permissionOfUserDialog';

const MyPermissions: React.FC<{
    handleClose: () => void;
    mode: 'create' | 'edit' | 'view';
    existingUser?: IUser;
}> = ({ handleClose, mode, existingUser }) => {
    const currentUser = useUserStore((state) => state.user);
    const setUser = useUserStore((state) => state.setUser);
    const workspace = useWorkspaceStore((state) => state.workspace);
    const darkMode = useDarkModeStore((state) => state.darkMode);

    const defaultEmptyUser = {
        _id: '',
        fullName: '',
        jobTitle: '',
        hierarchy: '',
        mail: '',
        profile: '',
        preferences: {
            darkMode: false,
        },
        externalMetadata: {
            kartoffelId: '',
            digitalIdentitySource: '',
        },
        permissions: {},
        displayName: '',
    } as IUser;

    const queryClient = useQueryClient();
    const categories = queryClient.getQueryData<ICategoryMap>('getCategories')!;
    const allUsers = queryClient.getQueryData<IUser[]>('getAllUsers');
    const permissionsPath = useMemo(() => `permissions.${workspace._id}`, [workspace]);

    const { mutate: createUser } = useMutation(
        (formUser: IUser) =>
            createUserRequest(formUser.externalMetadata.kartoffelId, formUser.externalMetadata.digitalIdentitySource, formUser.permissions),
        {
            onError: (error) => {
                // eslint-disable-next-line no-console
                console.log('failed to upsert permission. error:', error);
                toast.error(i18next.t('permissions.permissionsOfUserDialog.failedToCreatePermissionsOfUser'));
            },
            onSuccess: (newUser) => {
                queryClient.setQueryData<IUser[]>('getAllUsers', (oldUsers) => {
                    if (!oldUsers) throw new Error('should contain existing users when creating user');
                    return [newUser, ...oldUsers];
                });

                toast.success(i18next.t('permissions.permissionsOfUserDialog.succeededToCreatePermission'));
                handleClose();
            },
        },
    );

    const { mutate: syncUserPermissions } = useMutation(
        async (formUser: IUser) => {
            const {
                permissions: {
                    [workspace._id]: { instances, ...permissions },
                },
            } = formUser;

            const { categoryPermissionsToSync, categoryPermissionsToDelete } = getCategoryPermissionsToSyncAndDelete(instances);

            if (Object.keys(categoryPermissionsToDelete).length) {
                await deletePermissionsFromMetadata(
                    { workspaceId: workspace._id, type: PermissionType.instances, userId: formUser._id },
                    { instances: { categories: categoryPermissionsToDelete } },
                );
            }

            return syncUserPermissionsRequest(formUser._id, {
                [workspace._id]: {
                    ...permissions,
                    instances: Object.keys(categoryPermissionsToSync).length ? { categories: categoryPermissionsToSync } : null,
                },
            });
        },
        {
            onError: (error) => {
                // eslint-disable-next-line no-console
                console.log('failed to upsert permission. error:', error);
                toast.error(i18next.t('permissions.permissionsOfUserDialog.failedToEditPermissionsOfUser'));
            },
            onSuccess: (newPermissions) => {
                if (!existingUser) return;

                queryClient.setQueryData<IUser[]>('getAllUsers', (oldUsers) => {
                    if (!oldUsers) throw new Error('should contain existing users when updating permissions of user');
                    const newUsers = [...oldUsers];
                    const existingUserIndex = newUsers.findIndex(({ _id }) => _id === existingUser._id);

                    if (userHasNoPermissions(newPermissions[workspace._id] ?? {})) newUsers.splice(existingUserIndex, 1);
                    else newUsers[existingUserIndex] = { ...existingUser, permissions: newPermissions };

                    return newUsers;
                });

                if (existingUser?._id === currentUser._id && !_isEqual(currentUser.currentWorkspacePermissions, newPermissions[workspace._id])) {
                    setUser({
                        ...currentUser,
                        permissions: { ...currentUser.permissions, ...newPermissions },
                        currentWorkspacePermissions: newPermissions[workspace._id],
                    });
                }

                toast.success(i18next.t('permissions.permissionsOfUserDialog.succeededToUpdatePermission'));
                handleClose();
            },
        },
    );

    return (
        <Formik
            initialValues={existingUser ? _cloneDeep(existingUser) : defaultEmptyUser}
            validationSchema={Yup.object({
                fullName: Yup.string().nullable().required(i18next.t('validation.required')),
            }).unknown(true)}
            validate={(formUser: IUser) => {
                if (mode === 'create' && allUsers?.some(({ _id }) => _id === formUser._id)) {
                    return { fullName: i18next.t('permissions.permissionsOfUserDialog.userAlreadyExistOnCreateMessage') };
                }

                return {};
            }}
            onSubmit={(formUser) => {
                if (mode === 'create') createUser(formUser);
                else syncUserPermissions(formUser);
            }}
        >
            {(formikProps: FormikProps<IUser>) => {
                const currentPermissions = formikProps.values.permissions[workspace._id];
                const categoriesPermissions = currentPermissions?.instances?.categories ?? {};

                const handleManagementPermissionCheck = (path: string, checked: boolean) => {
                    formikProps.setFieldValue(path, checked ? { scope: PermissionScope.write } : null);
                };

                return (
                    <Form>
                        <DialogTitle>
                            {mode === 'edit' && i18next.t('permissions.permissionsOfUserDialog.editTitle')}
                            {mode === 'create' && i18next.t('permissions.permissionsOfUserDialog.createTitle')}
                            {mode === 'view' && i18next.t('permissions.permissionsOfUserDialog.readTitle')}
                        </DialogTitle>
                        <DialogContent>
                            <Box margin={1} sx={{ bgcolor: darkMode ? '#242424' : 'white' }}>
                                <UserAutocomplete
                                    mode={existingUser ? 'internal' : 'external'}
                                    value={formikProps.values}
                                    onChange={(_e, chosenUser) => formikProps.setValues(chosenUser ?? defaultEmptyUser)}
                                    onBlur={formikProps.handleBlur}
                                    readOnly={mode === 'view'}
                                    disabled={mode === 'edit'}
                                    isError={Boolean(formikProps.touched.fullName && formikProps.errors.fullName)}
                                    helperText={formikProps.touched.fullName ? formikProps.errors.fullName : ''}
                                    isOptionDisabled={(option) => !option.fullName || !option.jobTitle || !option.hierarchy || !option.mail}
                                />
                            </Box>

                            {/* dont show management permissions to regular user (if dont have at all) */}
                            {(!(
                                mode === 'view' &&
                                currentPermissions?.permissions?.scope !== PermissionScope.write &&
                                currentPermissions?.templates?.scope !== PermissionScope.write &&
                                currentPermissions?.processes?.scope !== PermissionScope.write &&
                                currentPermissions?.rules?.scope !== PermissionScope.write
                            ) ||
                                currentPermissions?.admin?.scope === PermissionScope.write) && (
                                <Box margin={1}>
                                    <ManagementPermissionsCard
                                        permissionsManagement={{
                                            checked:
                                                currentPermissions?.permissions?.scope === PermissionScope.write ||
                                                currentPermissions?.admin?.scope === PermissionScope.write,
                                            onChange:
                                                mode === 'view'
                                                    ? () => {}
                                                    : (_e, checked) => handleManagementPermissionCheck(`${permissionsPath}.permissions`, checked),
                                            disabled: formikProps.isSubmitting || currentPermissions?.admin?.scope === PermissionScope.write,
                                            viewMode: mode === 'view',
                                        }}
                                        templatesManagement={{
                                            checked:
                                                currentPermissions?.templates?.scope === PermissionScope.write ||
                                                currentPermissions?.admin?.scope === PermissionScope.write,
                                            onChange:
                                                mode === 'view'
                                                    ? () => {}
                                                    : (_e, checked) => handleManagementPermissionCheck(`${permissionsPath}.templates`, checked),
                                            disabled: formikProps.isSubmitting || currentPermissions?.admin?.scope === PermissionScope.write,
                                            viewMode: mode === 'view',
                                        }}
                                        rulesManagement={{
                                            checked:
                                                currentPermissions?.rules?.scope === PermissionScope.write ||
                                                currentPermissions?.admin?.scope === PermissionScope.write,
                                            onChange:
                                                mode === 'view'
                                                    ? () => {}
                                                    : (_e, checked) => handleManagementPermissionCheck(`${permissionsPath}.rules`, checked),
                                            disabled: formikProps.isSubmitting || currentPermissions?.admin?.scope === PermissionScope.write,
                                            viewMode: mode === 'view',
                                        }}
                                        processesManagement={{
                                            checked:
                                                currentPermissions?.processes?.scope === PermissionScope.write ||
                                                currentPermissions?.admin?.scope === PermissionScope.write,
                                            onChange:
                                                mode === 'view'
                                                    ? () => {}
                                                    : (_e, checked) => handleManagementPermissionCheck(`${permissionsPath}.processes`, checked),
                                            disabled: formikProps.isSubmitting || currentPermissions?.admin?.scope === PermissionScope.write,
                                            viewMode: mode === 'view',
                                        }}
                                    />
                                </Box>
                            )}
                            <Box margin={1}>
                                <InstancesPermissionsCard
                                    viewMode={mode === 'view'}
                                    categoriesCheckboxProps={Array.from(categories.values(), (currCategory) => ({
                                        categoryId: currCategory._id,
                                        categoryDisplayName: currCategory.displayName,
                                        disabled: formikProps.isSubmitting || currentPermissions?.admin?.scope === PermissionScope.write,
                                        scope: getUserPermissionScopeOfCategory(categoriesPermissions, currCategory._id),
                                        permissionType: {
                                            read: {
                                                checked: checkUserCategoryPermission(currentPermissions, currCategory, PermissionScope.read),
                                                onChange:
                                                    mode === 'view'
                                                        ? () => {}
                                                        : (_e, checked: boolean) => {
                                                              formikProps.setFieldValue(`${permissionsPath}.instances.categories`, {
                                                                  ...categoriesPermissions,
                                                                  [currCategory._id]: checked ? { scope: PermissionScope.read } : null,
                                                              });
                                                          },
                                            },
                                            write: {
                                                checked: checkUserCategoryPermission(currentPermissions, currCategory, PermissionScope.write),
                                                onChange:
                                                    mode === 'view'
                                                        ? () => {}
                                                        : (_e, checked: boolean) => {
                                                              formikProps.setFieldValue(`${permissionsPath}.instances.categories`, {
                                                                  ...categoriesPermissions,
                                                                  [currCategory._id]: {
                                                                      scope: checked ? PermissionScope.write : PermissionScope.read,
                                                                  },
                                                              });
                                                          },
                                            },
                                        },
                                    }))}
                                    checkboxAllProps={
                                        mode === 'view'
                                            ? undefined
                                            : {
                                                  indeterminate:
                                                      Object.keys(categoriesPermissions).length > 0 &&
                                                      Object.values(categoriesPermissions).filter(
                                                          (categoryPermission) => categoryPermission?.scope !== PermissionScope.write,
                                                      ).length < categories.size,
                                                  permissionType: {
                                                      write: {
                                                          checked:
                                                              (Object.keys(categoriesPermissions).length === categories.size &&
                                                                  Object.values(categoriesPermissions).every(
                                                                      (categoryPermission) => categoryPermission?.scope === PermissionScope.write,
                                                                  )) ||
                                                              currentPermissions?.admin?.scope === PermissionScope.write,
                                                          onChange: (_e, checked) => {
                                                              formikProps.setFieldValue(
                                                                  `${permissionsPath}.instances.categories`,
                                                                  checked
                                                                      ? Object.fromEntries(
                                                                            Array.from(categories.keys()).map((categoryId) => [
                                                                                categoryId,
                                                                                { scope: PermissionScope.write },
                                                                            ]),
                                                                        )
                                                                      : {},
                                                              );
                                                          },
                                                      },
                                                      read: {
                                                          checked:
                                                              (Object.keys(categoriesPermissions).length === categories.size &&
                                                                  Object.values(categoriesPermissions).every(
                                                                      (categoryPermission) => categoryPermission?.scope,
                                                                  )) ||
                                                              currentPermissions?.admin?.scope === PermissionScope.write,
                                                          onChange: (_e, checked) => {
                                                              formikProps.setFieldValue(
                                                                  `${permissionsPath}.instances.categories`,
                                                                  Object.fromEntries(
                                                                      Array.from(categories).map(([categoryId]) => {
                                                                          const existingScope = categoriesPermissions[categoryId]?.scope;

                                                                          let newScope: PermissionScope | undefined;

                                                                          if (checked) {
                                                                              newScope =
                                                                                  existingScope === PermissionScope.write
                                                                                      ? PermissionScope.write
                                                                                      : PermissionScope.read;
                                                                          } else {
                                                                              newScope =
                                                                                  existingScope === PermissionScope.write
                                                                                      ? PermissionScope.write
                                                                                      : undefined;
                                                                          }

                                                                          return [
                                                                              categoryId,
                                                                              newScope
                                                                                  ? { ...categoriesPermissions[categoryId], scope: newScope }
                                                                                  : null,
                                                                          ];
                                                                      }),
                                                                  ),
                                                              );
                                                          },
                                                      },
                                                  },
                                              }
                                    }
                                />
                            </Box>
                        </DialogContent>
                        <DialogActions>
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
export default MyPermissions;
