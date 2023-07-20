import React, { useRef, useState } from 'react';
import { Divider, IconButton, Grid, Box, Slide, Fade } from '@mui/material';
import { useQuery, useQueryClient } from 'react-query';
import {
    ChevronRight as ChevronRightIcon,
    ChevronLeft as ChevronLeftIcon,
    Hive as HiveIcon,
    Public as PublicIcon,
    Widgets as WidgetsIcon,
    ManageAccounts as ManageAccountsIcon,
    Add as PlusIcon,
    Air as FluidSimulationIcon,
    Gavel as GavelIcon,
    CalendarMonth as CalendarIcon
} from '@mui/icons-material';

import i18next from 'i18next';
import { useDispatch, useSelector } from 'react-redux';
import { Drawer } from './SideBar.styled';
import { ICategoryMap } from '../../interfaces/categories';
import { NavButton } from './NavButton';
import { IPermissionsOfUser } from '../../services/permissionsService';
import PermissionsOfUserDialog from '../permissionsOfUserDialog';
import { CustomIcon, CustomImage } from '../CustomIcon';
import { RootState } from '../../store';
import { ProfileButton } from './ProfileButton';
import { toggleMeltaPlus } from '../../store/reducers/meltaPlus';
import { NotificationsButton } from './notifications/NotificationsButton';
import { environment } from '../../globals';
import { NotificationsScreen } from './notifications/NotificationsScreen';
import { toggleDarkMode } from '../../store/reducers/darkMode';
import { SwitchThemeButton } from './SwitchThemeButton';
import { getMyNotificationGroupCountRequest } from '../../services/notificationService';

type SideBarProps = {
    toggleDrawer: () => any;
    isDrawerOpen: boolean;
};

const { notifications } = environment;

const SideBar: React.FC<SideBarProps> = ({ toggleDrawer, isDrawerOpen }) => {
    const drawerRef = useRef<React.ComponentRef<typeof Drawer>>(null);

    const queryClient = useQueryClient();

    const categories = queryClient.getQueryData<ICategoryMap>('getCategories')!;
    const myPermissions = queryClient.getQueryData<IPermissionsOfUser>('getMyPermissions')!;

    const [isMyPermissionsDialogOpen, setIsMyPermissionsDialogOpen] = useState<boolean>(false);
    const [isNotificationsScreenOpen, setIsNotificationsScreenOpen] = useState<boolean>(false);

    const { data: notificationCountDetailsResponse, refetch: updateNotificationCountDetails } = useQuery(
        ['getMyNotificationCount', isNotificationsScreenOpen],
        () => getMyNotificationGroupCountRequest(isNotificationsScreenOpen ? notifications.groups : {}),
        {
            refetchInterval: environment.notifications.updateInterval,
            refetchOnWindowFocus: true,
        },
    );
    const notificationCountDetails = notificationCountDetailsResponse || { total: 0, groups: {} };

    const { user: currentUser, meltaPlus, darkMode } = useSelector((state: RootState) => state);
    const dispatch = useDispatch();

    return (
        <Drawer ref={drawerRef} variant="permanent" open={isDrawerOpen} PaperProps={{ sx: { backgroundColor: '#225AA7' } }} data-tour="side-bar">
            <Grid container direction="column" wrap="nowrap" height="100%" bgcolor="#225AA7">
                <Grid item container direction="column" alignItems="center" marginTop="15px" marginBottom="10px">
                    <Box
                        position="relative"
                        onClick={(event) => {
                            if (event.detail >= 3) dispatch(toggleMeltaPlus());
                        }}
                    >
                        <Slide in={meltaPlus} direction="down">
                            <PlusIcon sx={{ position: 'absolute', left: '-15%', top: '10%', fontSize: 40, color: 'white' }} />
                        </Slide>

                        <img
                            src={isDrawerOpen ? '/icons/Melta_Logo.svg' : '/icons/Melta_Short_Logo.svg'}
                            style={{ margin: '0.6rem' }}
                            height="32px"
                        />
                    </Box>

                    <ProfileButton
                        currentUser={currentUser}
                        text={i18next.t('permissions.permissionsOfUserDialog.readTitle')}
                        isDrawerOpen={isDrawerOpen}
                        onClick={() => setIsMyPermissionsDialogOpen(!isMyPermissionsDialogOpen)}
                    />

                    <NotificationsButton
                        notificationCountDetails={notificationCountDetails}
                        text={i18next.t('notifications.title')}
                        isDrawerOpen={isDrawerOpen}
                        onClick={() => {
                            setIsNotificationsScreenOpen(!isNotificationsScreenOpen);
                        }}
                    />

                    <SwitchThemeButton
                        text={i18next.t('sideBar.changeTheme')}
                        isDrawerOpen={isDrawerOpen}
                        darkMode={darkMode}
                        onClick={() => dispatch(toggleDarkMode())}
                    />
                </Grid>

                <Divider />

                <Grid
                    item
                    container
                    direction="column"
                    alignItems="stretch"
                    wrap="nowrap"
                    sx={{
                        overflowY: 'overlay',
                        direction: 'rtl',
                        '::-webkit-scrollbar': { width: 4 },
                        '::-webkit-scrollbar-track': { background: 'transparent' },
                        '::-webkit-scrollbar-thumb': { background: 'lightgray' },
                    }}
                >
                    {Array.from(categories.values(), (category) => (
                        <NavButton
                            key={category._id}
                            to={`/category/${category._id}`}
                            text={category.displayName}
                            isDrawerOpen={isDrawerOpen}
                            disabled={Boolean(!myPermissions.instancesPermissions.find((instance) => instance.category === category._id))}
                        >
                            {category.iconFileId ? (
                                <CustomIcon iconUrl={category.iconFileId} height="40px" width="40px" color="#FFFFFF" />
                            ) : (
                                <HiveIcon fontSize="large" sx={{ color: 'white' }} />
                            )}
                        </NavButton>
                    ))}
                </Grid>

                <Grid item container direction="column" alignItems="stretch" marginTop="auto">
                    <Divider />

                    {meltaPlus && (
                        <Fade in={meltaPlus}>
                            <Box>
                                <NavButton to="/fluid-simulation" text={i18next.t('pages.fluidSimulation')} isDrawerOpen={isDrawerOpen}>
                                    <FluidSimulationIcon fontSize="large" sx={{ color: 'white' }} />
                                </NavButton>
                            </Box>
                        </Fade>
                    )}

                    <NavButton to="/" text={i18next.t('pages.globalSearch')} isDrawerOpen={isDrawerOpen}>
                        <PublicIcon fontSize="large" sx={{ color: 'white' }} />
                    </NavButton>

                    <NavButton to="/rule-management" text={i18next.t('pages.ruleManagement')} isDrawerOpen={isDrawerOpen}>
                        <GavelIcon fontSize="large" sx={{ color: 'white' }} />
                    </NavButton>

                    <NavButton to="/gantts" text={i18next.t('pages.gantts')} isDrawerOpen={isDrawerOpen}>
                        <CalendarIcon fontSize="large" sx={{ color: 'white' }} />
                    </NavButton>

                    <NavButton to="/processes" text={i18next.t('pages.processInstances')} isDrawerOpen={isDrawerOpen}>
                        <CustomImage imageUrl="/icons/flowchart-hierarchy.svg" width="40px" height="40px" color="#FFFFFF" />
                    </NavButton>

                    {(myPermissions.templatesManagementId || myPermissions.processesManagementId) && (
                        <NavButton to="/system-management" text={i18next.t('pages.systemManagement')} isDrawerOpen={isDrawerOpen}>
                            <WidgetsIcon fontSize="large" sx={{ color: 'white' }} />
                        </NavButton>
                    )}

                    {myPermissions.permissionsManagementId && (
                        <NavButton
                            to="/permissions-management"
                            text={i18next.t('permissions.permissionsManagmentPageTitle')}
                            isDrawerOpen={isDrawerOpen}
                        >
                            <ManageAccountsIcon fontSize="large" sx={{ color: 'white' }} />
                        </NavButton>
                    )}

                    <Divider />

                    <Grid item container alignItems="center" justifyContent="space-around" flexWrap="nowrap" height="4rem">
                        {isDrawerOpen && (
                            <Grid item container alignItems="center" width="fit-content" spacing={1}>
                                <Grid item>
                                    <img src="/icons/sapir.svg" height="40px" />
                                </Grid>
                                <Grid item>
                                    <img src="/icons/yesodot.svg" height="35px" />
                                </Grid>
                            </Grid>
                        )}

                        <IconButton onClick={toggleDrawer} size="large" sx={{ color: 'white' }}>
                            {isDrawerOpen ? <ChevronRightIcon /> : <ChevronLeftIcon />}
                        </IconButton>
                    </Grid>
                </Grid>
            </Grid>

            <PermissionsOfUserDialog
                isOpen={isMyPermissionsDialogOpen}
                mode="read"
                handleClose={() => setIsMyPermissionsDialogOpen(false)}
                existingPermissionsOfUser={myPermissions}
            />

            <NotificationsScreen
                open={isNotificationsScreenOpen}
                setOpen={setIsNotificationsScreenOpen}
                sideBarWidth={`${drawerRef.current?.offsetWidth}px`}
                notificationCountDetails={notificationCountDetails}
                updateNotificationCountDetails={updateNotificationCountDetails}
            />
        </Drawer>
    );
};

export { SideBar };
