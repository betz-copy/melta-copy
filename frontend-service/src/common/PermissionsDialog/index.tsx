import { Close as CloseIcon } from '@mui/icons-material';
import { TabContext, TabList, TabPanel } from '@mui/lab';
import { Box, Button, Dialog, Grid, IconButton, Tab } from '@mui/material';
import { useTour } from '@reactour/tour';
import i18next from 'i18next';
import React, { ReactElement, useState } from 'react';
import { useQueryClient } from 'react-query';
import { useLocation } from 'wouter';
import { environment } from '../../globals';
import { IRole } from '../../interfaces/roles';
import { IUser, PermissionData, RelatedPermission } from '../../interfaces/users';
import { MeltaUpdates } from '../../MeltaUpdates';
import { BackendConfigState } from '../../services/backendConfigService';
import { useDarkModeStore } from '../../stores/darkMode';
import { LocalStorage } from '../../utils/localStorage';
import { AreYouSureDialog } from '../dialogs/AreYouSureDialog';
import MyAccount from './myAccount';
import MyPermissions from './myPermissions';
import RoleDialog from './RoleDialog';

const PermissionsDialog: React.FC<{
    isOpen: boolean;
    handleClose: () => void;
    mode: 'create' | 'edit' | 'view';
    roleOrUser?: PermissionData;
    onSuccess?: (roleOrUser?: PermissionData) => void;
    permissionType: RelatedPermission;
}> = ({ isOpen, handleClose, mode, roleOrUser, onSuccess, permissionType }) => {
    const [_, navigate] = useLocation();
    const { setIsOpen, setCurrentStep } = useTour();

    const darkMode = useDarkModeStore((state) => state.darkMode);

    const initialTab = mode === 'view' ? 'myAccount' : 'myPermissions';
    const [tabValue, setTabValue] = useState(initialTab);
    const [isPreferencesUpdated, setIsPreferencesUpdated] = useState(false);
    const [isUnsavedChangesDialogOpen, setIsUnsavedChangesDialogOpen] = useState(false);

    const [openMeltaUpdates, setOpenMeltaUpdates] = useState(false);
    const queryClient = useQueryClient();
    const config = queryClient.getQueryData<BackendConfigState>('getBackendConfig');

    const tabsComponentsMapping: Record<string, ReactElement> = {
        ...(mode === 'view' && {
            myAccount: (
                <MyAccount
                    handleClose={handleClose}
                    existingUser={roleOrUser as IUser}
                    isPreferencesUpdated={isPreferencesUpdated}
                    setIsPreferencesUpdated={setIsPreferencesUpdated}
                />
            ),
        }),
        myPermissions: <MyPermissions handleClose={handleClose} mode={mode} existingUser={roleOrUser as IUser} onSuccess={onSuccess} />,
    };

    const handleCloseMeltaUpdates = () => {
        setOpenMeltaUpdates(false);
        LocalStorage.set(environment.meltaUpdatesShown, JSON.stringify(config?.meltaUpdates));
    };

    return (
        <Dialog
            open={isOpen}
            fullWidth
            maxWidth="sm"
            keepMounted={false}
            onClose={handleClose}
            slotProps={{ paper: { sx: { bgcolor: darkMode ? '#060606' : 'white', overflow: 'hidden' } } }}
        >
            <IconButton onClick={handleClose} sx={{ position: 'absolute', right: 8, top: 8, zIndex: 99 }}>
                <CloseIcon fontSize="medium" />
            </IconButton>
            {mode !== 'view' ? (
                permissionType === RelatedPermission.User ? (
                    <MyPermissions handleClose={handleClose} mode={mode} existingUser={roleOrUser as IUser} onSuccess={onSuccess} />
                ) : (
                    <RoleDialog handleClose={handleClose} mode={mode} existingRole={roleOrUser as IRole} onSuccess={onSuccess} />
                )
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
                            <Grid>
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
                            <Grid>
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
                        <Button
                            onClick={() => {
                                setOpenMeltaUpdates(true);
                            }}
                            disabled={!config?.meltaUpdates}
                        >
                            {i18next.t('meltaUpdates.btn')}
                        </Button>
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
            {config?.meltaUpdates && (
                <MeltaUpdates
                    open={openMeltaUpdates}
                    handleClose={handleCloseMeltaUpdates}
                    meltaUpdates={config?.meltaUpdates}
                    titleDescription={config?.meltaUpdatesDescription}
                />
            )}
        </Dialog>
    );
};

export default PermissionsDialog;
