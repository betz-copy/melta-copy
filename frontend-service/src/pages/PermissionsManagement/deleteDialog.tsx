import i18next from 'i18next';
import React from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';

import { AreYouSureDialog } from '../../common/dialogs/AreYouSureDialog';
import { IUser } from '../../interfaces/users';
import { syncUserPermissionsRequest } from '../../services/userService';
import { useWorkspaceStore } from '../../stores/workspace';

const DeletePermissionsOfUserDialog: React.FC<{ isOpen: boolean; user: IUser | null; handleClose: () => void }> = ({ isOpen, handleClose, user }) => {
    const workspace = useWorkspaceStore((state) => state.workspace);
    const queryClient = useQueryClient();
    const { mutateAsync: deleteAllPermissionsOfUser, isLoading: isLoadingDeleteAllPermissionsOfUser } = useMutation(
        () =>
            syncUserPermissionsRequest(user!._id, {
                [workspace._id]: { permissions: null, rules: null, instances: null, processes: null, templates: null },
            }),
        {
            onError: (error) => {
                console.log('failed to delete permission. error:', error);
                toast.error(i18next.t('permissions.failedToDeleteUser'));
            },
            onSuccess: (_data) => {
                queryClient.setQueryData<IUser[]>('getAllUsers', (oldUsers) => {
                    if (!oldUsers) throw new Error('should contain existing users when deleting');
                    return oldUsers.filter(({ _id }) => _id !== user!._id);
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
