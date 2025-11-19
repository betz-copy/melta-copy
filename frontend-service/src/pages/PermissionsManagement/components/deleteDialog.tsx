import i18next from 'i18next';
import React from 'react';
import { useMutation } from 'react-query';
import { toast } from 'react-toastify';
import { AreYouSureDialog } from '../../../common/dialogs/AreYouSureDialog';
import { ISubCompactPermissions } from '../../../interfaces/permissions/permissions';
import { IUserPopulated, PermissionData, RelatedPermission } from '../../../interfaces/users';
import { syncPermissionsRequest, updateUserRoleIdsRequest } from '../../../services/userService';
import { useWorkspaceStore } from '../../../stores/workspace';

export const deletePermissions: Omit<Record<keyof ISubCompactPermissions, null>, 'admin'> = {
    permissions: null,
    rules: null,
    instances: null,
    processes: null,
    templates: null,
    units: null,
};

const DeletePermissionsDialog: React.FC<{
    isOpen: boolean;
    permissionType: RelatedPermission;
    roleOrUser: PermissionData | null;
    handleClose: () => void;
    onSuccess: () => void;
}> = ({ isOpen, permissionType, handleClose, roleOrUser, onSuccess }) => {
    const workspace = useWorkspaceStore((state) => state.workspace);
    const uppercasePermissionType = permissionType.charAt(0).toUpperCase() + permissionType.slice(1);

    const { mutateAsync: deleteAllPermissionsOfUser, isLoading: isLoadingDeleteAllPermissionsOfUser } = useMutation(
        () => syncPermissionsRequest(roleOrUser!._id, permissionType, { [workspace._id]: deletePermissions }),
        {
            onError: (error: any) => {
                console.error('failed to delete permission. error:', error);
                const isUserConnected = error.response.data.metadata.code.includes(`can't remove role: user connected`);
                toast.error(i18next.t(`permissions.failedToDelete${uppercasePermissionType}${isUserConnected ? 'CauseConnectedToUsers' : ''}`));
            },
            onSuccess: () => {
                onSuccess();
                toast.success(i18next.t(`permissions.succeededToDelete${uppercasePermissionType}`));
            },
        },
    );

    const { mutateAsync: updateUserRoleId } = useMutation(
        (payload: { userId: string; updatedRoleIds: string[] }) =>
            updateUserRoleIdsRequest(payload.userId, workspace._id, { [workspace._id]: deletePermissions }, payload.updatedRoleIds),
        {
            onError: (error: any) => {
                const isUserConnected = error.response?.data?.metadata?.code?.includes(`can't remove role: user connected`);
                toast.error(i18next.t(`permissions.failedToDelete${uppercasePermissionType}${isUserConnected ? 'CauseConnectedToUsers' : ''}`));
            },
            onSuccess: () => {
                onSuccess();
                toast.success(i18next.t(`permissions.succeededToDelete${uppercasePermissionType}`));
            },
        },
    );

    const handleDelete = async () => {
        try {
            if (permissionType === RelatedPermission.User) {
                const user = roleOrUser as IUserPopulated;
                const userRoles = user.roles || [];

                const updatedRoleIds = userRoles.filter((role) => !Object.keys(role.permissions).includes(workspace._id)).map((role) => role._id);

                if (updatedRoleIds.length !== userRoles.length) {
                    await updateUserRoleId({ userId: user._id, updatedRoleIds });
                } else {
                    await deleteAllPermissionsOfUser();
                }
            } else {
                await deleteAllPermissionsOfUser();
            }
        } finally {
            handleClose();
        }
    };

    return <AreYouSureDialog open={isOpen} handleClose={handleClose} onYes={handleDelete} isLoading={isLoadingDeleteAllPermissionsOfUser} />;
};

export default DeletePermissionsDialog;
