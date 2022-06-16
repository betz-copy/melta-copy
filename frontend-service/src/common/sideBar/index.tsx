import React, { useState } from 'react';
import { Divider, IconButton, Typography, Grid, Avatar } from '@mui/material';
import { useQueryClient } from 'react-query';
import {
    ChevronRight as ChevronRightIcon,
    ChevronLeft as ChevronLeftIcon,
    Hive as HiveIcon,
    Public as PublicIcon,
    Widgets as WidgetsIcon,
    ManageAccounts as ManageAccountsIcon,
} from '@mui/icons-material';

import i18next from 'i18next';
import { useSelector } from 'react-redux';
import { Drawer } from './SideBar.styled';
import { IMongoCategory } from '../../interfaces/categories';
import { NavButton } from './NavButton';
import { IPermissionsOfUser } from '../../services/permissionsService';
import PermissionsOfUserDialog from '../permissionsOfUserDialog';
import { CustomIcon } from '../CustomIcon';
import { RootState } from '../../store';

type SideBarProps = {
    toggleDrawer: () => any;
    isDrawerOpen: boolean;
};

const SideBar: React.FC<SideBarProps> = ({ toggleDrawer, isDrawerOpen }) => {
    const queryClient = useQueryClient();
    const categories = queryClient.getQueryData<IMongoCategory[]>('getCategories')!;
    const myPermissions = queryClient.getQueryData<IPermissionsOfUser>('getMyPermissions')!;
    const currentUser = useSelector((state: RootState) => state.user);

    const [isMyPermissionsDialogOpen, setIsMyPermissionsDialogOpen] = useState<boolean>(false);

    return (
        <Drawer variant="permanent" open={isDrawerOpen}>
            <Grid container direction="column" wrap="nowrap" height="100%" bgcolor="#225AA7">
                <Grid item container direction="column" alignItems="center" marginTop="10px" marginBottom="10px">
                    <Typography color="white" fontFamily="Rubik" fontSize={25} fontWeight="bold">
                        MELTA
                    </Typography>
                    <IconButton onClick={() => setIsMyPermissionsDialogOpen(true)}>
                        <Avatar
                            sx={{
                                width: 48,
                                height: 48,
                                font: '28px Rubik',
                                fontSize: 25,
                                backgroundColor: '#fcfeff',
                                fontWeight: 500,
                                color: 'rgb(25, 118, 210)',
                                '&:hover': { backgroundColor: '#dfe4e7' },
                            }}
                        >
                            {currentUser.name?.firstName.charAt(0)}
                            {currentUser.name?.lastName.charAt(0)}
                        </Avatar>
                    </IconButton>
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
                        '::-webkit-scrollbar': { background: 'transparent', width: 4 },
                        '::-webkit-scrollbar-thumb': { background: 'lightgray', borderRadius: 20 },
                    }}
                >
                    {categories.map((category) => {
                        return (
                            <NavButton
                                key={category._id}
                                to={`/category/${category._id}`}
                                text={category.displayName}
                                isDrawerOpen={isDrawerOpen}
                                disabled={Boolean(!myPermissions.instancesPermissions.find((instance) => instance.category === category._id))}
                            >
                                {category.iconFileId ? (
                                    <CustomIcon iconUrl={category.iconFileId} height="40px" width="40px" />
                                ) : (
                                    <HiveIcon fontSize="large" sx={{ color: 'white' }} />
                                )}
                            </NavButton>
                        );
                    })}
                </Grid>

                <Grid item container direction="column" alignItems="stretch" marginTop="auto">
                    <Divider />

                    <NavButton to="/" text={i18next.t('pages.globalSearch')} isDrawerOpen={isDrawerOpen}>
                        <PublicIcon fontSize="large" sx={{ color: 'white' }} />
                    </NavButton>

                    {myPermissions.templatesManagementId && (
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

                    <IconButton onClick={toggleDrawer} size="large" sx={{ color: 'white', borderRadius: 0, padding: '20px' }} disableRipple>
                        {isDrawerOpen ? <ChevronRightIcon /> : <ChevronLeftIcon />}
                    </IconButton>
                </Grid>
            </Grid>

            <PermissionsOfUserDialog
                isOpen={isMyPermissionsDialogOpen}
                mode="read"
                handleClose={() => setIsMyPermissionsDialogOpen(false)}
                existingPermissionsOfUser={myPermissions}
            />
        </Drawer>
    );
};

export { SideBar };
