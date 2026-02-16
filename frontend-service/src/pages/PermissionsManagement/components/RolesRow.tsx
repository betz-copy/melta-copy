import { RelatedPermission } from '@packages/user';
import i18next from 'i18next';
import React from 'react';
import ManagePermissionTab from './ManagePermissionTab';

const RolesRow: React.FC = () => {
    return <ManagePermissionTab permissionType={RelatedPermission.Role} searchPlaceholder={i18next.t('permissions.searchRole')} />;
};

export default RolesRow;
