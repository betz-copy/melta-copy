import { RelatedPermission } from '@microservices/shared';
import i18next from 'i18next';
import React from 'react';
import ManagePermissionTab from './ManagePermissionTab';

const UsersRow: React.FC = () => {
    return <ManagePermissionTab permissionType={RelatedPermission.User} searchPlaceholder={i18next.t('permissions.searchUser')} />;
};

export default UsersRow;
