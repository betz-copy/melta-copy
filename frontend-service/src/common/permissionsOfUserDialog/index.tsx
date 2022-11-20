import React from 'react';
import { Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Grid } from '@mui/material';
import i18next from 'i18next';
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import _cloneDeep from 'lodash.clonedeep';
import isEqualWith from 'lodash.isequalwith';
import { useSelector } from 'react-redux';
import { Form, Formik, FormikProps } from 'formik';
import * as Yup from 'yup';
import { useTour } from '@reactour/tour';
import { useNavigate } from 'react-router-dom';
import { createPermissionsBulkRequest, deletePermissionsBulkRequest, IPermission, IPermissionsOfUser } from '../../services/permissionsService';
import UserAutocomplete from '../inputs/UserAutocomplete';
import { IUser } from '../../services/kartoffelService';
import { IMongoCategory } from '../../interfaces/categories';
import ManagementPermissionsCard from './managementPermissionsCard';
import InstancesPermissionsCard from './instancesPermissionsCard';
import { RootState } from '../../store';

const defaultEmptyPermissionsOfUser = {
    user: null,
    doesHavePermissionsManagement: false,
    doesHaveTemplatesManagement: false,
    doesHaveRulesManagement: false,
    instancesPermissions: [],
} as IFormPermissionsOfUser;

type IFormPermissionsOfUser = {
    user: IUser | null;
    doesHavePermissionsManagement: boolean;
    doesHaveTemplatesManagement: boolean;
    doesHaveRulesManagement: boolean;
    instancesPermissions: Pick<IPermission, 'category'>[];
};

const doesUserHaveNoPermissions = (permissions: IFormPermissionsOfUser) => {
    return (
        !permissions.doesHavePermissionsManagement &&
        !permissions.doesHaveTemplatesManagement &&
        !permissions.doesHaveRulesManagement &&
        permissions.instancesPermissions.length === 0
    );
};

const isPermissionsChanged = (currentPermissions: IFormPermissionsOfUser, newPermissions: IFormPermissionsOfUser) => {
    return isEqualWith(currentPermissions, newPermissions, (firstValue, secondValue) => {
        if (Array.isArray(firstValue) && Array.isArray(secondValue)) {
            const firstInstancesPermissions = firstValue as IFormPermissionsOfUser['instancesPermissions'];
            const secondInstancesPermissions = secondValue as IFormPermissionsOfUser['instancesPermissions'];

            const firstInstancesPermissionsSorted = firstInstancesPermissions.sort((a, b) => a.category.localeCompare(b.category));
            const secondInstancesPermissionsSorted = secondInstancesPermissions.sort((a, b) => a.category.localeCompare(b.category));
            return isEqualWith(firstInstancesPermissionsSorted, secondInstancesPermissionsSorted);
        }

        return undefined;
    });
};

const permissionsToFormPermissions = ({
    user,
    permissionsManagementId,
    templatesManagementId,
    rulesManagementId,
    instancesPermissions,
}: IPermissionsOfUser): IFormPermissionsOfUser => ({
    user,
    doesHavePermissionsManagement: Boolean(permissionsManagementId),
    doesHaveTemplatesManagement: Boolean(templatesManagementId),
    doesHaveRulesManagement: Boolean(rulesManagementId),
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

    if (formPermissionsOfUser.doesHaveRulesManagement && !existingPermissionsOfUser?.rulesManagementId) {
        permissionsToCreate.push({ userId: formPermissionsOfUser.user.id, resourceType: 'Rules', category: 'All' });
    } else if (!formPermissionsOfUser.doesHaveRulesManagement && existingPermissionsOfUser?.rulesManagementId) {
        permissonsIdsToDelete.push(existingPermissionsOfUser.rulesManagementId);
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
    const createdRulesManagement = createdPermissions.find(({ resourceType }) => resourceType === 'Rules');

    const newPermissionsOfUser: IPermissionsOfUser = {
        user: formPermissionsOfUser.user,
        permissionsManagementId: !formPermissionsOfUser.doesHavePermissionsManagement
            ? null
            : createdPermissionsManagement?._id ?? existingPermissionsOfUser!.permissionsManagementId,
        templatesManagementId: !formPermissionsOfUser.doesHaveTemplatesManagement
            ? null
            : createdTemplatesManagement?._id ?? existingPermissionsOfUser!.templatesManagementId,
        rulesManagementId: !formPermissionsOfUser.doesHaveRulesManagement
            ? null
            : createdRulesManagement?._id ?? existingPermissionsOfUser!.rulesManagementId,
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
    const currentUser = useSelector((state: RootState) => state.user);
    const navigate = useNavigate();
    const { setIsOpen, setCurrentStep } = useTour();

    const darkMode = useSelector((state: RootState) => state.darkMode);

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
            PaperProps={{ sx: { bgcolor: darkMode ? '#060606' : 'white' } }}
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
                            {mode === 'read' && i18next.t('permissions.permissionsOfUserDialog.readTitle')}
                        </DialogTitle>
                        <DialogContent>
                            <Box margin={1} sx={{ bgcolor: darkMode ? '#242424' : 'white' }}>
                                <UserAutocomplete
                                    value={formikProps.values.user}
                                    onChange={(_e, chosenUser) => formikProps.setFieldValue('user', chosenUser)}
                                    onBlur={(event) => formikProps.handleBlur(event)}
                                    readOnly={mode === 'read'}
                                    disabled={mode === 'edit'}
                                    isError={Boolean(formikProps.touched.user && formikProps.errors.user)}
                                    helperText={formikProps.touched.user ? formikProps.errors.user : ''}
                                />
                            </Box>

                            {/* dont show management permissions to regular user (if dont have at all) */}
                            {!(
                                mode === 'read' &&
                                !formikProps.values.doesHavePermissionsManagement &&
                                !formikProps.values.doesHaveTemplatesManagement &&
                                !formikProps.values.doesHaveRulesManagement
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
                                            readOnly: mode === 'read',
                                        }}
                                        templatesManagement={{
                                            checked: formikProps.values.doesHaveTemplatesManagement,
                                            onChange:
                                                mode === 'read'
                                                    ? () => {}
                                                    : (_e, checked) => formikProps.setFieldValue('doesHaveTemplatesManagement', checked),
                                            disabled: formikProps.isSubmitting,
                                            readOnly: mode === 'read',
                                        }}
                                        rulesManagement={{
                                            checked: formikProps.values.doesHaveRulesManagement,
                                            onChange:
                                                mode === 'read'
                                                    ? () => {}
                                                    : (_e, checked) => formikProps.setFieldValue('doesHaveRulesManagement', checked),
                                            disabled: formikProps.isSubmitting,
                                            readOnly: mode === 'read',
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
                                        readOnly: mode === 'read',
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
                            <Grid container justifyContent="space-between">
                                <Grid>
                                    {mode === 'read' && (
                                        <Button
                                            onClick={() => {
                                                handleClose();
                                                setIsOpen(true);
                                                setCurrentStep(0);
                                                navigate('/');
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
                                    {mode !== 'read' && (
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
