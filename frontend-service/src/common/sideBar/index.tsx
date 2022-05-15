import React, { useState } from 'react';
import { Divider, IconButton, Typography, Grid } from '@mui/material';
import { useQueryClient } from 'react-query';
import {
    ChevronRight as ChevronRightIcon,
    ChevronLeft as ChevronLeftIcon,
    AccountCircle as AccountCircleIcon,
    Hive as HiveIcon,
    Public as PublicIcon,
    Widgets as WidgetsIcon,
    ManageAccounts as ManageAccountsIcon,
} from '@mui/icons-material';

import i18next from 'i18next';
import { Drawer } from './SideBar.styled';
import { IMongoCategory } from '../../interfaces/categories';
import { NavButton } from './NavButton';
import { IPermissionsOfUser } from '../../services/permissionsService';
import PermissionsOfUserDialog from '../permissionsOfUserDialog';
import { CustomIcon } from '../CustomIcon';

type SideBarProps = {
    toggleDrawer: () => any;
    isDrawerOpen: boolean;
};

const SideBar: React.FC<SideBarProps> = ({ toggleDrawer, isDrawerOpen }) => {
    const queryClient = useQueryClient();
    const categories = queryClient.getQueryData<IMongoCategory[]>('getCategories')!;
    const myPermissions = queryClient.getQueryData<IPermissionsOfUser>('getMyPermissions');

    const [isMyPermissionsDialogOpen, setIsMyPermissionsDialogOpen] = useState<boolean>(false);

    return (
        <Drawer variant="permanent" open={isDrawerOpen}>
            <Grid container direction="column" wrap="nowrap" height="100%" bgcolor="#225AA7">
                <Grid item container direction="column" alignItems="center" marginTop="10px" marginBottom="10px">
                    <Typography color="white" fontFamily="Rubik" fontSize={25} fontWeight="bold">
                        MELTA
                    </Typography>
                    <IconButton onClick={() => setIsMyPermissionsDialogOpen(true)}>
                        <AccountCircleIcon fontSize="large" sx={{ color: 'white' }} />
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
                    {categories?.map((category) => {
                        return (
                            <NavButton key={category._id} to={`/category/${category._id}`} text={category.displayName} isDrawerOpen={isDrawerOpen}>
                                {category?.iconFileId ? (
                                    <CustomIcon iconUrl={category.iconFileId} height="40px" width="40px" />
                                ) : (
                                    <HiveIcon fontSize="large" />
                                )}
                            </NavButton>
                        );
                    })}
                </Grid>

                <Grid item container direction="column" alignItems="stretch" marginTop="auto">
                    <Divider />

                    <NavButton to="/" text={i18next.t('pages.home')} isDrawerOpen={isDrawerOpen}>
                        <PublicIcon fontSize="large" />
                    </NavButton>

                    <NavButton to="/system-management" text={i18next.t('pages.systemManagement')} isDrawerOpen={isDrawerOpen}>
                        <WidgetsIcon fontSize="large" />
                    </NavButton>

                    {myPermissions?.permissionsManagementId && (
                        <NavButton
                            to="/permissions-management"
                            text={i18next.t('permissions.permissionsManagmentPageTitle')}
                            isDrawerOpen={isDrawerOpen}
                        >
                            <ManageAccountsIcon fontSize="large" />
                        </NavButton>
                    )}

                    <Divider />

                    <Grid item container direction="column" alignItems="center">
                        <IconButton onClick={toggleDrawer} size="large" sx={{ color: '#A9A9A9' }}>
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
        </Drawer>
    );
};

export { SideBar };
