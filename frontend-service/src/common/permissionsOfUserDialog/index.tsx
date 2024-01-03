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
import {
    createPermissionsBulkRequest,
    deletePermissionsBulkRequest,
    IPermission,
    IPermissionsOfUser,
    PermissionResourceType,
} from '../../services/permissionsService';
import UserAutocomplete from '../inputs/UserAutocomplete';
import { IUser } from '../../services/kartoffelService';
import { ICategoryMap } from '../../interfaces/categories';
import ManagementPermissionsCard from './managementPermissionsCard';
import InstancesPermissionsCard from './instancesPermissionsCard';
import { RootState } from '../../store';
import {
    getUserCanReadInstanceOfCategory,
    getUserCanWriteInstanceOfCategory,
    getUserPermissionTypeToCategory,
} from '../../utils/permissions/instancePermissions';

const defaultEmptyPermissionsOfUser = {
    user: null,
    doesHavePermissionsManagement: false,
    doesHaveTemplatesManagement: false,
    doesHaveRulesManagement: false,
    doesHaveProcessesManagement: false,
    instancesPermissions: [],
} as IFormPermissionsOfUser;

type IFormPermissionsOfUser = {
    user: IUser | null;
    doesHavePermissionsManagement: boolean;
    doesHaveTemplatesManagement: boolean;
    doesHaveRulesManagement: boolean;
    doesHaveProcessesManagement: boolean;
    instancesPermissions: Pick<IPermission, 'category' | 'scopes'>[];
};

const doesUserHaveNoPermissions = (permissions: IFormPermissionsOfUser) => {
    return (
        !permissions.doesHavePermissionsManagement &&
        !permissions.doesHaveTemplatesManagement &&
        !permissions.doesHaveRulesManagement &&
        !permissions.doesHaveProcessesManagement &&
        permissions.instancesPermissions.length === 0
    );
};

const isPermissionsChanged = (currentPermissions: IFormPermissionsOfUser, newPermissions: IFormPermissionsOfUser) =>
    isEqualWith(currentPermissions, newPermissions, (firstValue, secondValue) => {
        if (Array.isArray(firstValue) && Array.isArray(secondValue)) {
            const firstInstancesPermissions = firstValue as IFormPermissionsOfUser['instancesPermissions'];
            const secondInstancesPermissions = secondValue as IFormPermissionsOfUser['instancesPermissions'];

            const firstInstancesPermissionsSorted = firstInstancesPermissions.sort((a, b) => a.category.localeCompare(b.category));
            const secondInstancesPermissionsSorted = secondInstancesPermissions.sort((a, b) => a.category.localeCompare(b.category));
            return isEqualWith(firstInstancesPermissionsSorted, secondInstancesPermissionsSorted);
        }

        return undefined;
    });

const permissionsToFormPermissions = ({
    user,
    permissionsManagementId,
    templatesManagementId,
    rulesManagementId,
    processesManagementId,
    instancesPermissions,
}: IPermissionsOfUser): IFormPermissionsOfUser => ({
    user,
    doesHavePermissionsManagement: Boolean(permissionsManagementId),
    doesHaveTemplatesManagement: Boolean(templatesManagementId),
    doesHaveRulesManagement: Boolean(rulesManagementId),
    doesHaveProcessesManagement: Boolean(processesManagementId),
    instancesPermissions: instancesPermissions.map(({ category, scopes }) => ({ category, scopes })),
});

const getPermissionsToDeleteAndCreate = (
    formPermissionsOfUser: Omit<IFormPermissionsOfUser, 'user'> & { user: IUser },
    categories: ICategoryMap,
    existingPermissionsOfUser?: IPermissionsOfUser,
): { permissonsIdsToDelete: string[]; permissionsToCreate: Omit<IPermission, '_id'>[] } => {
    const permissonsIdsToDelete: string[] = [];
    const permissionsToCreate: Omit<IPermission, '_id'>[] = [];
    const defaultScopes = ['Read', 'Write'] as IPermission['scopes'];
    if (formPermissionsOfUser.doesHavePermissionsManagement && !existingPermissionsOfUser?.permissionsManagementId) {
        permissionsToCreate.push({
            userId: formPermissionsOfUser.user.id,
            resourceType: PermissionResourceType.Permissions,
            category: 'All',
            scopes: defaultScopes,
        });
    } else if (!formPermissionsOfUser.doesHavePermissionsManagement && existingPermissionsOfUser?.permissionsManagementId) {
        permissonsIdsToDelete.push(existingPermissionsOfUser.permissionsManagementId);
    }

    if (formPermissionsOfUser.doesHaveTemplatesManagement && !existingPermissionsOfUser?.templatesManagementId) {
        permissionsToCreate.push({
            userId: formPermissionsOfUser.user.id,
            resourceType: PermissionResourceType.Templates,
            category: 'All',
            scopes: defaultScopes,
        });
    } else if (!formPermissionsOfUser.doesHaveTemplatesManagement && existingPermissionsOfUser?.templatesManagementId) {
        permissonsIdsToDelete.push(existingPermissionsOfUser.templatesManagementId);
    }

    if (formPermissionsOfUser.doesHaveRulesManagement && !existingPermissionsOfUser?.rulesManagementId) {
        permissionsToCreate.push({
            userId: formPermissionsOfUser.user.id,
            resourceType: PermissionResourceType.Rules,
            category: 'All',
            scopes: defaultScopes,
        });
    } else if (!formPermissionsOfUser.doesHaveRulesManagement && existingPermissionsOfUser?.rulesManagementId) {
        permissonsIdsToDelete.push(existingPermissionsOfUser.rulesManagementId);
    }

    if (formPermissionsOfUser.doesHaveProcessesManagement && !existingPermissionsOfUser?.processesManagementId) {
        permissionsToCreate.push({
            userId: formPermissionsOfUser.user.id,
            resourceType: PermissionResourceType.Processes,
            category: 'All',
            scopes: defaultScopes,
        });
    } else if (!formPermissionsOfUser.doesHaveProcessesManagement && existingPermissionsOfUser?.processesManagementId) {
        permissonsIdsToDelete.push(existingPermissionsOfUser.processesManagementId);
    }

    for (const id of categories.keys()) {
        const permissionsOfUserDialogStateForCategory = formPermissionsOfUser.instancesPermissions.find(
            ({ category: currCategoryId }) => currCategoryId === id,
        );
        const existingPermissionsOfUserForCategory = existingPermissionsOfUser?.instancesPermissions.find(
            ({ category: currCategoryId }) => currCategoryId === id,
        );

        if (permissionsOfUserDialogStateForCategory && !existingPermissionsOfUserForCategory) {
            permissionsToCreate.push({
                userId: formPermissionsOfUser.user.id,
                resourceType: PermissionResourceType.Instances,
                category: id,
                scopes: permissionsOfUserDialogStateForCategory.scopes,
            });
        } else if (!permissionsOfUserDialogStateForCategory && existingPermissionsOfUserForCategory) {
            permissonsIdsToDelete.push(existingPermissionsOfUserForCategory._id);
        }
    }

    return { permissonsIdsToDelete, permissionsToCreate };
};

const createOrEditPermissionsOfUserRequest = async (
    formPermissionsOfUser: Omit<IFormPermissionsOfUser, 'user'> & { user: IUser },
    categories: ICategoryMap,
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

    const createdPermissionsManagement = createdPermissions.find(({ resourceType }) => resourceType === PermissionResourceType.Permissions);
    const createdTemplatesManagement = createdPermissions.find(({ resourceType }) => resourceType === PermissionResourceType.Templates);
    const createdRulesManagement = createdPermissions.find(({ resourceType }) => resourceType === PermissionResourceType.Rules);
    const createdProcessesManagement = createdPermissions.find(({ resourceType }) => resourceType === PermissionResourceType.Processes);

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
            const doesUserHavePermissionForCategory = formPermissionsOfUser.instancesPermissions.some(
                ({ category: categoryId }) => categoryId === id,
            );
            if (!doesUserHavePermissionForCategory) {
                return null;
            }

            const createdPermissionForCategory = createdPermissions.find(({ category: categoryId, scopes }) => categoryId === id);
            if (createdPermissionForCategory) {
                return {
                    _id: createdPermissionForCategory._id,
                    category: createdPermissionForCategory.category,
                    scopes: createdPermissionForCategory.scopes,
                };
            }

            const existingPermissionForCategory = existingPermissionsOfUser?.instancesPermissions.find(
                ({ category: categoryId }) => categoryId === id,
            );
            if (existingPermissionForCategory) {
                return existingPermissionForCategory;
            }

            throw new Error('if user has permission to category, it should exist or be created');
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
    const navigate = useNavigate();
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
                                    categoriesCheckboxProps={Array.from(categories.values(), (category) => ({
                                        categoryId: category._id,
                                        categoryDisplayName: category.displayName,
                                        disabled: formikProps.isSubmitting,
                                        viewMode: mode === 'view',
                                        checkedRead: getUserCanReadInstanceOfCategory(
                                            formikProps.values.instancesPermissions as IPermissionsOfUser['instancesPermissions'],
                                            category,
                                        ),
                                        checkedWrite: getUserCanWriteInstanceOfCategory(
                                            formikProps.values.instancesPermissions as IPermissionsOfUser['instancesPermissions'],
                                            category,
                                        ),
                                        onChangeRead:
                                            mode === 'view'
                                                ? () => {}
                                                : (_e, checked) => {
                                                      if (checked) {
                                                          const newInstancesPermissions: Pick<IPermission, 'category' | 'scopes'>[] = [
                                                              ...formikProps.values.instancesPermissions,
                                                              { category: category._id, scopes: ['Read'] },
                                                          ];
                                                          formikProps.setFieldValue('instancesPermissions', newInstancesPermissions);
                                                          return;
                                                      }

                                                      const newInstancesPermissions = formikProps.values.instancesPermissions.filter(
                                                          ({ category: currCategory }) => currCategory !== category._id,
                                                      );
                                                      formikProps.setFieldValue('instancesPermissions', newInstancesPermissions);
                                                  },
                                        onChangeWrite:
                                            mode === 'view'
                                                ? () => {}
                                                : (_e, checked) => {
                                                      if (checked) {
                                                          const newInstancesPermissions: Pick<IPermission, 'category' | 'scopes'>[] = [
                                                              ...formikProps.values.instancesPermissions,
                                                              { category: category._id, scopes: ['Write', 'Read'] },
                                                          ];
                                                          formikProps.setFieldValue('instancesPermissions', newInstancesPermissions);
                                                          return;
                                                      }

                                                      const newInstancesPermissions = formikProps.values.instancesPermissions.filter(
                                                          ({ category: currCategory }) => currCategory !== category._id,
                                                      );
                                                      formikProps.setFieldValue('instancesPermissions', newInstancesPermissions);
                                                  },
                                    }))}
                                    // checkboxAllProps={
                                    //     mode === 'view'
                                    //         ? undefined
                                    //         : {
                                    //               checked: formikProps.values.instancesPermissions.length === categories.size,
                                    //               indeterminate:
                                    //                   formikProps.values.instancesPermissions.length > 0 &&
                                    //                   formikProps.values.instancesPermissions.length < categories.size,
                                    //               onChange: (_e, checked) => {
                                    //                   if (!checked) {
                                    //                       formikProps.setFieldValue('instancesPermissions', []);
                                    //                       return;
                                    //                   }
                                    //                   formikProps.setFieldValue(
                                    //                       'instancesPermissions',
                                    //                       Array.from(categories.keys(), (id) => ({ category: id })),
                                    //                   );
                                    //               },
                                    //           }
                                    // }
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
                                                navigate('/?search=&viewMode=templates-tables-view');
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
