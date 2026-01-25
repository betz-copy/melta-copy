import { Box, Button, CircularProgress, DialogActions, DialogContent, DialogTitle, Grid } from '@mui/material';
import { PermissionData } from '@packages/permission';
import { IUser, RelatedPermission } from '@packages/user';
import { Form, Formik, FormikProps } from 'formik';
import i18next from 'i18next';
import { cloneDeep, debounce, isEqual } from 'lodash';
import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import * as Yup from 'yup';
import { PermissionDialogMode } from '../../interfaces/inputs';
import { IChildTemplateMap, IEntityTemplateMap } from '../../interfaces/template';
import { deletePermissions } from '../../pages/PermissionsManagement/components/deleteDialog';
import {
    createUserRequest,
    getAllWorkspaceRolesRequest,
    syncPermissionsRequest,
    updateUserRequest,
    updateUserRoleIdsRequest,
} from '../../services/userService';
import { useDarkModeStore } from '../../stores/darkMode';
import { useUserStore } from '../../stores/user';
import { useWorkspaceStore } from '../../stores/workspace';
import { createDialogCategories, isPermissionsEquals, userHasNoPermissions } from '../../utils/permissions/permissionOfUserDialog';
import RoleAutocomplete from '../inputs/RoleAutocomplete';
import UnitSelect from '../inputs/UnitTreeSelect';
import UserAutocomplete from '../inputs/UserAutocomplete';
import BlueTitle from '../MeltaDesigns/BlueTitle';
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
    kartoffelId: '',
    units: {},
    permissions: {},
    displayName: '',
    usersUnitsWithInheritance: [],
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
    kartoffelId: '',
    permissions: {},
    displayName: '',
    units: {
        [workspaceId]: [],
    },
    usersUnitsWithInheritance: [],
});

const MyPermissions: React.FC<{
    handleClose: () => void;
    mode: PermissionDialogMode;
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
    const childTemplates = queryClient.getQueryData<IChildTemplateMap>('getChildTemplates')!;

    const { mutateAsync: createUser } = useMutation(
        (formUser: IUser) => createUserRequest(formUser.kartoffelId, formUser.permissions, workspace._id, formUser.roleIds, formUser.units),
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

    const { mutateAsync: updateUserRoleId } = useMutation(
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

    const { mutateAsync: deletePermissionsOfUser } = useMutation(
        () => syncPermissionsRequest(existingUser!._id, RelatedPermission.User, { [workspace._id]: deletePermissions }, true),
        {
            onError: (error) => {
                console.error('failed to delete personal permissions. error:', error);
                toast.error(i18next.t('permissions.failedToDeleteUser'));
            },
        },
    );

    const { mutateAsync: updateUserUnits } = useMutation(({ id, units }: { id: string; units: IUser['units'] }) => updateUserRequest(id, { units }), {
        onError: (error) => {
            console.error('failed to edit user units. error:', error);
            toast.error(i18next.t('permissions.permissionsOfUserDialog.failedToEditUnitsOfUser'));
        },
        onSuccess: (newUser) => {
            onSuccess?.(newUser);
            queryClient.invalidateQueries('allIFrames');
            toast.success(i18next.t('permissions.permissionsOfUserDialog.succeededToUpdatePermission'));
            handleClose();
        },
    });

    const { mutateAsync: syncUserPermissions } = useMutation(
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

                if (existingUser?._id === currentUser._id && !isEqual(currentUser.currentWorkspacePermissions, newPermissions[workspace._id])) {
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

    const searchRolesOptionsDebounced = debounce(searchRolesOptions, 1000);

    const prevRole = workspaceRoles?.find((role) => existingUser?.roleIds?.includes(role._id));

    return (
        <Formik
            initialValues={existingUser ? cloneDeep(existingUser) : (getDefaultEmptyUser(workspace._id) as IUser)}
            validationSchema={Yup.object({
                fullName: Yup.string().nullable().required(i18next.t('validation.required')),
            }).unknown(true)}
            validate={(formUser: IUser) => {
                if (mode === PermissionDialogMode.Create && allUsers?.some(({ _id }) => _id === formUser._id)) {
                    return { fullName: i18next.t('permissions.permissionsOfUserDialog.userAlreadyExistOnCreateMessage') };
                }

                return {};
            }}
            onSubmit={async (formUser) => {
                const currentRole = workspaceRoles?.find((role) => formUser.roleIds?.includes(role._id));

                if (mode === PermissionDialogMode.Create) await createUser(formUser);
                else {
                    if (!currentRole && !isEqual(existingUser?.permissions, formUser.permissions)) {
                        await syncUserPermissions(formUser); // update personal permissions (without roles)
                    } else if (!isEqual(prevRole, currentRole)) {
                        if (prevRole === undefined && !!currentRole) await deletePermissionsOfUser(); // when role added instead of personal permissions, remove personal permissions
                        await updateUserRoleId(formUser); // role changed, added or deleted
                    }

                    if (!isEqual(existingUser?.units, formUser.units)) await updateUserUnits({ id: formUser._id, units: formUser.units });
                }
            }}
        >
            {(formikProps: FormikProps<IUser>) => {
                const { values, touched, errors, handleBlur, setValues, setFieldValue, isSubmitting, initialValues } = formikProps;
                const formikRole = workspaceRoles?.find((role) => values.roleIds?.includes(role._id));

                return (
                    <Form>
                        <DialogTitle>
                            {mode !== PermissionDialogMode.View && (
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
                                    readOnly={mode === PermissionDialogMode.View}
                                    disabled={mode === PermissionDialogMode.Edit}
                                    isError={Boolean(touched.fullName && errors.fullName)}
                                    helperText={touched.fullName ? errors.fullName : ''}
                                    isOptionDisabled={(option) => !option.fullName || !option.jobTitle || !option.hierarchy || !option.mail}
                                    enableClear={mode === PermissionDialogMode.Create}
                                />
                            </Box>

                            {(mode !== PermissionDialogMode.View || values.roleIds) && (
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
                                        readOnly={mode === PermissionDialogMode.View}
                                        isError={Boolean(touched.roleIds && errors.roleIds)}
                                        helperText={touched.roleIds ? errors.roleIds : ''}
                                        enableClear={mode !== PermissionDialogMode.View}
                                        refetch={searchRolesOptionsDebounced}
                                        isLoading={isLoading}
                                    />
                                </Box>
                            )}

                            <Box sx={{ bgcolor: darkMode ? '#242424' : 'white', marginBottom: '15px', marginTop: '5px' }}>
                                <UnitSelect
                                    label={i18next.t('unitAutocomplete.label')}
                                    disabled={mode === PermissionDialogMode.View}
                                    value={values.units?.[workspace._id] ?? []}
                                    onChange={(chosenUnits) => {
                                        setFieldValue(`units.${workspace._id}`, !Array.isArray(chosenUnits) ? [chosenUnits] : chosenUnits);
                                    }}
                                    multiple
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
                            <Grid container justifyContent="space-between" marginTop="15px" width="100%">
                                <Grid>
                                    {mode !== PermissionDialogMode.View && (
                                        <Button
                                            type="submit"
                                            disabled={
                                                userHasNoPermissions(values.permissions[workspace._id]) &&
                                                isPermissionsEquals(initialValues.permissions, values.permissions) &&
                                                isEqual(initialValues.units, values.units)
                                            }
                                            variant="contained"
                                        >
                                            {mode === PermissionDialogMode.Create && i18next.t('permissions.permissionsOfUserDialog.createBtn')}
                                            {mode === PermissionDialogMode.Edit && i18next.t('permissions.permissionsOfUserDialog.saveBtn')}
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
