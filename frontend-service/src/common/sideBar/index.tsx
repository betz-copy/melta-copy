import { useMatomo } from '@datapunt/matomo-tracker-react';
import {
    CalendarMonth as CalendarIcon,
    MeetingRoom as ExitIcon,
    Air as FluidSimulationIcon,
    Gavel as GavelIcon,
    Hive as HiveIcon,
    ManageAccounts as ManageAccountsIcon,
    Map,
    Add as PlusIcon,
    StarBorderPurple500,
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
import { RelatedPermission } from '../../interfaces/users';
import { searchIFrames } from '../../services/iFramesService';
import { getMyNotificationGroupCountRequest, getMyNotificationsRequest, manyNotificationSeenRequest } from '../../services/notificationService';
import { useDarkModeStore } from '../../stores/darkMode';
import { useMeltaPlusStore } from '../../stores/meltaPlus';
import { useUserStore } from '../../stores/user';
import { useWorkspaceStore } from '../../stores/workspace';
import { sideBarTransition } from '../../theme';
import { CustomIcon, CustomImage } from '../CustomIcon';
import { GlobalSearchBar } from '../EntitiesPage/Headline';
import IconButtonWithPopover from '../IconButtonWithPopover';
import { MeltaIcon } from '../MeltaIcon';
import PermissionsDialog from '../PermissionsDialog';
import { NavButton } from './NavButton';
import { NotificationsButton } from './notifications/NotificationsButton';
import { NotificationsScreen } from './notifications/NotificationsScreen';
import { ProfileButton } from './ProfileButton';
import { Drawer, DrawerDivider } from './SideBar.styled';
import { CloseDrawerButton, OpenDrawerButton } from './ToggleDrawerButtons';

interface SideBarProps {
    toggleDrawer: () => any;
    isDrawerOpen: boolean;
}

const {
    notifications,
    searchPath,
    dashboard: { dashboardPath },
} = environment;

const SideBar: React.FC<SideBarProps> = ({ toggleDrawer, isDrawerOpen }) => {
    const theme = useTheme();

    const currentUser = useUserStore((state) => state.user);
    const darkMode = useDarkModeStore((state) => state.darkMode);

    const drawerRef = useRef<React.ComponentRef<typeof Drawer>>(null);

    const queryClient = useQueryClient();

    const categories = queryClient.getQueryData<ICategoryMap>('getCategories')!;

    const iFramesStored = localStorage.getItem('iFramesOrder');
    const { data } = useQuery('allIFrames', () => searchIFrames(iFramesStored ? { ids: JSON.parse(iFramesStored) } : {}));

    const iFramesInSidebar = data?.filter((iFrame) => iFrame.placeInSideBar);

    const [isMyPermissionsDialogOpen, setIsMyPermissionsDialogOpen] = useState<boolean>(false);
    const [isNotificationsScreenOpen, setIsNotificationsScreenOpen] = useState<boolean>(false);

    const [activeButton, setActiveButton] = useState<string | null>(null);

    const handleChangeActiveButton = (isActive: boolean, key: string) => {
        if (isActive) setActiveButton(key);
        else if (activeButton === key) setActiveButton('');
    };

    const [_, navigate] = useLocation();

    const handleMenuItemClick = (event, id: string) => {
        event.stopPropagation();
        event.preventDefault();
        navigate(`/iframes/${id}`);
    };
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

    const { trackEvent, trackPageView } = useMatomo();
    const workspace = useWorkspaceStore((state) => state.workspace);
    const { iconSize, isDashboardHomePage } = workspace.metadata;
    return (
        <Drawer ref={drawerRef} variant="permanent" open={isDrawerOpen} data-tour="side-bar" style={{ zIndex: '1' }} sx={{ zIndex: '1' }}>
            <Grid container direction="column" wrap="nowrap" height="100%" sx={{ bgcolor: darkMode ? '#000' : theme.palette.primary.main }}>
                <Grid
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
                                navigate(isDashboardHomePage ? dashboardPath : searchPath);
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

                    <Grid container direction={isDrawerOpen ? 'row' : 'column'} wrap="nowrap" alignItems="center">
                        <ProfileButton
                            currentUser={currentUser}
                            text={i18next.t('personalDetails')}
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
                                        fontSize: workspace.metadata.mainFontSizes.headlineSubTitleFontSize,
                                    }}
                                >{`${i18next.t('sideBar.hello')} ${currentUser.fullName.split(' ')[0]}, `}</Typography>
                                <Button
                                    style={{
                                        color: 'white',
                                        padding: 0,
                                        fontWeight: '400',
                                        fontSize: workspace.metadata.mainFontSizes.headlineSubTitleFontSize,
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
                                    navigate(`${searchPath}?search=${searchValue}&viewMode=templates-tables-view`);
                                }}
                                placeholder={i18next.t('pages.globalSearch')}
                                size="small"
                                borderRadius="30px"
                                width="199px"
                                autoSearch
                                showAiButton
                            />
                        ) : (
                            <Grid
                                onClick={() => {
                                    toggleDrawer();

                                    trackEvent({
                                        category: 'side-bar',
                                        action: 'search icon click',
                                    });
                                }}
                            >
                                <IconButtonWithPopover
                                    popoverText={isDrawerOpen ? '' : i18next.t('pages.globalSearch')}
                                    disabledToolTip={isDrawerOpen}
                                    placement="left"
                                    style={{ ...iconSize }}
                                >
                                    <img src="/icons/search-icon.svg" style={{ alignSelf: 'center', height: '25px' }} />
                                </IconButtonWithPopover>
                            </Grid>
                        )}
                    </Grid>
                </Grid>
                <Grid
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
                        marginTop: isDrawerOpen ? '0.5rem' : '0.25rem',
                    }}
                >
                    {Array.from(categories.values()).map(
                        (category) =>
                            Boolean(
                                currentUser.currentWorkspacePermissions.admin ||
                                    currentUser.currentWorkspacePermissions.instances?.categories[category._id],
                            ) && (
                                <NavButton
                                    key={category._id}
                                    to={`/category/${category._id}`}
                                    text={category.displayName}
                                    isDrawerOpen={isDrawerOpen}
                                    onChangeToActive={(isActive) => {
                                        handleChangeActiveButton(isActive, category._id);

                                        if (isActive) {
                                            trackPageView({
                                                documentTitle: `Category page - ${category.displayName}`,
                                                href: window.location.href,
                                            });
                                        }
                                    }}
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
                                            sx={{
                                                color: activeButton === category._id ? '#545eb9' : 'white',
                                                ...iconSize,
                                            }}
                                        />
                                    )}
                                </NavButton>
                            ),
                    )}
                </Grid>
                <DrawerDivider />
                <Grid container direction="column" paddingY="0.5rem">
                    {meltaPlus && (
                        <NavButton
                            to="/fluid-simulation"
                            text={i18next.t('pages.fluidSimulation')}
                            isDrawerOpen={isDrawerOpen}
                            onChangeToActive={(isActive) => {
                                handleChangeActiveButton(isActive, 'fluid-simulation');

                                if (isActive) {
                                    trackEvent({
                                        category: 'side-bar',
                                        action: 'MELTA PLUS',
                                    });
                                }
                            }}
                            isActiveButton={activeButton === 'fluid-simulation'}
                        >
                            <FluidSimulationIcon
                                fontSize="large"
                                sx={{ color: activeButton === 'fluid-simulation' ? '#545eb9' : 'white', ...iconSize }}
                            />
                        </NavButton>
                    )}

                    <NavButton
                        to="/iframes"
                        text={i18next.t('pages.iFrames')}
                        extension={
                            iFramesInSidebar?.length! > 0 ? (
                                <Grid container display="flex" flexDirection="column">
                                    <Grid width="150px" maxHeight="450px" sx={{ overflow: 'auto' }}>
                                        {iFramesInSidebar?.map((iFrame) => (
                                            <Grid
                                                key={iFrame._id}
                                                onClick={(event) => {
                                                    handleMenuItemClick(event, iFrame._id);
                                                }}
                                                sx={{
                                                    '&:hover': {
                                                        backgroundColor: '#B8B8B8',
                                                        borderRadius: '5px',
                                                    },
                                                    padding: '9px 9px 9px 18px',
                                                    display: 'flex',
                                                    flexDirection: 'row',
                                                }}
                                            >
                                                {iFrame.iconFileId ? (
                                                    <CustomIcon color="white" iconUrl={iFrame.iconFileId!} height="15px" width="15px" />
                                                ) : (
                                                    <HiveIcon style={{ color: 'white' }} fontSize="inherit" />
                                                )}
                                                <Typography
                                                    style={{
                                                        fontFamily: 'Rubik',
                                                        fontSize: '14px',
                                                        fontWeight: '400',
                                                        lineHeight: '17px',
                                                        letterSpacing: '0em',
                                                        textAlign: 'right',
                                                        width: '125px',
                                                        height: '17px',
                                                        marginRight: '10px',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap',
                                                        overflow: 'hidden',
                                                    }}
                                                >
                                                    {iFrame.name}
                                                </Typography>
                                            </Grid>
                                        ))}
                                    </Grid>
                                </Grid>
                            ) : (
                                i18next.t('pages.iFrames')
                            )
                        }
                        isDrawerOpen={isDrawerOpen}
                        onChangeToActive={(isActive) => {
                            handleChangeActiveButton(isActive, 'iFrames');
                            if (isActive) {
                                trackPageView({
                                    documentTitle: 'iFrames page',
                                    href: window.location.href,
                                });
                            }
                        }}
                        isActiveButton={activeButton === 'iFrames'}
                    >
                        <StarBorderPurple500 fontSize="large" sx={{ color: activeButton === 'iFrames' ? '#545eb9' : 'white', ...iconSize }} />
                    </NavButton>

                    <NavButton
                        to="/map"
                        text={i18next.t('pages.map')}
                        isDrawerOpen={isDrawerOpen}
                        onChangeToActive={(isActive) => handleChangeActiveButton(isActive, 'map')}
                        isActiveButton={activeButton === 'map'}
                    >
                        <Map fontSize="large" sx={{ color: activeButton === 'map' ? '#545eb9' : 'white', ...iconSize }} />
                    </NavButton>

                    <NavButton
                        to="/rule-management"
                        text={i18next.t('pages.ruleManagement')}
                        isDrawerOpen={isDrawerOpen}
                        onChangeToActive={(isActive) => {
                            handleChangeActiveButton(isActive, 'rule-management');
                            if (isActive) {
                                trackPageView({
                                    documentTitle: 'Rule Management page',
                                    href: window.location.href,
                                });
                            }
                        }}
                        isActiveButton={activeButton === 'rule-management'}
                    >
                        <GavelIcon fontSize="large" sx={{ color: activeButton === 'rule-management' ? '#545eb9' : 'white', ...iconSize }} />
                    </NavButton>

                    <NavButton
                        to="/gantts"
                        text={i18next.t('pages.gantts')}
                        isDrawerOpen={isDrawerOpen}
                        onChangeToActive={(isActive) => {
                            handleChangeActiveButton(isActive, 'gantts');
                            if (isActive) {
                                trackPageView({
                                    documentTitle: 'Gantts page',
                                    href: window.location.href,
                                });
                            }
                        }}
                        isActiveButton={activeButton === 'gantts'}
                    >
                        <CalendarIcon fontSize="large" sx={{ color: activeButton === 'gantts' ? '#545eb9' : 'white', ...iconSize }} />
                    </NavButton>

                    <NavButton
                        to="/processes"
                        text={i18next.t('pages.processInstances')}
                        isDrawerOpen={isDrawerOpen}
                        onChangeToActive={(isActive) => {
                            handleChangeActiveButton(isActive, 'processes');
                            if (isActive) {
                                trackPageView({
                                    documentTitle: 'Processes page',
                                    href: window.location.href,
                                });
                            }
                        }}
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
                        currentUser.currentWorkspacePermissions.processes?.scope === PermissionScope.write ||
                        currentUser.currentWorkspacePermissions.admin?.scope === PermissionScope.write) && (
                        <NavButton
                            to="/system-management"
                            text={i18next.t('pages.systemManagement')}
                            isDrawerOpen={isDrawerOpen}
                            onChangeToActive={(isActive) => handleChangeActiveButton(isActive, 'system-management')}
                            isActiveButton={activeButton === 'system-management'}
                        >
                            <WidgetsIcon fontSize="large" sx={{ color: activeButton === 'system-management' ? '#545eb9' : 'white', ...iconSize }} />
                        </NavButton>
                    )}

                    {(currentUser.currentWorkspacePermissions.permissions?.scope === PermissionScope.write ||
                        currentUser.currentWorkspacePermissions.admin?.scope === PermissionScope.write) && (
                        <NavButton
                            to="/permissions-management"
                            text={i18next.t('permissions.permissionsManagementPageTitle')}
                            isDrawerOpen={isDrawerOpen}
                            onChangeToActive={(isActive) => {
                                handleChangeActiveButton(isActive, 'permissions-management');
                                if (isActive) {
                                    trackPageView({
                                        documentTitle: 'PermissionsManagement page',
                                        href: window.location.href,
                                    });
                                }
                            }}
                            isActiveButton={activeButton === 'permissions-management'}
                        >
                            <ManageAccountsIcon
                                fontSize="large"
                                sx={{
                                    color: activeButton === 'permissions-management' ? '#545eb9' : 'white',
                                    ...iconSize,
                                }}
                            />
                        </NavButton>
                    )}
                </Grid>
                {Object.keys(currentUser.permissions).length > 1 && (
                    <>
                        <DrawerDivider />

                        <Grid container paddingY="0.5rem" justifyContent="center">
                            <NavButton
                                to={`~${workspace?.path}`}
                                text={i18next.t('workspaces.goBack')}
                                isDrawerOpen={isDrawerOpen}
                                onChangeToActive={() => {}}
                                onClick={() => queryClient.removeQueries('getAllTemplates')}
                            >
                                <ExitIcon fontSize="large" sx={{ color: 'white', ...iconSize }} />
                            </NavButton>
                        </Grid>
                    </>
                )}
                <Grid>
                    <IconButton
                        onClick={() => {
                            if (!isDrawerOpen) {
                                trackEvent({
                                    category: 'side-bar',
                                    action: 'open',
                                });
                            }
                            toggleDrawer();
                        }}
                        style={{
                            height: '50px',
                            width: '27px',
                            position: 'fixed',
                            marginRight: isDrawerOpen ? '219px' : '73px',
                            marginTop: '-4.25rem',
                            backgroundColor: 'transparent',
                            transition: sideBarTransition,
                        }}
                    >
                        {isDrawerOpen ? <CloseDrawerButton /> : <OpenDrawerButton />}
                    </IconButton>
                </Grid>
            </Grid>

            <PermissionsDialog
                permissionType={RelatedPermission.User}
                isOpen={isMyPermissionsDialogOpen}
                mode="view"
                handleClose={() => setIsMyPermissionsDialogOpen(false)}
                roleOrUser={currentUser}
            />

            <NotificationsScreen
                open={isNotificationsScreenOpen}
                setOpen={setIsNotificationsScreenOpen}
                sideBarWidth={`${drawerRef.current?.offsetWidth}px`}
                notificationCountDetails={notificationCountDetails}
                updateNotificationCountDetails={updateNotificationCountDetails}
                side="right"
                manyNotificationSeenRequest={manyNotificationSeenRequest}
                getMyNotificationsRequest={getMyNotificationsRequest}
            />
        </Drawer>
    );
};

export { SideBar };
