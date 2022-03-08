import React from 'react';
import { List, Divider, IconButton, Typography, Grid } from '@mui/material';
import { useQueryClient } from 'react-query';
import {
    ChevronRight as ChevronRightIcon,
    ChevronLeft as ChevronLeftIcon,
    AccountCircle as AccountCircleIcon,
    Inbox as InboxIcon,
    Search as SearchIcon,
    Public as PublicIcon,
} from '@mui/icons-material';

import { Drawer, Toolbar } from './SideBar.styled';
import { IMongoCategory } from '../../interfaces/categories';
import { NavButton } from './NavButton';

type SideBarProps = {
    toggleDrawer: () => any;
    isDrawerOpen: boolean;
};

const SideBar: React.FC<SideBarProps> = ({ toggleDrawer, isDrawerOpen }) => {
    const queryClient = useQueryClient();
    const categories = queryClient.getQueryData<IMongoCategory[]>('getCategories');

    return (
        <Drawer variant="permanent" open={isDrawerOpen}>
            <Grid container direction="column" height="100%" justifyContent="space-between">
                <Grid item>
                    <Grid item display="flex" flexDirection="column" alignItems="center" marginTop="10px" marginBottom="10px" width="100%">
                        <Typography color="#225AA7" fontSize={25} fontWeight="bold">
                            מלתעות
                        </Typography>
                        <AccountCircleIcon sx={{ color: '#225AA7' }} />
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
                                        <InboxIcon fontSize="large" />
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
        </Drawer>
    );
};

export { SideBar };
