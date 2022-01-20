import { styled, Drawer as MuiDrawer, Toolbar as MuiToolbar } from '@mui/material';
import { Link } from 'react-router-dom';

const drawerWidth: number = 240;

const Drawer = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== 'open' })(({ theme, open }) => ({
    '& .MuiDrawer-paper': {
        position: 'relative',
        whiteSpace: 'nowrap',
        width: drawerWidth,
        transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
        }),
        boxSizing: 'border-box',
        ...(!open && {
            overflowX: 'hidden',
            transition: theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.leavingScreen,
            }),
            width: theme.spacing(7),
            [theme.breakpoints.up('sm')]: {
                width: theme.spacing(9),
            },
        }),
    },
}));

const StyledLink = styled(Link)({
    textDecoration: 'none',
    color: 'inherit',
});

const Toolbar = styled(MuiToolbar)({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
});

export { Drawer, StyledLink, Toolbar };
