import React from 'react';
import { Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import i18next from 'i18next';
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import _cloneDeep from 'lodash.clonedeep';
import { Form, Formik, FormikProps } from 'formik';
import * as Yup from 'yup';
import { createPermissionsBulkRequest, deletePermissionsBulkRequest, IPermission, IPermissionsOfUser } from '../../services/permissionsService';
import UserAutocomplete from '../UserAutocomplete';
import { IUser } from '../../services/kartoffelService';
import { IMongoCategory } from '../../interfaces/categories';
import ManagementPermissionsCard from './managementPermissionsCard';
import InstancesPermissionsCard from './instancesPermissionsCard';

const defaultEmptyPermissionsOfUser = {
    user: null,
    doesHavePermissionsManagement: false,
    doesHaveTemplatesManagement: false,
    instancesPermissions: [],
} as IFormPermissionsOfUser;

type IFormPermissionsOfUser = {
    user: IUser | null;
    doesHavePermissionsManagement: boolean;
    doesHaveTemplatesManagement: boolean;
    instancesPermissions: Pick<IPermission, 'category'>[];
};

const permissionsToFormPermissions = ({
    user,
    permissionsManagementId,
    templatesManagementId,
    instancesPermissions,
}: IPermissionsOfUser): IFormPermissionsOfUser => ({
    user,
    doesHavePermissionsManagement: Boolean(permissionsManagementId),
    doesHaveTemplatesManagement: Boolean(templatesManagementId),
    instancesPermissions: instancesPermissions.map(({ category }) => ({ category })),
});

const getPermissionsToDeleteAndCreate = (
    formPermissionsOfUser: Omit<IFormPermissionsOfUser, 'user'> & { user: IUser },
    categories: IMongoCategory[],
    existingPermissionsOfUser?: IPermissionsOfUser,
): { permissonsIdsToDelete: string[]; permissionsToCreate: Omit<IPermission, '_id'>[] } => {
    const permissonsIdsToDelete: string[] = [];
    const permissionsToCreate: Omit<IPermission, '_id'>[] = [];

    if (formPermissionsOfUser.doesHavePermissionsManagement && !existingPermissionsOfUser?.permissionsManagementId) {
        permissionsToCreate.push({ userId: formPermissionsOfUser.user.id, resourceType: 'Permissions', category: 'All' });
    } else if (!formPermissionsOfUser.doesHavePermissionsManagement && existingPermissionsOfUser?.permissionsManagementId) {
        permissonsIdsToDelete.push(existingPermissionsOfUser.permissionsManagementId);
    }

    if (formPermissionsOfUser.doesHaveTemplatesManagement && !existingPermissionsOfUser?.templatesManagementId) {
        permissionsToCreate.push({ userId: formPermissionsOfUser.user.id, resourceType: 'Templates', category: 'All' });
    } else if (!formPermissionsOfUser.doesHaveTemplatesManagement && existingPermissionsOfUser?.templatesManagementId) {
        permissonsIdsToDelete.push(existingPermissionsOfUser.templatesManagementId);
    }

    categories.forEach((category) => {
        const permissionsOfUserDialogStateForCategory = formPermissionsOfUser.instancesPermissions.find(
            ({ category: currCategoryId }) => currCategoryId === category._id,
        );
        const existingPermissionsOfUserForCategory = existingPermissionsOfUser?.instancesPermissions.find(
            ({ category: currCategoryId }) => currCategoryId === category._id,
        );

        if (permissionsOfUserDialogStateForCategory && !existingPermissionsOfUserForCategory) {
            permissionsToCreate.push({ userId: formPermissionsOfUser.user.id, resourceType: 'Instances', category: category._id });
        } else if (!permissionsOfUserDialogStateForCategory && existingPermissionsOfUserForCategory) {
            permissonsIdsToDelete.push(existingPermissionsOfUserForCategory._id);
        }
    });

    return { permissonsIdsToDelete, permissionsToCreate };
};

const createOrEditPermissionsOfUserRequest = async (
    formPermissionsOfUser: Omit<IFormPermissionsOfUser, 'user'> & { user: IUser },
    categories: IMongoCategory[],
    existingPermissionsOfUser?: IPermissionsOfUser,
) => {
    const { permissonsIdsToDelete, permissionsToCreate } = getPermissionsToDeleteAndCreate(
        formPermissionsOfUser,
        categories,
        existingPermissionsOfUser,
    );

    if (permissonsIdsToDelete.length > 0) {
        await deletePermissionsBulkRequest(permissonsIdsToDelete);
    }
    const createdPermissions = await createPermissionsBulkRequest(permissionsToCreate);

    const createdPermissionsManagement = createdPermissions.find(({ resourceType }) => resourceType === 'Permissions');
    const createdTemplatesManagement = createdPermissions.find(({ resourceType }) => resourceType === 'Templates');

    const newPermissionsOfUser: IPermissionsOfUser = {
        user: formPermissionsOfUser.user,
        permissionsManagementId: !formPermissionsOfUser.doesHavePermissionsManagement
            ? null
            : createdPermissionsManagement?._id ?? existingPermissionsOfUser!.permissionsManagementId,
        templatesManagementId: !formPermissionsOfUser.doesHaveTemplatesManagement
            ? null
            : createdTemplatesManagement?._id ?? existingPermissionsOfUser!.templatesManagementId,
        instancesPermissions: categories
            .map((category) => {
                const doesUserHasPermissionForCategory = formPermissionsOfUser.instancesPermissions.some(
                    ({ category: categoryId }) => categoryId === category._id,
                );
                if (!doesUserHasPermissionForCategory) {
                    return null;
                }

                const createdPermissionForCategory = createdPermissions.find(({ category: categoryId }) => categoryId === category._id);
                if (createdPermissionForCategory) {
                    return { _id: createdPermissionForCategory._id, category: createdPermissionForCategory.category };
                }
                const existingPermissionForCategory = existingPermissionsOfUser?.instancesPermissions.find(
                    ({ category: categoryId }) => categoryId === category._id,
                );
                if (existingPermissionForCategory) {
                    return existingPermissionForCategory;
                }

                throw new Error('if user has permission to category, it should exist or be created');
            })
            .filter(Boolean) as Pick<IPermission, '_id' | 'category'>[],
    };
    return newPermissionsOfUser;
};

const PermissionsOfUserDialog: React.FC<{
    isOpen: boolean;
    handleClose: () => any;
    mode: 'create' | 'edit' | 'read';
    existingPermissionsOfUser?: IPermissionsOfUser;
}> = ({ isOpen, handleClose, mode, existingPermissionsOfUser }) => {
    // useEffect(() => {
    //     setPermissionsOfUser(_cloneDeep(existingPermissionsOfUser) ?? defaultEmptyPermissionsOfUser);
    //     // isOpen is in the list because: we want reset dialog state on reopen. dialog state is kept even after closing & reopening
    // }, [isOpen, existingPermissionsOfUser]);

    const queryClient = useQueryClient();
    const allPermissions = queryClient.getQueryData<IPermissionsOfUser[]>('getAllPermissions');
    const categories = queryClient.getQueryData<IMongoCategory[]>('getCategories')!;

    const { mutateAsync: createOrEditPermissionsOfUser } = useMutation(
        (formPermissionsOfUser: Omit<IFormPermissionsOfUser, 'user'> & { user: IUser }) =>
            createOrEditPermissionsOfUserRequest(formPermissionsOfUser, categories, existingPermissionsOfUser),
        {
            onError: (error) => {
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
        <Dialog open={isOpen} onClose={handleClose} fullWidth maxWidth="xs" keepMounted={false}>
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
                            {mode === 'read' && i18next.t('permissions.permissionsOfUserDialog.readTitle')}
                        </DialogTitle>
                        <DialogContent>
                            <Box margin={1}>
                                <UserAutocomplete
                                    value={formikProps.values.user}
                                    onChange={(_e, chosenUser) => formikProps.setFieldValue('user', chosenUser)}
                                    onBlur={(event) => formikProps.handleBlur(event)}
                                    disabled={mode === 'read' || mode === 'edit' || formikProps.isSubmitting} // on edit mode, cant change user only his permissions
                                    isError={Boolean(formikProps.touched.user && formikProps.errors.user)}
                                    helperText={formikProps.touched.user ? formikProps.errors.user : ''}
                                />
                            </Box>

                            {/* dont show management permissions to regular user (if dont have at all) */}
                            {!(
                                mode === 'read' &&
                                !formikProps.values.doesHavePermissionsManagement &&
                                !formikProps.values.doesHaveTemplatesManagement
                            ) && (
                                <Box margin={1}>
                                    <ManagementPermissionsCard
                                        permissionsManagement={{
                                            checked: formikProps.values.doesHavePermissionsManagement,
                                            onChange:
                                                mode === 'read'
                                                    ? () => {}
                                                    : (_e, checked) => formikProps.setFieldValue('doesHavePermissionsManagement', checked),
                                            disabled: formikProps.isSubmitting,
                                        }}
                                        templatesManagement={{
                                            checked: formikProps.values.doesHaveTemplatesManagement,
                                            onChange:
                                                mode === 'read'
                                                    ? () => {}
                                                    : (_e, checked) => formikProps.setFieldValue('doesHaveTemplatesManagement', checked),
                                            disabled: formikProps.isSubmitting,
                                        }}
                                    />
                                </Box>
                            )}
                            <Box margin={1}>
                                <InstancesPermissionsCard
                                    categoriesCheckboxProps={categories.map(({ _id, displayName }) => ({
                                        categoryId: _id,
                                        categoryDisplayName: displayName,
                                        disabled: formikProps.isSubmitting,
                                        checked: formikProps.values.instancesPermissions.some(({ category }) => category === _id),
                                        onChange:
                                            mode === 'read'
                                                ? () => {}
                                                : (_e, checked) => {
                                                      if (checked) {
                                                          const newInstancesPermissions: Pick<IPermission, 'category'>[] = [
                                                              ...formikProps.values.instancesPermissions,
                                                              { category: _id },
                                                          ];
                                                          formikProps.setFieldValue('instancesPermissions', newInstancesPermissions);
                                                          return;
                                                      }

                                                      const newInstancesPermissions = formikProps.values.instancesPermissions.filter(
                                                          ({ category }) => category !== _id,
                                                      );
                                                      formikProps.setFieldValue('instancesPermissions', newInstancesPermissions);
                                                  },
                                    }))}
                                    checkboxAllProps={
                                        mode === 'read'
                                            ? undefined
                                            : {
                                                  checked: formikProps.values.instancesPermissions.length === categories.length,
                                                  indeterminate:
                                                      formikProps.values.instancesPermissions.length > 0 &&
                                                      formikProps.values.instancesPermissions.length < categories.length,
                                                  onChange: (_e, checked) => {
                                                      if (!checked) {
                                                          formikProps.setFieldValue('instancesPermissions', []);
                                                          return;
                                                      }
                                                      formikProps.setFieldValue(
                                                          'instancesPermissions',
                                                          categories.map(({ _id }) => ({ category: _id })),
                                                      );
                                                  },
                                              }
                                    }
                                />
                            </Box>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={handleClose} autoFocus disabled={formikProps.isSubmitting}>
                                {i18next.t('permissions.permissionsOfUserDialog.closeBtn')}
                            </Button>
                            {mode !== 'read' && (
                                <Button type="submit" disabled={formikProps.isSubmitting} variant="contained">
                                    {mode === 'create' && i18next.t('permissions.permissionsOfUserDialog.createBtn')}
                                    {mode === 'edit' && i18next.t('permissions.permissionsOfUserDialog.saveBtn')}
                                    {formikProps.isSubmitting && <CircularProgress size={20} />}
                                </Button>
                            )}
                        </DialogActions>
                    </Form>
                )}
            </Formik>
        </Dialog>
    );
};

export default PermissionsOfUserDialog;
