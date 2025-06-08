import React from 'react';
import i18next from 'i18next';
import ManagePermissionTab from './ManagePermissionTab';
import { RelatedPermission } from '../../../interfaces/users';

const RolesRow: React.FC = () => {
    return <ManagePermissionTab permissionType={RelatedPermission.Role} searchPlaceholder={i18next.t('permissions.searchRole')} />;
};

export default RolesRow;
