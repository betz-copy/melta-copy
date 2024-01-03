import React, { ReactElement, useEffect } from 'react';
import { Grid, Box, Tab } from '@mui/material';
import { TabContext, TabList, TabPanel } from '@mui/lab';
import i18next from 'i18next';
import { useQueryClient } from 'react-query';
import { CategoriesRow } from './components/CategoriesRow';
import { EntityTemplatesRow } from './components/EntityTemplatesRow';
import { RelationshipTemplatesRow } from './components/RelationshipTemplatesRow';
import { RulesRow } from './components/RulesRow';
import { ProcessTemplatesRow } from './components/ProcessTemplatesRow';

import '../../css/pages.css';
import { IPermissionsOfUser } from '../../services/permissionsService';

const SystemManagement: React.FC<{ setTitle: React.Dispatch<React.SetStateAction<string>> }> = ({ setTitle }) => {
    useEffect(() => setTitle(i18next.t('pages.systemManagement')), [setTitle]);

    const [tabValue, setTabValue] = React.useState('categories');

    const queryClient = useQueryClient();
    const myPermissions = queryClient.getQueryData<IPermissionsOfUser>('getMyPermissions')!;

    const tabsComponentsMapping: Record<string, ReactElement<any, any>> = {
        categories: <CategoriesRow />,
        entityTemplates: <EntityTemplatesRow />,
        relationshipTemplates: <RelationshipTemplatesRow />,
        rules: <RulesRow />,
        processTemplates: <ProcessTemplatesRow />,
    };

    const tabsPermissionsMapping: Record<string, string | null> = {
        categories: myPermissions.templatesManagementId,
        entityTemplates: myPermissions.templatesManagementId,
        relationshipTemplates: myPermissions.templatesManagementId,
        rules: myPermissions.rulesManagementId,
        processTemplates: myPermissions.processesManagementId,
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
            <TabContext value={tabValue}>
                <Grid container direction="column">
                    <Grid item>
                        <TabList onChange={(_event, newValue) => setTabValue(newValue)} scrollButtons="auto" variant="scrollable">
                            {Object.entries(tabsComponentsMapping).map(([tabName, tabComponent]) => (
                                <Tab
                                    key={tabName}
                                    label={i18next.t(tabName)}
                                    value={tabName}
                                    wrapped
                                    style={{ fontWeight: tabValue === tabName ? '600' : '400', fontSize: '16px' }}
                                />
                            ))}
                        </TabList>
                    </Grid>
                    <Grid item>
                        {Object.entries(tabsComponentsMapping).map(([tabName, tabComponent]) => {
                            return (
                                <TabPanel key={tabName} value={tabName}>
                                    {tabsPermissionsMapping[tabName] && tabComponent}
                                </TabPanel>
                            );
                        })}
                    </Grid>
                </Grid>
            </TabContext>
        </Box>
    );
};

export default SystemManagement;
