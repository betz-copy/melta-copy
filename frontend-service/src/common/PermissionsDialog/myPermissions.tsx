import { Box, Button, CircularProgress, DialogActions, DialogContent, DialogTitle, Grid } from '@mui/material';
import { Form, Formik, FormikProps } from 'formik';
import i18next from 'i18next';
import _cloneDeep from 'lodash.clonedeep';
import _debounce from 'lodash.debounce';
import _isEqual from 'lodash.isequal';
import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import * as Yup from 'yup';

import { IUser, PermissionData, RelatedPermission } from '../../interfaces/users';
import {
    createUserRequest,
    getAllWorkspaceRolesRequest,
    syncPermissionsRequest,
    updateUserRoleIdsRequest,
    updateUserUnitsRequest,
} from '../../services/userService';
import { useDarkModeStore } from '../../stores/darkMode';
import { useUserStore } from '../../stores/user';
import { useWorkspaceStore } from '../../stores/workspace';
import UserAutocomplete from '../inputs/UserAutocomplete';

import _ from 'lodash';
import { IChildTemplateMap } from '../../interfaces/childTemplates';
import { IEntityTemplateMap } from '../../interfaces/entityTemplates';
import { deletePermissions } from '../../pages/PermissionsManagement/components/deleteDialog';
import { BackendConfigState } from '../../services/backendConfigService';
import { createDialogCategories, isPermissionsEquals, userHasNoPermissions } from '../../utils/permissions/permissionOfUserDialog';
import BlueTitle from '../MeltaDesigns/BlueTitle';
import RoleAutocomplete from '../inputs/RoleAutocomplete';
import UnitAutocomplete from '../inputs/UnitAutocomplete';
import ManagePermissions from './managePermissions';

export const defaultEmptyUser = {
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
    units: {},
} as IUser;

export const getDefaultEmptyUser = (workspaceId: string) => ({
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
    units: {
        [workspaceId]: [],
    },
});

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
    const [searchText, setSearchText] = useState('');

    const queryClient = useQueryClient();
    const allUsers = queryClient.getQueryData<IUser[]>('getAllUsers');

    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;
    const childTemplates = queryClient.getQueryData<IChildTemplateMap>('getChildEntityTemplates')!;

    const unitsArray = workspace.metadata.unitsArray;

    const { mutate: createUser } = useMutation(
        (formUser: IUser) =>
            createUserRequest(
                formUser.externalMetadata.kartoffelId,
                formUser.externalMetadata.digitalIdentitySource,
                formUser.permissions,
                workspace._id,
                formUser.roleIds,
                formUser.units,
            ),
        {
            onError: (error) => {
                console.error('failed to upsert permission. error:', error);
                toast.error(i18next.t('permissions.permissionsOfUserDialog.failedToCreatePermissionsOfUser'));
            },
            onSuccess: () => {
                queryClient.invalidateQueries('allIFrames');
                toast.success(i18next.t('permissions.permissionsOfUserDialog.succeededToCreatePermission'));
                handleClose();
                onSuccess?.();
            },
        },
    );

    const { mutate: updateUserRoleId } = useMutation(
        (formUser: IUser) => updateUserRoleIdsRequest(formUser._id, workspace._id, formUser.permissions, formUser.roleIds),
        {
            onError: (error) => {
                console.error('failed to upsert permission. error:', error);
                toast.error(i18next.t('permissions.permissionsOfUserDialog.failedToEditPermissionsOfUser'));
            },
            onSuccess: (newUser) => {
                onSuccess?.(newUser);
                queryClient.invalidateQueries('allIFrames');
                toast.success(i18next.t('permissions.permissionsOfUserDialog.succeededToUpdatePermission'));
                handleClose();
            },
        },
    );

    const { mutate: updateUserUnits } = useMutation((formUser: IUser) => updateUserUnitsRequest(formUser._id, workspace._id, formUser.units), {
        onError: (error) => {
            console.error('failed to upsert permission. error:', error);
            toast.error(i18next.t('permissions.permissionsOfUserDialog.failedToEditPermissionsOfUser'));
        },
        onSuccess: (newUser) => {
            onSuccess?.(newUser);
            queryClient.invalidateQueries('allIFrames');
            toast.success(i18next.t('permissions.permissionsOfUserDialog.succeededToUpdatePermission'));
            handleClose();
        },
    });

    const { mutateAsync: deletePermissionsOfUser } = useMutation(
        () => syncPermissionsRequest(existingUser!._id, RelatedPermission.User, { [workspace._id]: deletePermissions }, true),
        {
            onError: (error) => {
                console.error('failed to delete personal permissions. error:', error);
                toast.error(i18next.t('permissions.failedToDeleteUser'));
            },
        },
    );

    const { mutate: syncUserPermissions } = useMutation(
        async (formUser: IUser) => {
            return syncPermissionsRequest(formUser._id, RelatedPermission.User, {
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

    const {
        data: workspaceRoles,
        refetch: searchRolesOptions,
        isLoading,
    } = useQuery(['getAllWorkspaceRolesRequest', existingUser], () => getAllWorkspaceRolesRequest([workspace._id]), {
        enabled: !!workspace,
        staleTime: Infinity,
        cacheTime: Infinity,
        retry: false,
    });

    const searchRolesOptionsDebounced = _debounce(searchRolesOptions, 1000);

    const prevRole = workspaceRoles?.find((role) => existingUser?.roleIds?.includes(role._id));

    return (
        <Formik
            initialValues={existingUser ? _cloneDeep(existingUser) : (getDefaultEmptyUser(workspace._id) as IUser)}
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
                const currentRole = workspaceRoles?.find((role) => formUser.roleIds?.includes(role._id));

                if (mode === 'create') createUser(formUser);
                else {
                    if (!_.isEqual(existingUser?.units, formUser.units)) updateUserUnits(formUser); // units changed, added or deleted

                    if (!_.isEqual(existingUser?.permissions, formUser.permissions)) {
                        syncUserPermissions(formUser); // update personal permissions (without roles)
                    } else {
                        if (prevRole === undefined && !!currentRole) deletePermissionsOfUser(); // when role added instead of personal permissions, remove personal permissions
                        updateUserRoleId(formUser); // role changed, added or deleted
                    }
                }
            }}
        >
            {(formikProps: FormikProps<IUser>) => {
                const { values, touched, errors, handleBlur, setValues, setFieldValue, isSubmitting, initialValues } = formikProps;
                console.log('🚀 ~ values:', values);
                const formikRole = workspaceRoles?.find((role) => values.roleIds?.includes(role._id));
                // const formikUnits = workspaceUnits?.find((unit) => values.units?.includes(unit));

                return (
                    <Form>
                        <DialogTitle>
                            {mode !== 'view' && (
                                <BlueTitle
                                    title={i18next.t(`permissions.permissionsOfUserDialog.${mode}Title`)}
                                    component="h6"
                                    variant="h6"
                                    style={{ fontWeight: 600 }}
                                />
                            )}
                        </DialogTitle>
                        <DialogContent>
                            <Box sx={{ bgcolor: darkMode ? '#242424' : 'white', marginBottom: '15px', marginTop: '5px' }}>
                                <UserAutocomplete
                                    mode={existingUser ? 'internal' : 'external'}
                                    value={values}
                                    onChange={(_e, chosenUser, reason) => {
                                        if (reason === 'clear') {
                                            setValues(defaultEmptyUser);
                                            return;
                                        }
                                        setValues(chosenUser ?? defaultEmptyUser);
                                    }}
                                    onBlur={handleBlur}
                                    readOnly={mode === 'view'}
                                    disabled={mode === 'edit'}
                                    isError={Boolean(touched.fullName && errors.fullName)}
                                    helperText={touched.fullName ? errors.fullName : ''}
                                    isOptionDisabled={(option) => !option.fullName || !option.jobTitle || !option.hierarchy || !option.mail}
                                    enableClear={mode === 'create'}
                                />
                            </Box>

                            {(mode !== 'view' || values.roleIds) && (
                                <Box sx={{ bgcolor: darkMode ? '#242424' : 'white', marginBottom: '15px', marginTop: '5px' }}>
                                    <RoleAutocomplete
                                        value={formikRole}
                                        options={workspaceRoles}
                                        onChange={(_e, chosenRole, reason) => {
                                            if (reason === 'clear') {
                                                setFieldValue('roleIds', []);
                                                setFieldValue('permissions', existingUser?.permissions ?? {});
                                                return;
                                            }

                                            const currentRoleIds = values.roleIds ?? [];
                                            const updatedRoleIds = currentRoleIds.filter((id) => id !== prevRole?._id);
                                            if (chosenRole?._id) updatedRoleIds.push(chosenRole._id);
                                            setFieldValue('roleIds', updatedRoleIds);
                                            setFieldValue('permissions', chosenRole?.permissions ?? {});
                                        }}
                                        onBlur={handleBlur}
                                        readOnly={mode === 'view'}
                                        isError={Boolean(touched.roleIds && errors.roleIds)}
                                        helperText={touched.roleIds ? errors.roleIds : ''}
                                        enableClear={mode !== 'view'}
                                        refetch={searchRolesOptionsDebounced}
                                        isLoading={isLoading}
                                    />
                                </Box>
                            )}

                            <Box sx={{ bgcolor: darkMode ? '#242424' : 'white', marginBottom: '15px', marginTop: '5px' }}>
                                <UnitAutocomplete
                                    value={values.units?.[workspace._id] ?? []}
                                    options={unitsArray}
                                    onChange={(_e, chosenUnits, reason) => {
                                        if (reason === 'clear') {
                                            setFieldValue('units', {
                                                ...values.units,
                                                [workspace._id]: [],
                                            });
                                            return;
                                        }

                                        setFieldValue('units', {
                                            ...values.units,
                                            [workspace._id]: chosenUnits ?? [],
                                        });
                                    }}
                                    onBlur={handleBlur}
                                    readOnly={mode === 'view'}
                                    isError={Boolean(touched.roleIds && errors.roleIds)}
                                    helperText={touched.roleIds ? errors.roleIds : ''}
                                    enableClear={mode !== 'view'}
                                    isLoading={isLoading}
                                />
                            </Box>

                            {/* dont show management permissions to regular user (if dont have at all) */}
                            <ManagePermissions
                                mode={mode}
                                dialogPermissionData={createDialogCategories([...entityTemplates.values()], [...childTemplates.values()], searchText)}
                                formikProps={formikProps as FormikProps<PermissionData>}
                                workspace={workspace}
                                disableCheckboxes={!!formikRole}
                                searchText={{ value: searchText, set: setSearchText }}
                            />
                        </DialogContent>

                        <DialogActions sx={{ direction: 'rtl', marginRight: '1rem', marginBottom: '0.5rem' }}>
                            <Grid container justifyContent="space-between" marginTop="15px">
                                <Grid>
                                    {mode !== 'view' && (
                                        <Button
                                            type="submit"
                                            disabled={
                                                userHasNoPermissions(values.permissions[workspace._id]) &&
                                                isPermissionsEquals(initialValues.permissions, values.permissions) &&
                                                _.isEqual(initialValues.units, values.units)
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
export default MyPermissions;
