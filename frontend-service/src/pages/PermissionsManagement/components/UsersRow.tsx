import React from 'react';
import i18next from 'i18next';
import ManagePermissionTab from './ManagePermissionTab';
import { RelatedPermission } from '../../../interfaces/users';

const UsersRow: React.FC = () => {
    return <ManagePermissionTab permissionType={RelatedPermission.User} searchPlaceholder={i18next.t('permissions.searchUser')} />;
};

export default UsersRow;
