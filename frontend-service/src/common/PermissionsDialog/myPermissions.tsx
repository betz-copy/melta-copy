import { Box, Button, CircularProgress, DialogActions, DialogContent, DialogTitle, Grid } from '@mui/material';
import { Form, Formik, FormikProps } from 'formik';
import i18next from 'i18next';
import _cloneDeep from 'lodash.clonedeep';
import _isEqual from 'lodash.isequal';
import React from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import * as Yup from 'yup';

import { IUser } from '../../interfaces/users';
import { createUserRequest, syncUserPermissionsRequest } from '../../services/userService';
import { useDarkModeStore } from '../../stores/darkMode';
import { useUserStore } from '../../stores/user';
import { useWorkspaceStore } from '../../stores/workspace';
import UserAutocomplete from '../inputs/UserAutocomplete';

import {
    CategoryWithTemplates,
    didPermissionsChange,
    entityTemplatePermissionDialog,
    userHasNoPermissions,
} from '../../utils/permissions/permissionOfUserDialog';
import { IEntityTemplateMap } from '../../interfaces/entityTemplates';
import ManagePermissions from './managePermissions';

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

    const queryClient = useQueryClient();
    const allUsers = queryClient.getQueryData<IUser[]>('getAllUsers');

    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;
    const dialogPermissionData: Map<string, CategoryWithTemplates> = new Map();

    Array.from(entityTemplates.values()).forEach((entity) => {
        const category: CategoryWithTemplates = {
            entityTemplates: dialogPermissionData.get(entity.category._id)?.entityTemplates || [],
            ...entity.category,
        };
        const displayEntity: entityTemplatePermissionDialog = {
            id: entity._id,
            name: entity.displayName,
        };
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
                            <ManagePermissions
                                mode={mode}
                                dialogPermissionData={dialogPermissionData}
                                formikProps={formikProps}
                                workspace={workspace}
                            />
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
