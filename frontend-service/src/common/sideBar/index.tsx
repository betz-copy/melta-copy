import React, { useRef, useState } from 'react';
import { Divider, IconButton, Grid, Box, Slide, Fade, Tooltip, tooltipClasses, Button } from '@mui/material';
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
    CalendarMonth as CalendarIcon,
} from '@mui/icons-material';

import i18next from 'i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
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
import { getMyNotificationGroupCountRequest } from '../../services/notificationService';
import { lightTheme } from '../../theme';
import { GlobalSearchBar } from '../EntitiesPage/Headline';

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

    const [activeButton, setActiveButton] = useState<string | null>(null);

    const handleChangeActiveButton = (isActive: boolean, key: string) => {
        if (isActive) setActiveButton(key);
    };
    const navigate = useNavigate();

    const { data: notificationCountDetailsResponse, refetch: updateNotificationCountDetails } = useQuery(
        ['getMyNotificationCount', isNotificationsScreenOpen],
        () => getMyNotificationGroupCountRequest(isNotificationsScreenOpen ? notifications.groups : {}),
        {
            refetchInterval: environment.notifications.updateInterval,
            refetchOnWindowFocus: true,
        },
    );
    const notificationCountDetails = notificationCountDetailsResponse || { total: 0, groups: {} };

    const { meltaPlus, darkMode } = useSelector((state: RootState) => state);
    const dispatch = useDispatch();

    const iconSize = {
        width: '24px',
        height: '24px',
    };

    return (
        <Drawer
            ref={drawerRef}
            variant="permanent"
            open={isDrawerOpen}
            PaperProps={{ sx: { backgroundColor: '#1E2775' } }}
            data-tour="side-bar"
            style={{ zIndex: '1' }}
            sx={{ zIndex: '1' }}
        >
            <Grid
                container
                direction="column"
                wrap="nowrap"
                height="100%"
                bgcolor={lightTheme.palette.primary.main}
                style={{ backgroundImage: 'url(/icons/sideNav-bg.png)', backgroundRepeat: 'no-repeat' }}
            >
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
                            height="30px"
                        />
                    </Box>

                    <Grid item container direction={isDrawerOpen ? 'row' : 'column'} wrap="nowrap" alignItems="center">
                        <ProfileButton
                            currentUser={myPermissions.user}
                            text={i18next.t('permissions.permissionsOfUserDialog.readTitle')}
                            isDrawerOpen={isDrawerOpen}
                            onClick={() => setIsMyPermissionsDialogOpen(!isMyPermissionsDialogOpen)}
                        />

                        {isDrawerOpen && (
                            <div>
                                <p style={{ color: 'white', fontWeight: 'bold', margin: 0 }}>{`${i18next.t('sideBar.hello')} ${
                                    myPermissions.user.firstName
                                }, `}</p>
                                <Button
                                    style={{ color: 'white', padding: 0 }}
                                    onClick={() => setIsMyPermissionsDialogOpen(!isMyPermissionsDialogOpen)}
                                >
                                    {i18next.t('permissions.permissionsOfUserDialog.readTitle')}
                                </Button>
                            </div>
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

                    <div
                        style={{
                            width: isDrawerOpen ? '90%' : '',
                            borderRadius: '15px',
                            display: 'flex',
                            alignContent: 'center',
                            alignItems: 'center',
                            marginTop: isDrawerOpen ? '30px' : '',
                        }}
                    >
                        {isDrawerOpen ? (
                            <GlobalSearchBar
                                onSearch={(searchValue) => {
                                    handleChangeActiveButton(true, 'search');
                                    navigate(`/?search=${searchValue}`, { replace: true });
                                }}
                                placeholder={i18next.t('globalSearch.searchLabel')}
                                size="small"
                                borderRadius="30px"
                            />
                        ) : (
                            <Button
                                style={{ ...iconSize }}
                                onClick={() => {
                                    toggleDrawer();
                                }}
                            >
                                <Tooltip
                                    placement="left"
                                    disableHoverListener={isDrawerOpen} // when drawer is opened text is already shown, so no need for tooltip
                                    PopperProps={{
                                        sx: { [`& .${tooltipClasses.tooltip}`]: { fontSize: '1rem', backgroundColor: '#101440' } },
                                    }}
                                    title={isDrawerOpen ? '' : i18next.t('pages.globalSearch')}
                                >
                                    <img src="/icons/search-icon.svg" style={{ alignSelf: 'center' }} />
                                </Tooltip>
                            </Button>
                        )}
                    </div>

                    {/* <SwitchThemeButton
                        text={i18next.t('sideBar.changeTheme')}
                        isDrawerOpen={isDrawerOpen}
                        darkMode={darkMode}
                        onClick={() => dispatch(toggleDarkMode())}
                    /> */}
                </Grid>

                <Divider />

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
                    }}
                >
                    {Array.from(
                        categories.values(),
                        (category) =>
                            Boolean(myPermissions.instancesPermissions.find((instance) => instance.category === category._id)) && (
                                <NavButton
                                    key={category._id}
                                    to={`/category/${category._id}`}
                                    text={category.displayName}
                                    isDrawerOpen={isDrawerOpen}
                                    disabled={Boolean(!myPermissions.instancesPermissions.find((instance) => instance.category === category._id))}
                                    onChangeToActive={(isActive: boolean) => handleChangeActiveButton(isActive, category._id)}
                                >
                                    {category.iconFileId ? (
                                        <CustomIcon
                                            iconUrl={category.iconFileId}
                                            height="24px"
                                            width="24px"
                                            color={activeButton === category._id ? '#545eb9' : '#FFFFFF'}
                                        />
                                    ) : (
                                        <HiveIcon fontSize="large" sx={{ color: activeButton === category._id ? '#545eb9' : 'white', ...iconSize }} />
                                    )}
                                </NavButton>
                            ),
                    )}
                </Grid>

                <Grid item container direction="column" alignItems="stretch" marginTop="auto">
                    <Divider style={{ backgroundColor: 'white', width: '85%', alignSelf: 'center' }} />

                    {meltaPlus && (
                        <Fade in={meltaPlus}>
                            <Box>
                                <NavButton
                                    to="/fluid-simulation"
                                    text={i18next.t('pages.fluidSimulation')}
                                    isDrawerOpen={isDrawerOpen}
                                    onChangeToActive={(isActive: boolean) => handleChangeActiveButton(isActive, 'fluid-simulation')}
                                >
                                    <FluidSimulationIcon fontSize="large" sx={{ color: activeButton === 'fluid-simulation' ? '#545eb9' : 'white' }} />
                                </NavButton>
                            </Box>
                        </Fade>
                    )}

                    <NavButton
                        to="/rule-management"
                        text={i18next.t('pages.ruleManagement')}
                        isDrawerOpen={isDrawerOpen}
                        onChangeToActive={(isActive: boolean) => handleChangeActiveButton(isActive, 'rule-management')}
                    >
                        <GavelIcon fontSize="large" sx={{ color: activeButton === 'rule-management' ? '#545eb9' : 'white', ...iconSize }} />
                    </NavButton>

                    <NavButton
                        to="/gantts"
                        text={i18next.t('pages.gantts')}
                        isDrawerOpen={isDrawerOpen}
                        onChangeToActive={(isActive: boolean) => handleChangeActiveButton(isActive, 'gantts')}
                    >
                        <CalendarIcon fontSize="large" sx={{ color: activeButton === 'gantts' ? '#545eb9' : 'white', ...iconSize }} />
                    </NavButton>

                    <NavButton
                        to="/processes"
                        text={i18next.t('pages.processInstances')}
                        isDrawerOpen={isDrawerOpen}
                        onChangeToActive={(isActive: boolean) => handleChangeActiveButton(isActive, 'processes')}
                    >
                        <CustomImage
                            imageUrl="/icons/flowchart-hierarchy.svg"
                            width="24px"
                            height="24px"
                            color={activeButton === 'processes' ? '#545eb9' : '#FFFFFF'}
                        />
                    </NavButton>

                    {(myPermissions.templatesManagementId || myPermissions.processesManagementId) && (
                        <NavButton
                            to="/system-management"
                            text={i18next.t('pages.systemManagement')}
                            isDrawerOpen={isDrawerOpen}
                            onChangeToActive={(isActive: boolean) => handleChangeActiveButton(isActive, 'system-management')}
                        >
                            <WidgetsIcon fontSize="large" sx={{ color: activeButton === 'system-management' ? '#545eb9' : 'white', ...iconSize }} />
                        </NavButton>
                    )}

                    {myPermissions.permissionsManagementId && (
                        <NavButton
                            to="/permissions-management"
                            text={i18next.t('permissions.permissionsManagmentPageTitle')}
                            isDrawerOpen={isDrawerOpen}
                            onChangeToActive={(isActive: boolean) => handleChangeActiveButton(isActive, 'permissions-management')}
                        >
                            <ManageAccountsIcon
                                fontSize="large"
                                sx={{ color: activeButton === 'permissions-management' ? '#545eb9' : 'white', ...iconSize }}
                            />
                        </NavButton>
                    )}

                    {/* <Grid item container justifyContent="space-around" alignItems="center" flexWrap="nowrap" height="4rem"> */}
                    <div style={{ display: 'flex' }}>
                        <Grid
                            item
                            container
                            alignItems="center"
                            justifyContent="center"
                            flexWrap="nowrap"
                            spacing={isDrawerOpen ? 5 : 1}
                            paddingBottom="25px"
                        >
                            <Grid item>
                                <img src="/icons/sapir.svg" height="30px" />
                            </Grid>
                            <Grid item>
                                <img src="/icons/yesodot.svg" height="30px" />
                            </Grid>
                        </Grid>
                        {isDrawerOpen ? (
                            <IconButton
                                onClick={toggleDrawer}
                                size="large"
                                style={{
                                    height: '50px',
                                    width: '30px',
                                    position: 'fixed',
                                    marginRight: '219px',
                                    marginTop: '-25px',
                                }}
                            >
                                <img src="/icons/close-menu.svg" />
                            </IconButton>
                        ) : (
                            <IconButton
                                onClick={toggleDrawer}
                                style={{
                                    height: '50px',
                                    width: '30px',
                                    position: 'fixed',
                                    marginRight: '73px',
                                    marginTop: '-25px',
                                }}
                            >
                                <img src="/icons/open-menu.svg" />
                            </IconButton>
                        )}
                    </div>
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
