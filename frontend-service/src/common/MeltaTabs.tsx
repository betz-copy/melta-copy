import React, { useEffect } from 'react';
import { Grid, Box, Tab, useTheme } from '@mui/material';
import { TabContext, TabList, TabPanel } from '@mui/lab';
import i18next from 'i18next';
import { useMatomo } from '@datapunt/matomo-tracker-react';
import { useSearchParams } from '../utils/hooks/useSearchParams';

const MeltaTabs: React.FC<{
    defaultTab: string;
    tabsComponentsMapping: Record<string, React.ReactElement<any, any>>;
    tabsPermissionsMapping: Record<string, boolean>;
}> = ({ defaultTab, tabsComponentsMapping, tabsPermissionsMapping }) => {
    const theme = useTheme();
    const { trackPageView } = useMatomo();

    const [searchParams, setSearchParams] = useSearchParams({ tab: defaultTab });
    const tabValue = searchParams.get('tab') ?? defaultTab;

    useEffect(() => {
        const tabPath = window.location.href;
        trackPageView({
            documentTitle: `System Management - ${tabValue}`,
            href: tabPath,
        });
    }, [tabValue, trackPageView]);

    const defaultTabs = Object.keys(tabsComponentsMapping).filter((tabName) => tabsPermissionsMapping[tabName]);

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
                        <TabList onChange={(_event, newValue) => setSearchParams({ tab: newValue })} scrollButtons="auto" variant="scrollable">
                            {defaultTabs.map((tabName) => (
                                <Tab
                                    key={tabName}
                                    label={i18next.t(tabName)}
                                    value={tabName}
                                    wrapped
                                    style={{
                                        fontWeight: tabValue === tabName ? '600' : '400',
                                        fontSize: '16px',
                                        fontFamily: 'Rubik',
                                    }}
                                    sx={{
                                        borderBottom: tabValue === tabName ? `2px solid ${theme.palette.primary.main}` : '',
                                    }}
                                />
                            ))}
                        </TabList>
                    </Grid>
                    <Grid item>
                        {Object.entries(tabsComponentsMapping).map(([tabName, tabComponent]) => {
                            return (
                                <TabPanel key={tabName} value={tabName}>
                                    {tabComponent}
                                </TabPanel>
                            );
                        })}
                    </Grid>
                </Grid>
            </TabContext>
        </Box>
    );
};

export default MeltaTabs;
