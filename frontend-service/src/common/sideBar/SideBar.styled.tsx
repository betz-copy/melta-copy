import { styled, Drawer as MuiDrawer, Toolbar as MuiToolbar, Divider } from '@mui/material';

const drawerWidth = 240;

export const Drawer = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== 'open' })(({ theme, open }) => ({
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
        transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
        }),
    },
    ...(!open && {
        ...{
            width: `calc(${theme.spacing(10)} + 1px)`,
        },
        '& .MuiDrawer-paper': {
            width: `calc(${theme.spacing(10)} + 1px)`,
            transition: theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.leavingScreen,
            }),
        },
    }),
}));

export const DrawerDivider = styled(Divider)({
    backgroundColor: 'white',
    width: '85%',
    alignSelf: 'center',
    opacity: 0.8,
});

export const Toolbar = styled(MuiToolbar)({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
});
