import React, { useRef, useState } from 'react';
import {
    Divider,
    IconButton,
    Grid,
    Box,
    Slide,
    Fade,
    Button,
    useTheme,
    Typography,
    Collapse,
    Dialog,
    DialogTitle,
    DialogContent,
    Menu,
    MenuItem,
    Paper,
    ListItemIcon,
    ListItemText,
} from '@mui/material';
import { useQuery, useQueryClient } from 'react-query';
import {
    Hive as HiveIcon,
    Widgets as WidgetsIcon,
    ManageAccounts as ManageAccountsIcon,
    Add as PlusIcon,
    Air as FluidSimulationIcon,
    Gavel as GavelIcon,
    CalendarMonth as CalendarIcon,
    Code as CodeIcon,
    ContentCut,
} from '@mui/icons-material';
import i18next from 'i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import MenuList from '@mui/material/MenuList';
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
import { GlobalSearchBar } from '../EntitiesPage/Headline';
import IconButtonWithPopover from '../IconButtonWithPopover';
import { sideBarTransition } from '../../theme';
import { searchIFrames } from '../../services/iFramesService';
import { mapTemplates } from '../../utils/templates';
import { IMongoIFrame } from '../../interfaces/iFrames';

type SideBarProps = {
    toggleDrawer: () => any;
    isDrawerOpen: boolean;
};

const IFramesInSideBar: React.FC<any> = ({ iFrames, activeButton, isDrawerOpen, handleChangeActiveButton }) => {
    const theme = useTheme();
    const [showIFrames, setShowIFrames] = useState<boolean>(false);

    const iconButtonRef = useRef(null);

    const handleMouseEnter = () => {
        setShowIFrames(true);
    };

    const handleMouseLeave = () => {
        setShowIFrames(false);
    };

    return (
        <Grid>
            <Grid
                style={{
                    direction: 'rtl',
                }}
            >
                <IconButton
                    ref={iconButtonRef}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                    sx={{
                        color: '#FFFFFF80',
                        fontFamily: 'Rubik',
                        fontSize: '17px',
                        maxWidth: isDrawerOpen ? 'auto' : '90px',
                    }}
                >
                    <NavButton
                        to="/iframes"
                        text={i18next.t('pages.iFrames')}
                        isDrawerOpen={isDrawerOpen}
                        onChangeToActive={(isActive: boolean) => handleChangeActiveButton(isActive, 'iFrames')}
                    >
                        <CodeIcon fontSize="large" sx={{ color: activeButton === 'iFrames' ? '#545eb9' : 'white', ...environment.iconSize }} />
                    </NavButton>
                </IconButton>
            </Grid>
            {iFrames?.length > 0 && (
                <Menu
                    anchorEl={iconButtonRef.current}
                    open={showIFrames}
                    onClose={handleMouseLeave}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                    anchorOrigin={{
                        vertical: 'top',
                        horizontal: 'left',
                    }}
                    transformOrigin={{
                        vertical: 'top',
                        horizontal: 'right',
                    }}
                >
                    {iFrames.map((iFrame) => (
                        <MenuItem key={iFrame._id}>
                            <NavButton
                                key={iFrame._id}
                                to={`/iframes/${iFrame._id}`}
                                text={iFrame.name}
                                isDrawerOpen={isDrawerOpen}
                                onChangeToActive={(isActive: boolean) => handleChangeActiveButton(isActive, iFrame._id)}
                            >
                                <ListItemIcon>
                                    {iFrame.iconFileId ? (
                                        <CustomIcon color={theme.palette.primary.main} iconUrl={iFrame.iconFileId} height="24px" width="24px" />
                                    ) : (
                                        <HiveIcon style={{ color: theme.palette.primary.main }} fontSize="medium" />
                                    )}
                                </ListItemIcon>
                                <ListItemText sx={{ color: theme.palette.primary.main }}>{iFrame.name}</ListItemText>
                            </NavButton>
                        </MenuItem>
                    ))}
                </Menu>
            )}
        </Grid>
    );
};
const { notifications } = environment;
const SideBar: React.FC<SideBarProps> = ({ toggleDrawer, isDrawerOpen }) => {
    const theme = useTheme();

    const drawerRef = useRef<React.ComponentRef<typeof Drawer>>(null);

    const queryClient = useQueryClient();

    const categories = queryClient.getQueryData<ICategoryMap>('getCategories')!;

    const { data: allIFrames } = useQuery(
        ['searchIFrames'],
        async () => {
            return searchIFrames({});
        },
        {
            // refetchInterval: environment.notifications.updateInterval,
            refetchOnWindowFocus: true,
        },
    );
    const iFrameValues: IMongoIFrame[] = allIFrames ? Array.from(allIFrames.values()) : [];

    const iFramesInSideBar = iFrameValues?.filter((iframe) => iframe.placeInSideBar);
    console.log({ iFrameValues }, { iFramesInSideBar });

    const myPermissions = queryClient.getQueryData<IPermissionsOfUser>('getMyPermissions')!;

    const [isMyPermissionsDialogOpen, setIsMyPermissionsDialogOpen] = useState<boolean>(false);
    const [isNotificationsScreenOpen, setIsNotificationsScreenOpen] = useState<boolean>(false);

    const [activeButton, setActiveButton] = useState<string | null>(null);

    const handleChangeActiveButton = (isActive: boolean, key: string) => {
        if (isActive) setActiveButton(key);
        else if (activeButton === key) setActiveButton('');
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

    const { meltaPlus } = useSelector((state: RootState) => state);
    const dispatch = useDispatch();

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
            <Grid
                container
                direction="column"
                wrap="nowrap"
                height="100%"
                bgcolor={theme.palette.primary.main}
                style={{
                    backgroundImage: 'url(/icons/sideNav-bg.png)',
                    backgroundRepeat: 'no-repeat',
                    backgroundPositionY: isDrawerOpen ? '-23px' : '2px',
                }}
            >
                <Grid item container direction="column" alignItems="center" marginTop="15px" marginBottom="5px">
                    <Box
                        position="relative"
                        onClick={(event) => {
                            if (event.detail >= 3) dispatch(toggleMeltaPlus());
                        }}
                    >
                        <Slide in={meltaPlus} direction="down">
                            <PlusIcon sx={{ position: 'absolute', left: '-15%', top: '10%', fontSize: 40, color: 'white' }} />
                        </Slide>

                        <Button
                            onClick={() => {
                                navigate('');
                            }}
                            style={{ width: '50px' }}
                        >
                            <img
                                src={isDrawerOpen ? '/icons/Melta_Logo.svg' : '/icons/Melta_Short_Logo.svg'}
                                style={{ margin: '0.6rem' }}
                                height="30px"
                            />
                        </Button>
                    </Box>

                    <Grid item container direction={isDrawerOpen ? 'row' : 'column'} wrap="nowrap" alignItems="center">
                        <ProfileButton
                            currentUser={myPermissions.user}
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
                                >{`${i18next.t('sideBar.hello')} ${myPermissions.user.firstName}, `}</Typography>
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
                                    navigate(`/?search=${searchValue}`, { replace: true });
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
                                        <HiveIcon
                                            fontSize="large"
                                            sx={{ color: activeButton === category._id ? '#545eb9' : 'white', ...environment.iconSize }}
                                        />
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

                    <IFramesInSideBar
                        iFrames={iFramesInSideBar}
                        activeButton={activeButton}
                        myPermissions={myPermissions}
                        isDrawerOpen={isDrawerOpen}
                        handleChangeActiveButton={handleChangeActiveButton}
                    />

                    <NavButton
                        to="/rule-management"
                        text={i18next.t('pages.ruleManagement')}
                        isDrawerOpen={isDrawerOpen}
                        onChangeToActive={(isActive: boolean) => handleChangeActiveButton(isActive, 'rule-management')}
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
                        onChangeToActive={(isActive: boolean) => handleChangeActiveButton(isActive, 'gantts')}
                    >
                        <CalendarIcon fontSize="large" sx={{ color: activeButton === 'gantts' ? '#545eb9' : 'white', ...environment.iconSize }} />
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
                            <WidgetsIcon
                                fontSize="large"
                                sx={{ color: activeButton === 'system-management' ? '#545eb9' : 'white', ...environment.iconSize }}
                            />
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
                                sx={{ color: activeButton === 'permissions-management' ? '#545eb9' : 'white', ...environment.iconSize }}
                            />
                        </NavButton>
                    )}

                    <Grid style={{ display: 'flex' }}>
                        <Grid
                            item
                            container
                            alignItems="center"
                            justifyContent={isDrawerOpen ? 'flex-start' : 'center'}
                            flexWrap="nowrap"
                            spacing={isDrawerOpen ? 5 : 1}
                            paddingLeft={isDrawerOpen ? '30px' : ''}
                            paddingTop="20px"
                            paddingBottom="25px"
                        >
                            <Grid item>
                                <img src="/icons/sapir.svg" height="21px" />
                            </Grid>
                            <Grid item>
                                <img src="/icons/yesodot.svg" height="21px" />
                            </Grid>
                        </Grid>
                        {isDrawerOpen ? (
                            <IconButton
                                onClick={toggleDrawer}
                                size="large"
                                sx={{
                                    transition: sideBarTransition,
                                }}
                                style={{
                                    height: '50px',
                                    width: '30px',
                                    position: 'fixed',
                                    marginRight: '219px',
                                    marginTop: '-25px',
                                    backgroundColor: 'transparent',
                                }}
                            >
                                <img src="/icons/close-menu.svg" />
                            </IconButton>
                        ) : (
                            <IconButton
                                onClick={toggleDrawer}
                                sx={{
                                    transition: sideBarTransition,
                                }}
                                style={{
                                    height: '50px',
                                    width: '30px',
                                    position: 'fixed',
                                    marginRight: '73px',
                                    marginTop: '-25px',
                                    backgroundColor: 'transparent',
                                }}
                            >
                                <img src="/icons/open-menu.svg" />
                            </IconButton>
                        )}
                    </Grid>
                </Grid>
            </Grid>

            <PermissionsOfUserDialog
                isOpen={isMyPermissionsDialogOpen}
                mode="view"
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
