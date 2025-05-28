import { Box } from '@mui/material';
import i18next from 'i18next';
import React, { ReactElement, useEffect } from 'react';
import _debounce from 'lodash.debounce';
import '../../css/pages.css';

import MeltaTabs from '../../common/MeltaTabs';
import UsersRow from './components/UsersRow';
import RolesRow from './components/RolesRow';
import { useUserStore } from '../../stores/user';
import { PermissionScope } from '../../interfaces/permissions';

const PermissionsManagement: React.FC<{ setTitle: React.Dispatch<React.SetStateAction<string>> }> = ({ setTitle }) => {
    useEffect(() => setTitle(i18next.t('permissions.permissionsManagementPageTitle')), [setTitle]);

    const currentUser = useUserStore((state) => state.user);

    const tabsComponentsMapping: Record<string, ReactElement<any, any>> = {
        users: <UsersRow />,
        roles: <RolesRow />,
    };

    const permissionTab =
        currentUser.currentWorkspacePermissions.admin?.scope === PermissionScope.write ||
        currentUser.currentWorkspacePermissions.permissions?.scope === PermissionScope.write;

    const tabsPermissionsMapping: Record<string, boolean> = {
        users: permissionTab,
        roles: permissionTab,
    };

    return (
        <Box
            sx={{
                width: '100%',
                height: '100%',
            }}
        >
            <MeltaTabs defaultTab="users" tabsComponentsMapping={tabsComponentsMapping} tabsPermissionsMapping={tabsPermissionsMapping} />
        </Box>
    );
};

export default PermissionsManagement;
