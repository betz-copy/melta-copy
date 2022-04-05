import React, { useState } from 'react';
import { List, Divider, IconButton, Typography, Grid } from '@mui/material';
import { useQueryClient } from 'react-query';
import {
    ChevronRight as ChevronRightIcon,
    ChevronLeft as ChevronLeftIcon,
    AccountCircle as AccountCircleIcon,
    Hive as HiveIcon,
    Search as SearchIcon,
    Public as PublicIcon,
    Engineering as EngineeringIcon,
} from '@mui/icons-material';

import i18next from 'i18next';
import { Drawer, Toolbar } from './SideBar.styled';
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
    const categories = queryClient.getQueryData<IMongoCategory[]>('getCategories');
    const myPermissions = queryClient.getQueryData<IPermissionsOfUser>('getMyPermissions');

    const [isMyPermissionsDialogOpen, setIsMyPermissionsDialogOpen] = useState<boolean>(false);

    return (
        <Drawer variant="permanent" open={isDrawerOpen}>
            <Grid container direction="column" height="100%" justifyContent="space-between">
                <Grid item>
                    <Grid item display="flex" flexDirection="column" alignItems="center" marginTop="10px" marginBottom="10px" width="100%">
                        <Typography color="#225AA7" fontSize={25} fontWeight="bold">
                            {i18next.t('sideBar.title')}
                        </Typography>
                        <IconButton onClick={() => setIsMyPermissionsDialogOpen(true)}>
                            <AccountCircleIcon sx={{ color: '#225AA7' }} />
                        </IconButton>
                    </Grid>
                    <Divider />
                    <Grid item>
                        <List>
                            {categories?.map((category) => {
                                return (
                                    <NavButton
                                        key={category._id}
                                        to={`/category/${category._id}`}
                                        text={category.displayName}
                                        isDrawerOpen={isDrawerOpen}
                                    >
                                        {category?.iconFileId ? (
                                            <CustomIcon iconUrl={category.iconFileId} height="40px" width="40px" />
                                        ) : (
                                            <HiveIcon fontSize="large" />
                                        )}
                                    </NavButton>
                                );
                            })}
                        </List>
                    </Grid>
                    <Divider />
                    <Grid item>
                        <List>
                            <NavButton to="/" text="Home" isDrawerOpen={isDrawerOpen}>
                                <PublicIcon fontSize="large" />
                            </NavButton>
                            <NavButton to="/system-management" text="System Management" isDrawerOpen={isDrawerOpen}>
                                <SearchIcon fontSize="large" />
                            </NavButton>
                            {myPermissions?.permissionsManagementId && (
                                <NavButton
                                    to="/permissions-management"
                                    text={i18next.t('permissions.permissionsManagmentPageTitle')}
                                    isDrawerOpen={isDrawerOpen}
                                >
                                    <EngineeringIcon fontSize="large" />
                                </NavButton>
                            )}
                        </List>
                    </Grid>
                    <Divider />
                </Grid>
                <Grid item>
                    <Divider />
                    <Toolbar>
                        <IconButton onClick={toggleDrawer}>{isDrawerOpen ? <ChevronRightIcon /> : <ChevronLeftIcon />}</IconButton>
                    </Toolbar>
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
