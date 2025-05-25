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
import { PermissionScope } from '../../interfaces/permissions';
import { IUser } from '../../interfaces/users';
import { createUserRequest, syncUserPermissionsRequest } from '../../services/userService';
import { useDarkModeStore } from '../../stores/darkMode';
import { useUserStore } from '../../stores/user';
import { useWorkspaceStore } from '../../stores/workspace';
import {
    checkUserCategoryPermission,
    getChangedCategoryPermissions,
    getUserPermissionScopeOfCategory,
} from '../../utils/permissions/instancePermissions';
import UserAutocomplete from '../inputs/UserAutocomplete';
import InstancesPermissionsCard from './instancesPermissionsCard';
import ManagementPermissionsCard from './managementPermissionsCard';
import {
    CategoryWithTemplates,
    didPermissionsChange,
    entityChildTemplatePermissionDialog,
    entityTemplatePermissionDialog,
    userHasNoPermissions,
} from '../../utils/permissions/permissionOfUserDialog';
import { IEntityTemplateMap } from '../../interfaces/entityTemplates';
import { IEntityChildTemplateMap } from '../../interfaces/entityChildTemplates';

const MyPermissions: React.FC<{
    handleClose: () => void;
    mode: 'create' | 'edit' | 'view';
    existingUser?: IUser;
    onSuccess?: (user?: IUser) => void;
}> = ({ handleClose, mode, existingUser, onSuccess }) => {
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

    const permissionsPath = useMemo(() => `permissions.${workspace._id}`, [workspace]);
    const queryClient = useQueryClient();
    const allUsers = queryClient.getQueryData<IUser[]>('getAllUsers');
    const categories = queryClient.getQueryData<ICategoryMap>('getCategories')!;

    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;
    const entityChildTemplates = queryClient.getQueryData<IEntityChildTemplateMap>('getChildEntityTemplates')!;

    const dialogPermissionData: Map<string, CategoryWithTemplates> = new Map();

    Array.from(entityTemplates.values()).forEach((entity) => {
        const category: CategoryWithTemplates = {
            entityTemplates: dialogPermissionData.get(entity.category._id)?.entityTemplates || [],
            ...entity.category,
        };
        const displayEntityChildTemplates: entityChildTemplatePermissionDialog[] = Array.from(entityChildTemplates.values())
            .filter((child) => child.fatherTemplateId === entity._id)
            .map((child) => ({
                id: child._id,
                name: child.displayName,
                isFilterByCurrentUser: child.isFilterByCurrentUser,
                isFilterByUserUnit: child.isFilterByUserUnit,
                viewType: child.viewType,
                fatherTemplateId: child.fatherTemplateId,
            }));

        const displayEntity: entityTemplatePermissionDialog = {
            id: entity._id,
            name: entity.displayName,
            entityChildTemplates: displayEntityChildTemplates || [],
        };

        console.log('displayEntity', displayEntity);

        category.entityTemplates = category?.entityTemplates ? [...category.entityTemplates, displayEntity] : [displayEntity];
        dialogPermissionData.set(entity.category._id, category);
    });

    const { mutate: createUser } = useMutation(
        (formUser: IUser) =>
            createUserRequest(formUser.externalMetadata.kartoffelId, formUser.externalMetadata.digitalIdentitySource, formUser.permissions),
        {
            onError: (error) => {
                console.error('failed to upsert permission. error:', error);
                toast.error(i18next.t('permissions.permissionsOfUserDialog.failedToCreatePermissionsOfUser'));
            },
            onSuccess: () => {
                onSuccess?.();
                queryClient.invalidateQueries('allIFrames');
                toast.success(i18next.t('permissions.permissionsOfUserDialog.succeededToCreatePermission'));
                handleClose();
            },
        },
    );

    const { mutate: syncUserPermissions } = useMutation(
        async (formUser: IUser) => {
            return syncUserPermissionsRequest(formUser._id, {
                [workspace._id]: {
                    ...formUser.permissions[workspace._id],
                },
            });
        },
        {
            onError: (error) => {
                console.error('failed to upsert permission. error:', error);
                toast.error(i18next.t('permissions.permissionsOfUserDialog.failedToEditPermissionsOfUser'));
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

                const handleManagementPermissionCheck = (path: string, checked: boolean, permissionsManagement?: boolean) => {
                    formikProps.setFieldValue(path, checked ? { scope: PermissionScope.write } : null);
                    if (!permissionsManagement) return;
                    formikProps.setFieldValue(
                        `${permissionsPath}.instances.categories`,
                        Object.fromEntries(
                            checked ? Array.from(categories.keys()).map((categoryId) => [categoryId, { scope: PermissionScope.write }]) : [],
                        ),
                    );
                };

                return (
                    <Form>
                        <DialogTitle>
                            {mode === 'edit' && i18next.t('permissions.permissionsOfUserDialog.editTitle')}
                            {mode === 'create' && i18next.t('permissions.permissionsOfUserDialog.createTitle')}
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
                                                    : (_e, checked) =>
                                                          handleManagementPermissionCheck(`${permissionsPath}.permissions`, checked, true),
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
                                    formikProps={formikProps}
                                    workspaceId={workspace._id}
                                    permissionsPath={permissionsPath}
                                    categoriesCheckboxProps={Array.from(dialogPermissionData.values(), (currCategory) => ({
                                        categoryId: currCategory._id,
                                        categoryDisplayName: currCategory.displayName,
                                        disabled: formikProps.isSubmitting || currentPermissions?.admin?.scope === PermissionScope.write,
                                        scope: getUserPermissionScopeOfCategory(categoriesPermissions, currCategory._id),
                                        entityTemplates: currCategory.entityTemplates,
                                        permissionType: {
                                            read: {
                                                checked: checkUserCategoryPermission(currentPermissions, currCategory, PermissionScope.read),
                                                onChange:
                                                    mode === 'view'
                                                        ? () => {}
                                                        : (_e, checked: boolean) => {
                                                              const newPermission = getChangedCategoryPermissions(
                                                                  categoriesPermissions,
                                                                  checked,
                                                                  PermissionScope.read,
                                                                  currCategory._id,
                                                              );

                                                              if (!newPermission.scope && Object.keys(newPermission.entityTemplates).length === 0) {
                                                                  delete categoriesPermissions[currCategory._id];
                                                              } else {
                                                                  categoriesPermissions[currCategory._id] = newPermission;
                                                              }

                                                              formikProps.setFieldValue(
                                                                  `${permissionsPath}.instances.categories`,
                                                                  categoriesPermissions,
                                                              );
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
                                                                  [currCategory._id]: getChangedCategoryPermissions(
                                                                      categoriesPermissions,
                                                                      checked,
                                                                      PermissionScope.write,
                                                                      currCategory._id,
                                                                  ),
                                                              });
                                                          },
                                            },
                                        },
                                    }))}
                                    checkboxAllProps={
                                        mode === 'view'
                                            ? undefined
                                            : {
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
                                                                      : Object.fromEntries(
                                                                            Array.from(categories.keys()).map((categoryId) => [
                                                                                categoryId,
                                                                                { scope: PermissionScope.read },
                                                                            ]),
                                                                        ),
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
                                                              Array.from(categories).forEach(([categoryId]) => {
                                                                  const newPermission = getChangedCategoryPermissions(
                                                                      categoriesPermissions,
                                                                      checked,
                                                                      PermissionScope.read,
                                                                      categoryId,
                                                                  );

                                                                  if (
                                                                      !newPermission.scope &&
                                                                      Object.keys(newPermission.entityTemplates).length === 0
                                                                  ) {
                                                                      delete categoriesPermissions[categoryId];
                                                                  } else {
                                                                      categoriesPermissions[categoryId] = newPermission;
                                                                  }
                                                              });
                                                              formikProps.setFieldValue(
                                                                  `${permissionsPath}.instances.categories`,
                                                                  categoriesPermissions,
                                                              );
                                                          },
                                                      },
                                                  },
                                              }
                                    }
                                />
                            </Box>
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
export default MyPermissions;
