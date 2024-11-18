import i18next from 'i18next';
import React from 'react';
import { useMutation } from 'react-query';
import { toast } from 'react-toastify';

import { IUser } from '@microservices/shared';
import { AreYouSureDialog } from '../../common/dialogs/AreYouSureDialog';
import { syncUserPermissionsRequest } from '../../services/userService';
import { useWorkspaceStore } from '../../stores/workspace';

const DeletePermissionsOfUserDialog: React.FC<{ isOpen: boolean; user: IUser | null; handleClose: () => void; onSuccess: () => void }> = ({
    isOpen,
    handleClose,
    user,
    onSuccess,
}) => {
    const workspace = useWorkspaceStore((state) => state.workspace);
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
                onSuccess();
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
