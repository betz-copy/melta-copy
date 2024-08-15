import { Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Grid } from '@mui/material';
import { useTour } from '@reactour/tour';
import { Form, Formik, FormikProps } from 'formik';
import i18next from 'i18next';
import _cloneDeep from 'lodash.clonedeep';
import React from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { useLocation } from 'wouter';
import * as Yup from 'yup';
import { ICategoryMap } from '../../interfaces/categories';
import { PermissionScope } from '../../interfaces/permissions';
import { IUser } from '../../interfaces/users';
import { useDarkModeStore } from '../../stores/darkMode';
import { useUserStore } from '../../stores/user';
import { useWorkspaceStore } from '../../stores/workspace';
import { checkUserCategoryPermission, getUserPermissionScopeOfCategory } from '../../utils/permissions/instancePermissions';
import {
    doesUserHaveNoPermissions,
    getPermissionsToDeleteUpdateAndCreate,
    isPermissionsChanged,
    permissionsToFormPermissions,
} from '../../utils/permissions/permissionOfUserDialog';
import UserAutocomplete from '../inputs/UserAutocomplete';
import InstancesPermissionsCard from './instancesPermissionsCard';
import ManagementPermissionsCard from './managementPermissionsCard';
import { IFormPermissionsOfUser } from './permissionsTypes';

const defaultEmptyPermissionsOfUser = {
    user: null,
    doesHavePermissionsManagement: false,
    doesHaveTemplatesManagement: false,
    doesHaveRulesManagement: false,
    doesHaveProcessesManagement: false,
    categoriesPermissions: {},
} as IFormPermissionsOfUser;

const createOrEditPermissionsOfUserRequest = async (
    formPermissionsOfUser: Omit<IFormPermissionsOfUser, 'user'> & { user: IUser },
    categories: ICategoryMap,
    existingUser?: IUser,
) => {
    const { permissionsIdsToDelete, permissionsToCreate, permissionsToUpdate } = getPermissionsToDeleteUpdateAndCreate(
        formPermissionsOfUser,
        categories,
        existingUser,
    );

    if (permissionsIdsToDelete.length > 0) {
        await deletePermissionsBulkRequest(permissionsIdsToDelete);
    }
    const updatedPermissions = permissionsToUpdate.length > 0 ? await updatePermissionsBulkRequest(permissionsToUpdate) : [];
    const createdPermissions = permissionsToCreate.length > 0 ? await createPermissionsBulkRequest(permissionsToCreate) : [];
    const allNewOrUpdatedPermissions = [...createdPermissions, ...updatedPermissions];

    const deletedPermissionsSet = new Set(permissionsIdsToDelete);

    const createdPermissionsManagement = allNewOrUpdatedPermissions.find(({ resourceType }) => resourceType === PermissionResourceType.Permissions);
    const createdTemplatesManagement = allNewOrUpdatedPermissions.find(({ resourceType }) => resourceType === PermissionResourceType.Templates);
    const createdRulesManagement = allNewOrUpdatedPermissions.find(({ resourceType }) => resourceType === PermissionResourceType.Rules);
    const createdProcessesManagement = allNewOrUpdatedPermissions.find(({ resourceType }) => resourceType === PermissionResourceType.Processes);
    const newPermissionsOfUser: IPermissionsOfUser = {
        user: formPermissionsOfUser.user,
        permissionsManagementId: !formPermissionsOfUser.doesHavePermissionsManagement
            ? null
            : createdPermissionsManagement?._id ?? existingUser!.permissionsManagementId,
        processesManagementId: !formPermissionsOfUser.doesHaveProcessesManagement
            ? null
            : createdProcessesManagement?._id ?? existingUser!.processesManagementId,
        templatesManagementId: !formPermissionsOfUser.doesHaveTemplatesManagement
            ? null
            : createdTemplatesManagement?._id ?? existingUser!.templatesManagementId,
        rulesManagementId: !formPermissionsOfUser.doesHaveRulesManagement ? null : createdRulesManagement?._id ?? existingUser!.rulesManagementId,
        instancesPermissions: Array.from(categories.keys(), (id) => {
            const createdOrUpdatePermission = allNewOrUpdatedPermissions.find(({ category: categoryId }) => categoryId === id);
            if (createdOrUpdatePermission && !deletedPermissionsSet.has(createdOrUpdatePermission._id)) {
                return {
                    _id: createdOrUpdatePermission._id,
                    category: createdOrUpdatePermission.category,
                    scopes: createdOrUpdatePermission.scopes,
                };
            }

            const existingPermissionForCategory = existingUser?.instancesPermissions.find(({ category: categoryId }) => categoryId === id);
            if (existingPermissionForCategory && !deletedPermissionsSet.has(existingPermissionForCategory._id)) {
                return existingPermissionForCategory;
            }

            return null;
        }).filter(Boolean) as Pick<IPermission, '_id' | 'category' | 'scopes'>[],
    };

    return newPermissionsOfUser;
};

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
        (formPermissionsOfUser: Omit<IFormPermissionsOfUser, 'user'> & { user: IUser }) =>
            createOrEditPermissionsOfUserRequest(formPermissionsOfUser, categories, existingUser),
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
                        const existingUserIndex = newUsers.findIndex(({ _id }) => _id === newUser.user.id);
                        const shouldUserHaveNoPermissions =
                            !newUser.permissionsManagementId &&
                            !newUser.templatesManagementId &&
                            !newUser.rulesManagementId &&
                            newUser.instancesPermissions.length === 0;

                        if (shouldUserHaveNoPermissions) {
                            newUsers.splice(existingUserIndex, 1);
                        } else {
                            newUsers[existingUserIndex] = newUser;
                        }
                    } else {
                        newUsers.unshift(newUser);
                    }

                    return newUsers;
                });

                if (newUser.user.id === currentUser._id) {
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
                initialValues={
                    existingUser
                        ? _cloneDeep(permissionsToFormPermissions(existingUser, existingUser.permissions[workspace._id]))
                        : defaultEmptyPermissionsOfUser
                }
                validationSchema={Yup.object({
                    user: Yup.object().nullable().required(i18next.t('validation.required')),
                }).unknown(true)}
                validate={(formPermissionsOfUser: IFormPermissionsOfUser) => {
                    if (mode === 'create' && allUsers?.some(({ _id }) => _id === formPermissionsOfUser.user?._id)) {
                        return { user: i18next.t('permissions.permissionsOfUserDialog.userAlreadyExistOnCreateMessage') };
                    }

                    return {};
                }}
                onSubmit={(formPermissionsOfUser) => {
                    console.log('homo', formPermissionsOfUser);
                    // createOrEditPermissionsOfUser(formPermissionsOfUser as Omit<IFormPermissionsOfUser, 'user'> & { user: IUser })
                }}
            >
                {(formikProps: FormikProps<IFormPermissionsOfUser>) => (
                    <Form>
                        <DialogTitle>
                            {mode === 'edit' && i18next.t('permissions.permissionsOfUserDialog.editTitle')}
                            {mode === 'create' && i18next.t('permissions.permissionsOfUserDialog.createTitle')}
                            {mode === 'view' && i18next.t('permissions.permissionsOfUserDialog.readTitle')}
                        </DialogTitle>
                        <DialogContent>
                            <Box margin={1} sx={{ bgcolor: darkMode ? '#242424' : 'white' }}>
                                <UserAutocomplete
                                    mode="external"
                                    value={formikProps.values.user}
                                    onChange={(_e, chosenUser) => formikProps.setFieldValue('user', chosenUser)}
                                    onBlur={(event) => formikProps.handleBlur(event)}
                                    readOnly={mode === 'view'}
                                    disabled={mode === 'edit'}
                                    isError={Boolean(formikProps.touched.user && formikProps.errors.user)}
                                    helperText={formikProps.touched.user ? formikProps.errors.user : ''}
                                />
                            </Box>

                            {/* dont show management permissions to regular user (if dont have at all) */}
                            {!(
                                mode === 'view' &&
                                !formikProps.values.doesHavePermissionsManagement &&
                                !formikProps.values.doesHaveTemplatesManagement &&
                                !formikProps.values.doesHaveProcessesManagement &&
                                !formikProps.values.doesHaveRulesManagement
                            ) && (
                                <Box margin={1}>
                                    <ManagementPermissionsCard
                                        permissionsManagement={{
                                            checked: formikProps.values.doesHavePermissionsManagement,
                                            onChange:
                                                mode === 'view'
                                                    ? () => {}
                                                    : (_e, checked) => formikProps.setFieldValue('doesHavePermissionsManagement', checked),
                                            disabled: formikProps.isSubmitting,
                                            viewMode: mode === 'view',
                                        }}
                                        templatesManagement={{
                                            checked: formikProps.values.doesHaveTemplatesManagement,
                                            onChange:
                                                mode === 'view'
                                                    ? () => {}
                                                    : (_e, checked) => formikProps.setFieldValue('doesHaveTemplatesManagement', checked),
                                            disabled: formikProps.isSubmitting,
                                            viewMode: mode === 'view',
                                        }}
                                        rulesManagement={{
                                            checked: formikProps.values.doesHaveRulesManagement,
                                            onChange:
                                                mode === 'view'
                                                    ? () => {}
                                                    : (_e, checked) => formikProps.setFieldValue('doesHaveRulesManagement', checked),
                                            disabled: formikProps.isSubmitting,
                                            viewMode: mode === 'view',
                                        }}
                                        processesManagement={{
                                            checked: formikProps.values.doesHaveProcessesManagement,
                                            onChange:
                                                mode === 'view'
                                                    ? () => {}
                                                    : (_e, checked) => formikProps.setFieldValue('doesHaveProcessesManagement', checked),
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
                                        scope: getUserPermissionScopeOfCategory(formikProps.values.categoriesPermissions, currCategory._id),
                                        permissionType: {
                                            read: {
                                                checked: checkUserCategoryPermission(
                                                    formikProps.values.categoriesPermissions,
                                                    currCategory,
                                                    PermissionScope.read,
                                                ),
                                                onChange:
                                                    mode === 'view'
                                                        ? () => {}
                                                        : (_e, checked: boolean) => {
                                                              if (checked) {
                                                                  formikProps.setFieldValue('categoriesPermissions', {
                                                                      ...formikProps.values.categoriesPermissions,
                                                                      [currCategory._id]: { scope: PermissionScope.read },
                                                                  });
                                                                  return;
                                                              }

                                                              const newCategoriesPermissions = { ...formikProps.values.categoriesPermissions };
                                                              delete newCategoriesPermissions[currCategory._id];
                                                              formikProps.setFieldValue('categoriesPermissions', newCategoriesPermissions);
                                                          },
                                            },
                                            write: {
                                                checked: checkUserCategoryPermission(
                                                    formikProps.values.categoriesPermissions,
                                                    currCategory,
                                                    PermissionScope.write,
                                                ),
                                                onChange:
                                                    mode === 'view'
                                                        ? () => {}
                                                        : (_e, checked: boolean) => {
                                                              formikProps.setFieldValue('categoriesPermissions', {
                                                                  ...formikProps.values.categoriesPermissions,
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
                                                      Object.keys(formikProps.values.categoriesPermissions).length > 0 &&
                                                      Object.keys(formikProps.values.categoriesPermissions).length < categories.size,
                                                  permissionType: {
                                                      write: {
                                                          checked:
                                                              Object.keys(formikProps.values.categoriesPermissions).length === categories.size &&
                                                              Object.values(formikProps.values.categoriesPermissions).every(
                                                                  ({ scope }) => scope === PermissionScope.write,
                                                              ),
                                                          onChange: (_e, checked) => {
                                                              formikProps.setFieldValue(
                                                                  'categoriesPermissions',
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
                                                              Object.keys(formikProps.values.categoriesPermissions).length === categories.size &&
                                                              Object.values(formikProps.values.categoriesPermissions).every(({ scope }) => scope),
                                                          onChange: (_e, checked) => {
                                                              formikProps.setFieldValue(
                                                                  'categoriesPermissions',
                                                                  Object.fromEntries(
                                                                      Array.from(categories).map(([categoryId]) => {
                                                                          const existingScope =
                                                                              formikProps.values.categoriesPermissions[categoryId]?.scope;

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
                                                                              {
                                                                                  ...formikProps.values.categoriesPermissions[categoryId],
                                                                                  scope: newScope,
                                                                              },
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
                                                isPermissionsChanged(formikProps.initialValues, formikProps.values) ||
                                                doesUserHaveNoPermissions(formikProps.values)
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
                )}
            </Formik>
        </Dialog>
    );
};

export default PermissionsOfUserDialog;
