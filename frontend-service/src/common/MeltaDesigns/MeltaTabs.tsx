import { useMatomo } from '@datapunt/matomo-tracker-react';
import { TabContext, TabList, TabPanel } from '@mui/lab';
import { Box, Grid, Tab, useTheme } from '@mui/material';
import i18next from 'i18next';
import React, { useEffect } from 'react';
import { useSearchParams } from '../../utils/hooks/useSearchParams';

const MeltaTabs: React.FC<{
    defaultTab: string;
    tabsComponentsMapping: Record<string, React.ReactElement>;
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

    const allowedTabs = Object.keys(tabsComponentsMapping).filter((tabName) => tabsPermissionsMapping[tabName]);
    const isCurrTab = (tabName: string) => tabValue === tabName;
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
                    <Grid>
                        <TabList onChange={(_event, newValue) => setSearchParams({ tab: newValue })} scrollButtons="auto" variant="scrollable">
                            {allowedTabs.map((tabName) => (
                                <Tab
                                    key={tabName}
                                    label={i18next.t(tabName)}
                                    value={tabName}
                                    wrapped
                                    style={{
                                        fontWeight: isCurrTab(tabName) ? '600' : '400',
                                        fontSize: '16px',
                                        fontFamily: 'Rubik',
                                        borderBottom: isCurrTab(tabName) ? `2px solid ${theme.palette.primary.main}` : '',
                                    }}
                                />
                            ))}
                        </TabList>
                    </Grid>
                    <Grid>
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
