import { Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Grid } from '@mui/material';
import { useTour } from '@reactour/tour';
import { Form, Formik, FormikProps } from 'formik';
import i18next from 'i18next';
import _cloneDeep from 'lodash.clonedeep';
import React from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { useLocation } from 'wouter';
import * as Yup from 'yup';
import { ICategoryMap } from '../../interfaces/categories';
import { IUser } from '../../services/kartoffelService';
import {
    createPermissionsBulkRequest,
    deletePermissionsBulkRequest,
    IPermission,
    IPermissionsOfUser,
    PermissionResourceType,
    updatePermissionsBulkRequest,
} from '../../services/permissionsService';
import { RootState } from '../../store';
import {
    canUserReadInstanceOfCategory,
    canUserWriteInstanceOfCategory,
    getUserPermissionScopeOfCategory,
} from '../../utils/permissions/instancePermissions';
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
    instancesPermissions: [],
} as IFormPermissionsOfUser;

const createOrEditPermissionsOfUserRequest = async (
    formPermissionsOfUser: Omit<IFormPermissionsOfUser, 'user'> & { user: IUser },
    categories: ICategoryMap,
    existingPermissionsOfUser?: IPermissionsOfUser,
) => {
    const { permissionsIdsToDelete, permissionsToCreate, permissionsToUpdate } = getPermissionsToDeleteUpdateAndCreate(
        formPermissionsOfUser,
        categories,
        existingPermissionsOfUser,
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
            : createdPermissionsManagement?._id ?? existingPermissionsOfUser!.permissionsManagementId,
        processesManagementId: !formPermissionsOfUser.doesHaveProcessesManagement
            ? null
            : createdProcessesManagement?._id ?? existingPermissionsOfUser!.processesManagementId,
        templatesManagementId: !formPermissionsOfUser.doesHaveTemplatesManagement
            ? null
            : createdTemplatesManagement?._id ?? existingPermissionsOfUser!.templatesManagementId,
        rulesManagementId: !formPermissionsOfUser.doesHaveRulesManagement
            ? null
            : createdRulesManagement?._id ?? existingPermissionsOfUser!.rulesManagementId,
        instancesPermissions: Array.from(categories.keys(), (id) => {
            const createdOrUpdatePermission = allNewOrUpdatedPermissions.find(({ category: categoryId }) => categoryId === id);
            if (createdOrUpdatePermission && !deletedPermissionsSet.has(createdOrUpdatePermission._id)) {
                return {
                    _id: createdOrUpdatePermission._id,
                    category: createdOrUpdatePermission.category,
                    scopes: createdOrUpdatePermission.scopes,
                };
            }

            const existingPermissionForCategory = existingPermissionsOfUser?.instancesPermissions.find(
                ({ category: categoryId }) => categoryId === id,
            );
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
    existingPermissionsOfUser?: IPermissionsOfUser;
}> = ({ isOpen, handleClose, mode, existingPermissionsOfUser }) => {
    const currentUser = useSelector((state: RootState) => state.user);
    const [_, navigate] = useLocation();
    const { setIsOpen, setCurrentStep } = useTour();

    const darkMode = useSelector((state: RootState) => state.darkMode);

    const queryClient = useQueryClient();
    const allPermissions = queryClient.getQueryData<IPermissionsOfUser[]>('getAllPermissions');
    const categories = queryClient.getQueryData<ICategoryMap>('getCategories')!;

    const { mutateAsync: createOrEditPermissionsOfUser } = useMutation(
        (formPermissionsOfUser: Omit<IFormPermissionsOfUser, 'user'> & { user: IUser }) =>
            createOrEditPermissionsOfUserRequest(formPermissionsOfUser, categories, existingPermissionsOfUser),
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
            onSuccess: (newPermissionsOfUser) => {
                queryClient.setQueryData<IPermissionsOfUser[]>('getAllPermissions', (oldPermissions) => {
                    if (!oldPermissions) throw new Error('should contain existing permissions when creating/updating permissions of user');
                    const newPermissions = oldPermissions.slice();

                    if (existingPermissionsOfUser) {
                        const existingPermissionsOfUserIndex = newPermissions.findIndex(({ user }) => user.id === newPermissionsOfUser.user.id);
                        const doesUserShouldHaveNoPermissions =
                            !newPermissionsOfUser.permissionsManagementId &&
                            !newPermissionsOfUser.templatesManagementId &&
                            !newPermissionsOfUser.rulesManagementId &&
                            newPermissionsOfUser.instancesPermissions.length === 0;

                        if (doesUserShouldHaveNoPermissions) {
                            newPermissions.splice(existingPermissionsOfUserIndex, 1);
                        } else {
                            newPermissions[existingPermissionsOfUserIndex] = newPermissionsOfUser;
                        }
                    } else {
                        newPermissions.unshift(newPermissionsOfUser);
                    }

                    return newPermissions;
                });

                if (newPermissionsOfUser.user.id === currentUser.id) {
                    queryClient.setQueryData<IPermissionsOfUser>('getMyPermissions', newPermissionsOfUser);
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
                    existingPermissionsOfUser ? _cloneDeep(permissionsToFormPermissions(existingPermissionsOfUser)) : defaultEmptyPermissionsOfUser
                }
                validationSchema={Yup.object({
                    user: Yup.object().nullable().required(i18next.t('validation.required')),
                }).unknown(true)}
                validate={(formPermissionsOfUser) => {
                    if (mode === 'create' && allPermissions?.some(({ user }) => user.id === formPermissionsOfUser.user?.id)) {
                        return { user: i18next.t('permissions.permissionsOfUserDialog.userAlreadyExistOnCreateMessage') };
                    }

                    return {};
                }}
                onSubmit={(formPermissionsOfUser) =>
                    createOrEditPermissionsOfUser(formPermissionsOfUser as Omit<IFormPermissionsOfUser, 'user'> & { user: IUser })
                }
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
                                        scope: getUserPermissionScopeOfCategory(
                                            formikProps.values.instancesPermissions as IPermissionsOfUser['instancesPermissions'],
                                            currCategory._id,
                                        ),
                                        permissionType: {
                                            read: {
                                                checked: canUserReadInstanceOfCategory(
                                                    formikProps.values.instancesPermissions as IPermissionsOfUser['instancesPermissions'],
                                                    currCategory,
                                                ),
                                                onChange:
                                                    mode === 'view'
                                                        ? () => {}
                                                        : (_e, checked: boolean) => {
                                                              if (checked) {
                                                                  const newInstancesPermissions: Pick<IPermission, 'category' | 'scopes'>[] = [
                                                                      ...formikProps.values.instancesPermissions,
                                                                      { category: currCategory._id, scopes: ['Read'] },
                                                                  ];
                                                                  formikProps.setFieldValue('instancesPermissions', newInstancesPermissions);
                                                                  return;
                                                              }

                                                              const newInstancesPermissions = formikProps.values.instancesPermissions.filter(
                                                                  ({ category }) => category !== currCategory._id,
                                                              );
                                                              formikProps.setFieldValue('instancesPermissions', newInstancesPermissions);
                                                          },
                                            },
                                            write: {
                                                checked: canUserWriteInstanceOfCategory(
                                                    formikProps.values.instancesPermissions as IPermissionsOfUser['instancesPermissions'],
                                                    currCategory,
                                                ),
                                                onChange:
                                                    mode === 'view'
                                                        ? () => {}
                                                        : (_e, checked: boolean) => {
                                                              const newScopes = checked ? ['Read', 'Write'] : ['Read'];
                                                              const needToCreateNewInstancePermission = !formikProps.values.instancesPermissions.some(
                                                                  (instancePermission) => instancePermission.category === currCategory._id,
                                                              );

                                                              const newInstancesPermissions = needToCreateNewInstancePermission
                                                                  ? [
                                                                        ...formikProps.values.instancesPermissions,
                                                                        { category: currCategory._id, scopes: newScopes },
                                                                    ]
                                                                  : formikProps.values.instancesPermissions.map((instancePermission) =>
                                                                        instancePermission.category === currCategory._id
                                                                            ? { ...instancePermission, scopes: newScopes }
                                                                            : instancePermission,
                                                                    );

                                                              formikProps.setFieldValue('instancesPermissions', newInstancesPermissions);
                                                          },
                                            },
                                        },
                                    }))}
                                    checkboxAllProps={
                                        mode === 'view'
                                            ? undefined
                                            : {
                                                  indeterminate:
                                                      formikProps.values.instancesPermissions.length > 0 &&
                                                      formikProps.values.instancesPermissions.length < categories.size,
                                                  permissionType: {
                                                      write: {
                                                          checked:
                                                              formikProps.values.instancesPermissions.length === categories.size &&
                                                              formikProps.values.instancesPermissions.every(({ scopes }) => scopes.includes('Write')),
                                                          onChange: (_e, checked) => {
                                                              const newInstancesPermissions = checked
                                                                  ? Array.from(categories.keys()).map((categoryId) => ({
                                                                        category: categoryId,
                                                                        scopes: ['Read', 'Write'],
                                                                    }))
                                                                  : [];
                                                              formikProps.setFieldValue('instancesPermissions', newInstancesPermissions);
                                                          },
                                                      },
                                                      read: {
                                                          checked:
                                                              formikProps.values.instancesPermissions.length === categories.size &&
                                                              formikProps.values.instancesPermissions.every(({ scopes }) => scopes.includes('Read')),
                                                          onChange: (_e, checked) => {
                                                              const newInstancesPermissions = Array.from(categories).map((categoryTuple) => {
                                                                  // Find existing permissions for the category or default to an empty array
                                                                  const [categoryId] = categoryTuple;
                                                                  const existingPermissions =
                                                                      formikProps.values.instancesPermissions.find((p) => p.category === categoryId)
                                                                          ?.scopes || [];
                                                                  let newScopes;
                                                                  if (checked) {
                                                                      newScopes = existingPermissions.includes('Write')
                                                                          ? ['Read', 'Write']
                                                                          : ['Read'];
                                                                  } else {
                                                                      newScopes = existingPermissions.includes('Write') ? ['Write'] : [];
                                                                  }

                                                                  return { category: categoryId, scopes: newScopes };
                                                              });

                                                              formikProps.setFieldValue('instancesPermissions', newInstancesPermissions);
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
