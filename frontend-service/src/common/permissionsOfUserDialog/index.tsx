import CloseIcon from '@mui/icons-material/Close';
import { TabContext, TabList, TabPanel } from '@mui/lab';
import { Box, Button, Dialog, Grid, IconButton, Tab, useTheme } from '@mui/material';
import { useTour } from '@reactour/tour';
import i18next from 'i18next';
import React, { ReactElement } from 'react';
import { useLocation } from 'wouter';
import { IUser } from '../../interfaces/users';
import { useDarkModeStore } from '../../stores/darkMode';
import MyAccount from './myAccount';
import MyPermissions from './myPermissions';
import { AreYouSureDialog } from '../dialogs/AreYouSureDialog';

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
    const [isPreferencesUpdated, setIsPreferencesUpdated] = React.useState(false);
    const [isUnsavedChangesDialogOpen, setIsUnsavedChangesDialogOpen] = React.useState(false);

    const tabsComponentsMapping: Record<string, ReactElement> = {
        ...(mode === 'view' && {
            myAccount: (
                <MyAccount
                    handleClose={handleClose}
                    existingUser={existingUser!}
                    isPreferencesUpdated={isPreferencesUpdated}
                    setIsPreferencesUpdated={setIsPreferencesUpdated}
                />
            ),
        }),
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
            <IconButton onClick={handleClose} sx={{ position: 'absolute', right: 8, top: 8, zIndex: 99 }}>
                <CloseIcon fontSize="medium" />
            </IconButton>
            {mode !== 'view' ? (
                <MyPermissions handleClose={handleClose} mode={mode} existingUser={existingUser} onSuccess={onSuccess} />
            ) : (
                <Box
                    sx={{
                        width: '100%',
                        height: '100%',
                        padding: '0 10px 0px 10px',
                    }}
                >
                    <TabContext value={tabValue}>
                        <Grid container direction="column">
                            <Grid item>
                                <TabList
                                    onChange={(_event, newValue) => {
                                        if (newValue === 'myPermissions' && isPreferencesUpdated) {
                                            setIsUnsavedChangesDialogOpen(true);
                                        } else setTabValue(newValue);
                                    }}
                                    scrollButtons="auto"
                                    variant="scrollable"
                                >
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
                                        />
                                    ))}
                                </TabList>
                            </Grid>
                            <Grid item>
                                {Object.entries(tabsComponentsMapping).map(([tabName, tabComponent]) => {
                                    return (
                                        <TabPanel key={tabName} value={tabName} sx={{ padding: 0 }}>
                                            {tabComponent}
                                        </TabPanel>
                                    );
                                })}
                            </Grid>
                        </Grid>
                    </TabContext>

                    <Grid display="flex" sx={{ position: 'absolute', bottom: 15, left: 15 }}>
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
            )}

            <AreYouSureDialog
                open={isUnsavedChangesDialogOpen}
                onYes={() => {
                    setTabValue('myPermissions');
                    setIsUnsavedChangesDialogOpen(false);
                }}
                onNo={() => {
                    setTabValue(tabValue);
                    setIsUnsavedChangesDialogOpen(false);
                }}
                handleClose={() => {
                    setIsUnsavedChangesDialogOpen(false);
                }}
                body={i18next.t('user.areYouSure')}
            />
        </Dialog>
    );
};

export default PermissionsOfUserDialog;
