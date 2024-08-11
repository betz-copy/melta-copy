import {
    Add as PlusIcon,
    Air as FluidSimulationIcon,
    CalendarMonth as CalendarIcon,
    Gavel as GavelIcon,
    Hive as HiveIcon,
    ManageAccounts as ManageAccountsIcon,
    MeetingRoom as ExitIcon,
    Widgets as WidgetsIcon,
} from '@mui/icons-material';
import { Box, Button, Grid, IconButton, Slide, Typography, useTheme } from '@mui/material';
import i18next from 'i18next';
import React, { useRef, useState } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { useLocation } from 'wouter';

import { environment } from '../../globals';
import { ICategoryMap } from '../../interfaces/categories';
import { INotificationCountGroups } from '../../interfaces/notifications';
import { PermissionScope } from '../../interfaces/permissions';
import { getMyNotificationGroupCountRequest } from '../../services/notificationService';
import { useMeltaPlusStore } from '../../stores/meltaPlus';
import { useUserStore } from '../../stores/user';
import { useWorkspaceStore } from '../../stores/workspace';
import { sideBarTransition } from '../../theme';
import { CustomIcon, CustomImage } from '../CustomIcon';
import { GlobalSearchBar } from '../EntitiesPage/Headline';
import IconButtonWithPopover from '../IconButtonWithPopover';
import { MeltaIcon } from '../MeltaIcon';
import PermissionsOfUserDialog from '../permissionsOfUserDialog';
import { NavButton } from './NavButton';
import { NotificationsButton } from './notifications/NotificationsButton';
import { NotificationsScreen } from './notifications/NotificationsScreen';
import { ProfileButton } from './ProfileButton';
import { Drawer, DrawerDivider } from './SideBar.styled';

interface SideBarProps {
    toggleDrawer: () => any;
    isDrawerOpen: boolean;
}

const { notifications } = environment;

const SideBar: React.FC<SideBarProps> = ({ toggleDrawer, isDrawerOpen }) => {
    const theme = useTheme();

    const currentUser = useUserStore((state) => state.user);

    const drawerRef = useRef<React.ComponentRef<typeof Drawer>>(null);

    const queryClient = useQueryClient();

    const categories = queryClient.getQueryData<ICategoryMap>('getCategories')!;

    const [isMyPermissionsDialogOpen, setIsMyPermissionsDialogOpen] = useState<boolean>(false);
    const [isNotificationsScreenOpen, setIsNotificationsScreenOpen] = useState<boolean>(false);

    const [activeButton, setActiveButton] = useState<string | null>(null);

    const handleChangeActiveButton = (isActive: boolean, key: string) => {
        if (isActive) setActiveButton(key);
        else if (activeButton === key) setActiveButton('');
    };

    const [_, navigate] = useLocation();

    const { data: notificationCountDetailsResponse, refetch: updateNotificationCountDetails } = useQuery(
        ['getMyNotificationCount', isNotificationsScreenOpen],
        () => getMyNotificationGroupCountRequest(isNotificationsScreenOpen ? (notifications.groups as unknown as INotificationCountGroups) : {}),
        {
            refetchInterval: environment.notifications.updateInterval,
            refetchOnWindowFocus: true,
        },
    );

    const notificationCountDetails = notificationCountDetailsResponse || { total: 0, groups: {} };

    const meltaPlus = useMeltaPlusStore((state) => state.meltaPlus);
    const toggleMeltaPlus = useMeltaPlusStore((state) => state.toggleMeltaPlus);

    const workspace = useWorkspaceStore((state) => state.workspace);

    console.log('homo', currentUser.currentWorkspacePermissions);

    return (
        <Drawer
            ref={drawerRef}
            variant="permanent"
            open={isDrawerOpen}
            PaperProps={{ sx: { backgroundColor: theme.palette.primary.main } }}
            data-tour="side-bar"
            style={{ zIndex: '1' }}
            sx={{ zIndex: '1' }}
        >
            <Grid container direction="column" wrap="nowrap" height="100%" bgcolor={theme.palette.primary.main}>
                <Grid
                    item
                    container
                    direction="column"
                    alignItems="center"
                    paddingTop="15px"
                    paddingBottom="20px"
                    sx={{ backgroundColor: '#101440', borderBottomLeftRadius: '100% 15%', borderBottomRightRadius: '100% 15%' }}
                >
                    <Box
                        position="relative"
                        onClick={(event) => {
                            if (event.detail >= 3) toggleMeltaPlus();
                        }}
                    >
                        <Slide in={meltaPlus} direction="down">
                            <PlusIcon
                                sx={{
                                    position: 'absolute',
                                    left: isDrawerOpen ? '-90%' : '-15%',
                                    top: '18%',
                                    fontSize: 40,
                                    color: 'white',
                                    zIndex: 1,
                                    stroke: '#000',
                                    strokeWidth: '0.1px',
                                }}
                            />
                        </Slide>

                        <Button
                            onClick={() => {
                                navigate('');
                                setActiveButton(null);
                            }}
                            style={{ width: '50px' }}
                        >
                            <MeltaIcon
                                iconUrl={isDrawerOpen ? workspace.logoFileId : workspace.iconFileId}
                                expanded={isDrawerOpen}
                                width={isDrawerOpen ? '150px' : '70px'}
                                style={{ margin: '0.6rem' }}
                            />
                        </Button>
                    </Box>

                    <Grid item container direction={isDrawerOpen ? 'row' : 'column'} wrap="nowrap" alignItems="center">
                        <ProfileButton
                            currentUser={currentUser}
                            text={i18next.t('permissions.permissionsOfUserDialog.readTitle')}
                            isDrawerOpen={isDrawerOpen}
                            onClick={() => setIsMyPermissionsDialogOpen(!isMyPermissionsDialogOpen)}
                        />

                        {isDrawerOpen && (
                            <Grid>
                                <Typography
                                    style={{
                                        color: 'white',
                                        fontWeight: '600',
                                        margin: 0,
                                        fontSize: environment.mainFontSizes.headlineSubTitleFontSize,
                                    }}
                                >{`${i18next.t('sideBar.hello')} ${currentUser.fullName.split(' ')[0]}, `}</Typography>
                                <Button
                                    style={{
                                        color: 'white',
                                        padding: 0,
                                        fontWeight: '400',
                                        fontSize: environment.mainFontSizes.headlineSubTitleFontSize,
                                        fontFamily: 'Rubik',
                                    }}
                                    onClick={() => setIsMyPermissionsDialogOpen(!isMyPermissionsDialogOpen)}
                                >
                                    {i18next.t('permissions.permissionsOfUserDialog.readTitle')}
                                </Button>
                            </Grid>
                        )}

                        <NotificationsButton
                            notificationCountDetails={notificationCountDetails}
                            text={i18next.t('notifications.title')}
                            isDrawerOpen={isDrawerOpen}
                            onClick={() => {
                                setIsNotificationsScreenOpen(!isNotificationsScreenOpen);
                            }}
                        />
                    </Grid>

                    <Grid
                        style={{
                            width: isDrawerOpen ? '199px' : '',
                            borderRadius: '15px',
                            display: 'flex',
                            alignContent: 'center',
                            alignItems: 'center',
                        }}
                    >
                        {isDrawerOpen ? (
                            <GlobalSearchBar
                                onSearch={(searchValue) => {
                                    handleChangeActiveButton(true, 'search');
                                    navigate(`?search=${searchValue}&viewMode=templates-tables-view`);
                                }}
                                placeholder={i18next.t('pages.globalSearch')}
                                size="small"
                                borderRadius="30px"
                                width="199px"
                            />
                        ) : (
                            <Grid onClick={() => toggleDrawer()}>
                                <IconButtonWithPopover
                                    popoverText={isDrawerOpen ? '' : i18next.t('pages.globalSearch')}
                                    disabledToolTip={isDrawerOpen}
                                    placement="left"
                                    style={{ ...environment.iconSize }}
                                >
                                    <img src="/icons/search-icon.svg" style={{ alignSelf: 'center', height: '25px' }} />
                                </IconButtonWithPopover>
                            </Grid>
                        )}
                    </Grid>

                    {/* 
                    // TODO - implement when dark mode will be supported
                    <SwitchThemeButton
                        text={i18next.t('sideBar.changeTheme')}
                        isDrawerOpen={isDrawerOpen}
                        darkMode={darkMode}
                        onClick={() => dispatch(toggleDarkMode())}
                    /> */}
                </Grid>

                <Grid
                    item
                    container
                    height="100%"
                    direction="column"
                    wrap="nowrap"
                    lineHeight="20px"
                    sx={{
                        overflowY: 'overlay',
                        direction: 'rtl',
                        '::-webkit-scrollbar': { width: 4 },
                        '::-webkit-scrollbar-track': { background: 'transparent' },
                        '::-webkit-scrollbar-thumb': { background: 'lightgray' },
                        marginTop: isDrawerOpen ? '25px' : '0px',
                    }}
                >
                    {Array.from(
                        categories.values(),
                        (category) =>
                            Boolean(currentUser.currentWorkspacePermissions.instances?.categories[category._id]) && (
                                <NavButton
                                    key={category._id}
                                    to={`/category/${category._id}`}
                                    text={category.displayName}
                                    isDrawerOpen={isDrawerOpen}
                                    onChangeToActive={(isActive) => handleChangeActiveButton(isActive, category._id)}
                                    isActiveButton={activeButton === category._id}
                                >
                                    {category.iconFileId ? (
                                        <CustomIcon
                                            iconUrl={category.iconFileId}
                                            height="24px"
                                            width="24px"
                                            color={activeButton === category._id ? '#545eb9' : '#FFFFFF'}
                                        />
                                    ) : (
                                        <HiveIcon
                                            fontSize="large"
                                            sx={{ color: activeButton === category._id ? '#545eb9' : 'white', ...environment.iconSize }}
                                        />
                                    )}
                                </NavButton>
                            ),
                    )}
                </Grid>

                <DrawerDivider />

                <Grid item container direction="column" paddingY="0.5rem">
                    {meltaPlus && (
                        <NavButton
                            to="/fluid-simulation"
                            text={i18next.t('pages.fluidSimulation')}
                            isDrawerOpen={isDrawerOpen}
                            onChangeToActive={(isActive) => handleChangeActiveButton(isActive, 'fluid-simulation')}
                            isActiveButton={activeButton === 'fluid-simulation'}
                        >
                            <FluidSimulationIcon
                                fontSize="large"
                                sx={{ color: activeButton === 'fluid-simulation' ? '#545eb9' : 'white', ...environment.iconSize }}
                            />
                        </NavButton>
                    )}

                    <NavButton
                        to="/rule-management"
                        text={i18next.t('pages.ruleManagement')}
                        isDrawerOpen={isDrawerOpen}
                        onChangeToActive={(isActive) => handleChangeActiveButton(isActive, 'rule-management')}
                        isActiveButton={activeButton === 'rule-management'}
                    >
                        <GavelIcon
                            fontSize="large"
                            sx={{ color: activeButton === 'rule-management' ? '#545eb9' : 'white', ...environment.iconSize }}
                        />
                    </NavButton>

                    <NavButton
                        to="/gantts"
                        text={i18next.t('pages.gantts')}
                        isDrawerOpen={isDrawerOpen}
                        onChangeToActive={(isActive) => handleChangeActiveButton(isActive, 'gantts')}
                        isActiveButton={activeButton === 'gantts'}
                    >
                        <CalendarIcon fontSize="large" sx={{ color: activeButton === 'gantts' ? '#545eb9' : 'white', ...environment.iconSize }} />
                    </NavButton>

                    <NavButton
                        to="/processes"
                        text={i18next.t('pages.processInstances')}
                        isDrawerOpen={isDrawerOpen}
                        onChangeToActive={(isActive) => handleChangeActiveButton(isActive, 'processes')}
                        isActiveButton={activeButton === 'processes'}
                    >
                        <CustomImage
                            imageUrl="/icons/flowchart-hierarchy.svg"
                            width="24px"
                            height="24px"
                            color={activeButton === 'processes' ? '#545eb9' : '#FFFFFF'}
                        />
                    </NavButton>

                    {(currentUser.currentWorkspacePermissions.templates?.scope === PermissionScope.write ||
                        currentUser.currentWorkspacePermissions.processes?.scope === PermissionScope.write) && (
                        <NavButton
                            to="/system-management"
                            text={i18next.t('pages.systemManagement')}
                            isDrawerOpen={isDrawerOpen}
                            onChangeToActive={(isActive) => handleChangeActiveButton(isActive, 'system-management')}
                            isActiveButton={activeButton === 'system-management'}
                        >
                            <WidgetsIcon
                                fontSize="large"
                                sx={{ color: activeButton === 'system-management' ? '#545eb9' : 'white', ...environment.iconSize }}
                            />
                        </NavButton>
                    )}

                    {currentUser.currentWorkspacePermissions.permissions?.scope === PermissionScope.write && (
                        <NavButton
                            to="/permissions-management"
                            text={i18next.t('permissions.permissionsManagmentPageTitle')}
                            isDrawerOpen={isDrawerOpen}
                            onChangeToActive={(isActive) => handleChangeActiveButton(isActive, 'permissions-management')}
                            isActiveButton={activeButton === 'permissions-management'}
                        >
                            <ManageAccountsIcon
                                fontSize="large"
                                sx={{ color: activeButton === 'permissions-management' ? '#545eb9' : 'white', ...environment.iconSize }}
                            />
                        </NavButton>
                    )}
                </Grid>

                <DrawerDivider />

                <NavButton to={`~${workspace?.path}`} text={i18next.t('workspaces.goBack')} isDrawerOpen={isDrawerOpen} onChangeToActive={() => {}}>
                    <ExitIcon fontSize="large" sx={{ color: 'white', ...environment.iconSize }} />
                </NavButton>

                <Grid item>
                    <IconButton
                        onClick={toggleDrawer}
                        style={{
                            height: '50px',
                            width: '30px',
                            position: 'fixed',
                            marginRight: isDrawerOpen ? '219px' : '73px',
                            marginTop: '-4.25rem',
                            backgroundColor: 'transparent',
                            transition: sideBarTransition,
                        }}
                    >
                        <img src={`/icons/${isDrawerOpen ? 'close-menu' : 'open-menu'}.svg`} />
                    </IconButton>
                </Grid>
            </Grid>

            {/* <PermissionsOfUserDialog
                isOpen={isMyPermissionsDialogOpen}
                mode="view"
                handleClose={() => setIsMyPermissionsDialogOpen(false)}
                existingPermissionsOfUser={currentUser}
            /> */}

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
