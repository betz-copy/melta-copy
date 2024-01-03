import { styled, Drawer as MuiDrawer, Toolbar as MuiToolbar } from '@mui/material';

const drawerWidth = 240;

const Drawer = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== 'open' })(({ theme, open }) => ({
    flexShrink: 0,
    width: drawerWidth,
    whiteSpace: 'nowrap',
    boxSizing: 'border-box',
    transition: theme.transitions.create('width', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
    }),
    '& .MuiDrawer-paper': {
        width: drawerWidth,
        overflowX: 'hidden',
    },
    ...(!open && {
        ...{
            width: `calc(${theme.spacing(10)} + 1px)`,
        },
        '& .MuiDrawer-paper': {
            width: `calc(${theme.spacing(10)} + 1px)`,
        },
    }),
}));

const Toolbar = styled(MuiToolbar)({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
});

export { Drawer, Toolbar };
