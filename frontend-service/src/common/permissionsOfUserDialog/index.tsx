import { Box, Button, Dialog, Grid, IconButton, Tab, useTheme } from '@mui/material';
import _isEqual from 'lodash.isequal';
import React, { ReactElement } from 'react';
import i18next from 'i18next';
import { TabContext, TabList, TabPanel } from '@mui/lab';
import { useTour } from '@reactour/tour';
import { useLocation } from 'wouter';
import CloseIcon from '@mui/icons-material/Close';
import { IUser } from '../../interfaces/users';
import { useDarkModeStore } from '../../stores/darkMode';
import MyPermissions from './myPermissions';
import MyAccount from './myAccount';

const PermissionsOfUserDialog: React.FC<{
    isOpen: boolean;
    handleClose: () => any;
    mode: 'create' | 'edit' | 'view';
    existingUser?: IUser;
    onSuccess?: (user?: IUser) => void;
}> = ({ isOpen, handleClose, mode, existingUser, onSuccess }) => {
    const [_, navigate] = useLocation();
    const { setIsOpen, setCurrentStep } = useTour();

    const darkMode = useDarkModeStore((state) => state.darkMode);
    const theme = useTheme();

    const initialTab = mode === 'view' ? 'myAccount' : 'myPermissions';
    const [tabValue, setTabValue] = React.useState(initialTab);

    const tabsComponentsMapping: Record<string, ReactElement> = {
        ...(mode === 'view' && { myAccount: <MyAccount handleClose={handleClose} existingUser={existingUser!} /> }),
        myPermissions: <MyPermissions handleClose={handleClose} mode={mode} existingUser={existingUser} onSuccess={onSuccess} />,
    };
    return (
        <Dialog
            open={isOpen}
            fullWidth
            maxWidth="sm"
            keepMounted={false}
            onClose={handleClose}
            PaperProps={{ sx: { bgcolor: darkMode ? '#060606' : 'white', overflow: 'hidden' } }}
        >
            <Box
                sx={{
                    width: '100%',
                    height: '100%',
                    padding: ' 0 20px 0px 20px',
                }}
            >
                <IconButton
                    aria-label="close"
                    onClick={handleClose}
                    sx={{
                        position: 'absolute',
                        right: 7,
                        top: 3,
                    }}
                >
                    <CloseIcon fontSize="medium" />
                </IconButton>
                <TabContext value={tabValue}>
                    <Grid container direction="column">
                        <Grid item>
                            <TabList onChange={(_event, newValue) => setTabValue(newValue)} scrollButtons="auto" variant="scrollable">
                                {Object.keys(tabsComponentsMapping).map((tabName) => (
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
                                        {/* {tabsPermissionsMapping[tabName] ? tabComponent : <NoPermissions />}  */}
                                        {tabComponent}
                                    </TabPanel>
                                );
                            })}
                        </Grid>
                    </Grid>
                </TabContext>
                <Grid display="flex" sx={{ position: 'absolute', bottom: 9, left: 10 }}>
                    {mode === 'view' && (
                        <Button
                            onClick={() => {
                                handleClose();
                                setIsOpen(true);
                                setCurrentStep(0);
                                navigate('?search=&viewMode=templates-tables-view');
                            }}
                        >
                            {i18next.t('showTour')}
                        </Button>
                    )}
                </Grid>
            </Box>
        </Dialog>
    );
};

export default PermissionsOfUserDialog;
