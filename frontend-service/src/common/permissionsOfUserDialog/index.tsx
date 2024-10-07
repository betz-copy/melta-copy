import { Box, Dialog, Grid, Tab, useTheme } from '@mui/material';
import _isEqual from 'lodash.isequal';
import React, { ReactElement } from 'react';
import i18next from 'i18next';
import { TabContext, TabList, TabPanel } from '@mui/lab';
// import { useTour } from '@reactour/tour';
// import { useLocation } from 'wouter';
import { IUser } from '../../interfaces/users';
import { useDarkModeStore } from '../../stores/darkMode';
import MyPermissions from './myPermissions';
import MyAccount from './myAccount';

const PermissionsOfUserDialog: React.FC<{
    isOpen: boolean;
    handleClose: () => any;
    mode: 'create' | 'edit' | 'view';
    existingUser?: IUser;
}> = ({ isOpen, handleClose, mode, existingUser }) => {
    const darkMode = useDarkModeStore((state) => state.darkMode);
    const theme = useTheme();
    // const { setIsOpen, setCurrentStep } = useTour();
    // const [_, navigate] = useLocation();

    const [tabValue, setTabValue] = React.useState('myAccount');

    const tabsComponentsMapping: Record<string, ReactElement<any, any>> = {
        myAccount: <MyAccount existingUser={existingUser} />,
        myPermissions: <MyPermissions handleClose={handleClose} mode={mode} existingUser={existingUser} />,
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
                    paddingRight: '30px',
                    paddingLeft: '30px',
                }}
            >
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
            </Box>

            {/* <DialogActions>
                <Grid container justifyContent="space-between">
                    <Grid>
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
                   <Grid>
                        <Button onClick={handleClose} autoFocus>
                            {/* // disabled={formikProps.isSubmitting}>
                            {i18next.t('permissions.permissionsOfUserDialog.closeBtn')}
                        </Button>
                         {mode !== 'view' && (
                            <Button
                                type="submit"
                                disabled={
                                    formikProps.isSubmitting ||
                                    didPermissionsChange(formikProps.initialValues.permissions, formikProps.values.permissions) ||
                                    userHasNoPermissions(formikProps.values.permissions[workspace._id])
                                }
                                variant="contained"
                            >
                                {mode === 'create' && i18next.t('permissions.permissionsOfUserDialog.createBtn')}
                                {mode === 'edit' && i18next.t('permissions.permissionsOfUserDialog.saveBtn')}
                                {formikProps.isSubmitting && <CircularProgress size={20} />}
                            </Button>
                        )}
                    </Grid>
                </Grid> 
            </DialogActions>*/}
        </Dialog>
    );
};

export default PermissionsOfUserDialog;
