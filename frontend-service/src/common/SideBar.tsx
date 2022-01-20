import React from 'react';

import { ChevronRight as ChevronRightIcon, Inbox as InboxIcon, Mail as MailIcon } from '@mui/icons-material';
import { ListItem, ListItemIcon, ListItemText, List, Divider, IconButton } from '@mui/material';
import { Drawer, StyledLink, Toolbar } from './SideBar.styled';

type SideBarProps = {
    toggleDrawer: () => any;
    isDrawerOpen: boolean;
};

const SideBar: React.FC<SideBarProps> = ({ toggleDrawer, isDrawerOpen }) => {
    return (
        <Drawer variant="permanent" open={isDrawerOpen}>
            <Toolbar>
                <IconButton onClick={toggleDrawer}>
                    <ChevronRightIcon />
                </IconButton>
            </Toolbar>
            <Divider />
            <List>
                <StyledLink to="/">
                    <ListItem button>
                        <ListItemIcon>
                            <InboxIcon />
                        </ListItemIcon>
                        <ListItemText primary="Home" />
                    </ListItem>
                </StyledLink>
                <StyledLink to="/info">
                    <ListItem button>
                        <ListItemIcon>
                            <InboxIcon />
                        </ListItemIcon>
                        <ListItemText primary="Info" />
                    </ListItem>
                </StyledLink>
                <StyledLink to="/page">
                    <ListItem button>
                        <ListItemIcon>
                            <InboxIcon />
                        </ListItemIcon>
                        <ListItemText primary="Page" />
                    </ListItem>
                </StyledLink>
            </List>
            <Divider />
            <List>
                {['All mail', 'Trash', 'Spam'].map((text, index) => (
                    <ListItem button key={text}>
                        <ListItemIcon>{index % 2 === 0 ? <InboxIcon /> : <MailIcon />}</ListItemIcon>
                        <ListItemText primary={text} />
                    </ListItem>
                ))}
            </List>
        </Drawer>
    );
};

export { SideBar };
