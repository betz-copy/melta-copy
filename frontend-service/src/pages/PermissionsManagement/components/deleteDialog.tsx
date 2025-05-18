import i18next from 'i18next';
import React from 'react';
import { useMutation } from 'react-query';
import { toast } from 'react-toastify';

import { AreYouSureDialog } from '../../../common/dialogs/AreYouSureDialog';
import { syncPermissionsRequest } from '../../../services/userService';
import { useWorkspaceStore } from '../../../stores/workspace';
import { RelatedPermission } from '../../../interfaces/users';

const DeletePermissionsDialog: React.FC<{
    isOpen: boolean;
    permissionType: RelatedPermission;
    relatedId: string | null;
    handleClose: () => void;
    onSuccess: () => void;
}> = ({ isOpen, permissionType, handleClose, relatedId, onSuccess }) => {
    const workspace = useWorkspaceStore((state) => state.workspace);
    const uppercasePermissionType = permissionType.charAt(0).toUpperCase() + permissionType.slice(1);

    const { mutateAsync: deleteAllPermissionsOfUser, isLoading: isLoadingDeleteAllPermissionsOfUser } = useMutation(
        () =>
            syncPermissionsRequest(relatedId!, permissionType, {
                [workspace._id]: { permissions: null, rules: null, instances: null, processes: null, templates: null },
            }),
        {
            onError: (error) => {
                console.error('failed to delete permission. error:', error);
                toast.error(i18next.t(`permissions.failedToDelete${uppercasePermissionType}`));
            },
            onSuccess: (_data) => {
                onSuccess();
                toast.success(i18next.t(`permissions.succeededToDelete${uppercasePermissionType}`));
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

export default DeletePermissionsDialog;
