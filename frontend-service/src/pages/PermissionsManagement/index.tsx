import { Box } from '@mui/material';
import i18next from 'i18next';
import React, { useEffect } from 'react';
import '../../css/pages.css';

import MeltaTabs from '../../common/MeltaDesigns/MeltaTabs';
import { PermissionScope } from '../../interfaces/permissions';
import { useUserStore } from '../../stores/user';
import RolesRow from './components/RolesRow';
import UsersRow from './components/UsersRow';

const PermissionsManagement: React.FC<{ setTitle: React.Dispatch<React.SetStateAction<string>> }> = ({ setTitle }) => {
    useEffect(() => setTitle(i18next.t('permissions.permissionsManagementPageTitle')), [setTitle]);

    const currentUser = useUserStore((state) => state.user);

    const tabsComponentsMapping: Record<string, React.ReactElement> = {
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
