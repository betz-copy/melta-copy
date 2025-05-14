import React from 'react';
import i18next from 'i18next';
import ManagePermissionTab from './ManagePermissionTab';

const UsersRow: React.FC = () => {
    return <ManagePermissionTab permissionType="user" searchPlaceholder={i18next.t('permissions.searchUser')} />;
};

export default UsersRow;
