import { Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Grid } from '@mui/material';
import { useTour } from '@reactour/tour';
import { Form, Formik, FormikProps } from 'formik';
import i18next from 'i18next';
import _cloneDeep from 'lodash.clonedeep';
import React, { useMemo } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { useLocation } from 'wouter';
import * as Yup from 'yup';
import { ICategoryMap } from '../../interfaces/categories';
import { PermissionScope } from '../../interfaces/permissions';
import { IUser } from '../../interfaces/users';
import { syncUserPermissionsRequest } from '../../services/userService';
import { useDarkModeStore } from '../../stores/darkMode';
import { useUserStore } from '../../stores/user';
import { useWorkspaceStore } from '../../stores/workspace';
import { checkUserCategoryPermission, getUserPermissionScopeOfCategory } from '../../utils/permissions/instancePermissions';
import { didPermissionsChange, userHasNoPermissions } from '../../utils/permissions/permissionOfUserDialog';
import UserAutocomplete from '../inputs/UserAutocomplete';
import InstancesPermissionsCard from './instancesPermissionsCard';
import ManagementPermissionsCard from './managementPermissionsCard';

const defaultEmptyUser = {
    _id: '',
    fullName: '',
    jobTitle: '',
    hierarchy: '',
    mail: '',
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

const PermissionsOfUserDialog: React.FC<{
    isOpen: boolean;
    handleClose: () => any;
    mode: 'create' | 'edit' | 'view';
    existingUser?: IUser;
}> = ({ isOpen, handleClose, mode, existingUser }) => {
    const currentUser = useUserStore((state) => state.user);
    const setUser = useUserStore((state) => state.setUser);
    const workspace = useWorkspaceStore((state) => state.workspace);
    const [_, navigate] = useLocation();
    const { setIsOpen, setCurrentStep } = useTour();

    const darkMode = useDarkModeStore((state) => state.darkMode);

    const queryClient = useQueryClient();
    const categories = queryClient.getQueryData<ICategoryMap>('getCategories')!;
    const allUsers = queryClient.getQueryData<IUser[]>('getAllUsers');

    const { mutateAsync: createOrEditPermissionsOfUser } = useMutation(
        (formUser: IUser) => syncUserPermissionsRequest(formUser._id, formUser.permissions),
        {
            onError: (error) => {
                // eslint-disable-next-line no-console
                console.log('failed to upsert permission. error:', error);
                if (mode === 'create') {
                    toast.error(i18next.t('permissions.permissionsOfUserDialog.failedToCreatePermissionsOfUser'));
                } else {
                    toast.error(i18next.t('permissions.permissionsOfUserDialog.failedToEditPermissionsOfUser'));
                }
            },
            onSuccess: (newUser) => {
                queryClient.setQueryData<IUser[]>('getAllUsers', (oldUsers) => {
                    if (!oldUsers) throw new Error('should contain existing permissions when creating/updating permissions of user');
                    const newUsers = [...oldUsers];

                    if (existingUser) {
                        const existingUserIndex = newUsers.findIndex(({ _id }) => _id === newUser._id);

                        if (userHasNoPermissions(newUser.permissions)) {
                            newUsers.splice(existingUserIndex, 1);
                        } else {
                            newUsers[existingUserIndex] = newUser;
                        }
                    } else {
                        newUsers.unshift(newUser);
                    }

                    return newUsers;
                });

                if (newUser._id === currentUser._id) {
                    if (currentUser.currentWorkspacePermissions !== currentUser.permissions[workspace._id])
                        setUser({
                            ...currentUser,
                            permissions: { ...currentUser.permissions, [workspace._id]: newUser },
                            currentWorkspacePermissions: currentUser.permissions[workspace._id],
                        });
                }

                if (mode === 'create') {
                    toast.success(i18next.t('permissions.permissionsOfUserDialog.succeededToCreatePermission'));
                }
                if (mode === 'edit') {
                    toast.success(i18next.t('permissions.permissionsOfUserDialog.succeededToUpdatePermission'));
                }

                handleClose();
            },
        },
    );

    const permissionsPath = useMemo(() => `permissions.${workspace._id}`, [workspace]);

    return (
        <Dialog
            open={isOpen}
            fullWidth
            maxWidth="sm"
            keepMounted={false}
            onClose={handleClose}
            PaperProps={{ sx: { bgcolor: darkMode ? '#060606' : 'white', overflow: 'hidden' } }}
        >
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
                    console.log('homo', formUser);
                    // createOrEditPermissionsOfUser(formPermissionsOfUser as Omit<IFormPermissionsOfUser, 'user'> & { user: IUser })
                }}
            >
                {(formikProps: FormikProps<IUser>) => {
                    const currentPermissions = formikProps.values.permissions[workspace._id];
                    const categoriesPermissions = currentPermissions?.instances?.categories ?? {};

                    const handleManagementPermissionCheck = (path: string, checked: boolean) => {
                        formikProps.setFieldValue(path, checked ? { scope: PermissionScope.write } : { scope: null });
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
                                        onChange={(_e, chosenUser) => formikProps.setValues(chosenUser)}
                                        onBlur={(event) => formikProps.handleBlur(event)}
                                        readOnly={mode === 'view'}
                                        disabled={mode === 'edit'}
                                        isError={Boolean(formikProps.touched.fullName && formikProps.errors.fullName)}
                                        helperText={formikProps.touched.fullName ? formikProps.errors.fullName : ''}
                                    />
                                </Box>

                                {/* dont show management permissions to regular user (if dont have at all) */}
                                {!(
                                    mode === 'view' &&
                                    currentPermissions?.permissions?.scope !== PermissionScope.write &&
                                    currentPermissions?.templates?.scope !== PermissionScope.write &&
                                    currentPermissions?.processes?.scope !== PermissionScope.write &&
                                    currentPermissions?.rules?.scope !== PermissionScope.write
                                ) && (
                                    <Box margin={1}>
                                        <ManagementPermissionsCard
                                            permissionsManagement={{
                                                checked: currentPermissions?.permissions?.scope === PermissionScope.write,
                                                onChange:
                                                    mode === 'view'
                                                        ? () => {}
                                                        : (_e, checked) => handleManagementPermissionCheck(`${permissionsPath}.permissions`, checked),
                                                disabled: formikProps.isSubmitting,
                                                viewMode: mode === 'view',
                                            }}
                                            templatesManagement={{
                                                checked: currentPermissions?.templates?.scope === PermissionScope.write,
                                                onChange:
                                                    mode === 'view'
                                                        ? () => {}
                                                        : (_e, checked) => handleManagementPermissionCheck(`${permissionsPath}.templates`, checked),
                                                disabled: formikProps.isSubmitting,
                                                viewMode: mode === 'view',
                                            }}
                                            rulesManagement={{
                                                checked: currentPermissions?.rules?.scope === PermissionScope.write,
                                                onChange:
                                                    mode === 'view'
                                                        ? () => {}
                                                        : (_e, checked) => handleManagementPermissionCheck(`${permissionsPath}.rules`, checked),
                                                disabled: formikProps.isSubmitting,
                                                viewMode: mode === 'view',
                                            }}
                                            processesManagement={{
                                                checked: currentPermissions?.processes?.scope === PermissionScope.write,
                                                onChange:
                                                    mode === 'view'
                                                        ? () => {}
                                                        : (_e, checked) => handleManagementPermissionCheck(`${permissionsPath}.processes`, checked),
                                                disabled: formikProps.isSubmitting,
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
                                            disabled: formikProps.isSubmitting,
                                            scope: getUserPermissionScopeOfCategory(categoriesPermissions, currCategory._id),
                                            permissionType: {
                                                read: {
                                                    checked: checkUserCategoryPermission(categoriesPermissions, currCategory, PermissionScope.read),
                                                    onChange:
                                                        mode === 'view'
                                                            ? () => {}
                                                            : (_e, checked: boolean) => {
                                                                  if (checked) {
                                                                      formikProps.setFieldValue(`${permissionsPath}.instances.categories`, {
                                                                          ...categoriesPermissions,
                                                                          [currCategory._id]: { scope: PermissionScope.read },
                                                                      });
                                                                      return;
                                                                  }

                                                                  const newCategoriesPermissions = { ...categoriesPermissions };
                                                                  delete newCategoriesPermissions[currCategory._id];
                                                                  formikProps.setFieldValue(
                                                                      `${permissionsPath}.instances.categories`,
                                                                      newCategoriesPermissions,
                                                                  );
                                                              },
                                                },
                                                write: {
                                                    checked: checkUserCategoryPermission(categoriesPermissions, currCategory, PermissionScope.write),
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
                                                          Object.keys(categoriesPermissions).length < categories.size,
                                                      permissionType: {
                                                          write: {
                                                              checked:
                                                                  Object.keys(categoriesPermissions).length === categories.size &&
                                                                  Object.values(categoriesPermissions).every(
                                                                      ({ scope }) => scope === PermissionScope.write,
                                                                  ),
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
                                                                  Object.keys(categoriesPermissions).length === categories.size &&
                                                                  Object.values(categoriesPermissions).every(({ scope }) => scope),
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
                                                                                  { ...categoriesPermissions[categoryId], scope: newScope },
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
                                        {mode === 'view' && (
                                            <Button
                                                onClick={() => {
                                                    handleClose();
                                                    setIsOpen(true);
                                                    setCurrentStep(0);
                                                    navigate('?search=&viewMode=templates-tables-view');
                                                }}
                                            >
                                                {i18next.t('showTour')}
                                            </Button>
                                        )}
                                    </Grid>
                                    <Grid>
                                        <Button onClick={handleClose} autoFocus disabled={formikProps.isSubmitting}>
                                            {i18next.t('permissions.permissionsOfUserDialog.closeBtn')}
                                        </Button>
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
        </Dialog>
    );
};

export default PermissionsOfUserDialog;
