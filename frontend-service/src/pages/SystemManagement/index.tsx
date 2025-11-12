import { Box } from '@mui/material';
import i18next from 'i18next';
import React, { useEffect } from 'react';
import MeltaTabs from '../../common/MeltaDesigns/MeltaTabs';
import '../../css/pages.css';
import { PermissionScope } from '../../interfaces/permissions';
import { useUserStore } from '../../stores/user';
import CategoriesRow from './components/CategoriesRow';
import ConfigurationManagement from './components/ConfigurationManagement';
import PrintingTemplatesRow from './components/PrintingTemplatesRow';
import ProcessTemplatesRow from './components/ProcessTemplates/ProcessTemplatesRow';
import RelationshipTemplatesRow from './components/RelationshipTemplatesRow';
import RulesRow from './components/RulesRow';
import EntityTemplatesRow from './entityTemplatesRow';

const SystemManagement: React.FC<{ setTitle: React.Dispatch<React.SetStateAction<string>> }> = ({ setTitle }) => {
    useEffect(() => setTitle(i18next.t('pages.systemManagement')), [setTitle]);

    const currentUser = useUserStore((state) => state.user);

    const tabsComponentsMapping: Record<string, React.ReactElement> = {
        categories: <CategoriesRow />,
        entityTemplates: <EntityTemplatesRow />,
        relationshipTemplates: <RelationshipTemplatesRow />,
        rules: <RulesRow />,
        processTemplates: <ProcessTemplatesRow />,
        printingTemplates: <PrintingTemplatesRow />,
        configurationManagement: <ConfigurationManagement />,
    };

    const tabsPermissionsMapping: Record<string, boolean> = {
        categories:
            currentUser.currentWorkspacePermissions.templates?.scope === PermissionScope.write ||
            currentUser.currentWorkspacePermissions.admin?.scope === PermissionScope.write,
        entityTemplates:
            currentUser.currentWorkspacePermissions.templates?.scope === PermissionScope.write ||
            currentUser.currentWorkspacePermissions.admin?.scope === PermissionScope.write,
        relationshipTemplates:
            currentUser.currentWorkspacePermissions.templates?.scope === PermissionScope.write ||
            currentUser.currentWorkspacePermissions.admin?.scope === PermissionScope.write,
        rules:
            currentUser.currentWorkspacePermissions.rules?.scope === PermissionScope.write ||
            currentUser.currentWorkspacePermissions.admin?.scope === PermissionScope.write,
        processTemplates:
            currentUser.currentWorkspacePermissions.processes?.scope === PermissionScope.write ||
            currentUser.currentWorkspacePermissions.admin?.scope === PermissionScope.write,
        printingTemplates:
            currentUser.currentWorkspacePermissions.templates?.scope === PermissionScope.write ||
            currentUser.currentWorkspacePermissions.admin?.scope === PermissionScope.write,
        configurationManagement: !!currentUser.currentWorkspacePermissions.admin,
    };

    return (
        <Box
            sx={{
                width: '100%',
                height: '100%',
                paddingRight: '30px',
                paddingLeft: '30px',
            }}
        >
            <MeltaTabs defaultTab="categories" tabsComponentsMapping={tabsComponentsMapping} tabsPermissionsMapping={tabsPermissionsMapping} />
        </Box>
    );
};

export default SystemManagement;
