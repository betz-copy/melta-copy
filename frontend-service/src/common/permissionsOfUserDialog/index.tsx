import { Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Grid } from '@mui/material';
import { useTour } from '@reactour/tour';
import { Form, Formik, FormikProps } from 'formik';
import i18next from 'i18next';
import _cloneDeep from 'lodash.clonedeep';
import _isEqual from 'lodash.isequal';
import React, { useMemo } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { useLocation } from 'wouter';
import * as Yup from 'yup';
import { ICategoryMap } from '../../interfaces/categories';
import { PermissionScope } from '../../interfaces/permissions';
import { IUser } from '../../interfaces/users';
import { createUserRequest, syncUserPermissionsRequest } from '../../services/userService';
import { useDarkModeStore } from '../../stores/darkMode';
import { useUserStore } from '../../stores/user';
import { useWorkspaceStore } from '../../stores/workspace';
import {
    getChangedCategoryPermissions,
    checkUserCategoryPermission,
    getUserPermissionScopeOfCategory,
} from '../../utils/permissions/instancePermissions';
import {
    CategoryWithTemplates,
    didPermissionsChange,
    entityTemplatePermissionDialog,
    userHasNoPermissions,
} from '../../utils/permissions/permissionOfUserDialog';
import UserAutocomplete from '../inputs/UserAutocomplete';
import InstancesPermissionsCard from './instancesPermissionsCard';
import ManagementPermissionsCard from './managementPermissionsCard';
import { IEntityTemplateMap } from '../../interfaces/entityTemplates';

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
    onSuccess?: (user?: IUser) => void;
}> = ({ isOpen, handleClose, mode, existingUser, onSuccess }) => {
    const currentUser = useUserStore((state) => state.user);
    const setUser = useUserStore((state) => state.setUser);
    const workspace = useWorkspaceStore((state) => state.workspace);
    const [_, navigate] = useLocation();
    const { setIsOpen, setCurrentStep } = useTour();

    const darkMode = useDarkModeStore((state) => state.darkMode);

    const queryClient = useQueryClient();
    const categories = queryClient.getQueryData<ICategoryMap>('getCategories')!;
    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;
    const dialogPermissionData: Map<string, CategoryWithTemplates> = new Map();

    Array.from(entityTemplates.values()).forEach((entity) => {
        const baseCategory = categories.get(entity.category._id);
        if (baseCategory) {
            const category: CategoryWithTemplates = {
                entityTemplates: dialogPermissionData.get(entity.category._id)?.entityTemplates || [],
                ...baseCategory,
            };
            const displayEntity: entityTemplatePermissionDialog = {
                id: entity._id,
                name: entity.displayName,
            };
            category.entityTemplates = category?.entityTemplates ? [...category.entityTemplates, displayEntity] : [displayEntity];
            dialogPermissionData.set(entity.category._id, category);
        }
    });

    const { mutate: createUser } = useMutation(
        (formUser: IUser) =>
            createUserRequest(formUser.externalMetadata.kartoffelId, formUser.externalMetadata.digitalIdentitySource, formUser.permissions),
        {
            onError: (error) => {
                // eslint-disable-next-line no-console
                console.log('failed to upsert permission. error:', error);
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
                // eslint-disable-next-line no-console
                console.log('failed to upsert permission. error:', error);
                toast.error(i18next.t('permissions.permissionsOfUserDialog.failedToEditPermissionsOfUser'));
            },
            onSuccess: (newPermissions) => {
                if (!existingUser) return;

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
                                        onChange={(_e, chosenUser) => {
                                            formikProps.setValues(
                                                chosenUser ? { ...chosenUser, permissions: defaultEmptyUser.permissions } : defaultEmptyUser,
                                            );
                                        }}
                                        onBlur={formikProps.handleBlur}
                                        readOnly={mode === 'view'}
                                        disabled={mode === 'edit'}
                                        isError={Boolean(formikProps.touched.fullName && formikProps.errors.fullName)}
                                        helperText={formikProps.touched.fullName ? formikProps.errors.fullName?.toString() : ''}
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
                                        formikProps={formikProps}
                                        workspaceId={workspace._id}
                                        permissionsPath={permissionsPath}
                                        categoriesCheckboxProps={Array.from(dialogPermissionData.values(), (currCategory) => ({
                                            categoryId: currCategory._id,
                                            entityTemplates: currCategory.entityTemplates,
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
                                                                  const newPermission = getChangedCategoryPermissions(
                                                                      categoriesPermissions,
                                                                      checked,
                                                                      PermissionScope.read,
                                                                      currCategory._id,
                                                                  );

                                                                  if (
                                                                      !newPermission.scope &&
                                                                      Object.keys(newPermission.entityTemplates).length === 0
                                                                  ) {
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
                                                onClick={() => mode === 'edit' && onSuccess?.(formikProps.values)}
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
