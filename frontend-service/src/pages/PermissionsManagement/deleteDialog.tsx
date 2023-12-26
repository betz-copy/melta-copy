import i18next from 'i18next';
import React from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';

import { AreYouSureDialog } from '../../common/dialogs/AreYouSureDialog';
import { IPermissionsOfUser, deletePermissionsBulkRequest } from '../../services/permissionsService';

const deleteAllPermissionsOfUserRequest = async ({ permissionsManagementId, templatesManagementId, instancesPermissions }: IPermissionsOfUser) => {
    const permissionsOfUsersIds: string[] = instancesPermissions.map(({ _id }) => _id);
    if (permissionsManagementId) {
        permissionsOfUsersIds.push(permissionsManagementId);
    }
    if (templatesManagementId) {
        permissionsOfUsersIds.push(templatesManagementId);
    }

    return deletePermissionsBulkRequest(permissionsOfUsersIds);
};

const DeletePermissionsOfUserDialog: React.FC<{ isOpen: boolean; permissionsOfUser: IPermissionsOfUser | null; handleClose: () => void }> = ({
    isOpen,
    handleClose,
    permissionsOfUser,
}) => {
    const queryClient = useQueryClient();
    const { mutateAsync: deleteAllPermissionsOfUser, isLoading: isLoadingDeleteAllPermissionsOfUser } = useMutation(
        () => deleteAllPermissionsOfUserRequest(permissionsOfUser!),
        {
            onError: (error) => {
                console.log('failed to delete permission. error:', error);
                toast.error(i18next.t('permissions.failedToDeleteUser'));
            },
            onSuccess: (_data) => {
                queryClient.setQueryData<IPermissionsOfUser[]>('getAllPermissions', (oldPermissions) => {
                    if (!oldPermissions) throw new Error('should contain existing permissions when deleting');
                    return oldPermissions.filter(({ user }) => user.id !== permissionsOfUser?.user.id);
                });
                toast.success(i18next.t('permissions.succeededToDeleteUser'));
            },
        },
    );

    return (
        <AreYouSureDialog
            open={isOpen}
            handleClose={handleClose}
            onYes={async () => {
                await deleteAllPermissionsOfUser();
                handleClose();
            }}
            isLoading={isLoadingDeleteAllPermissionsOfUser}
        />
    );
};

export default DeletePermissionsOfUserDialog;
