import React from 'react';
import i18next from 'i18next';
import ManagePermissionTab from './ManagePermissionTab';

const RolesRow: React.FC = () => {
    return <ManagePermissionTab permissionType="role" searchPlaceholder={i18next.t('permissions.searchRole')} />;
};

export default RolesRow;
