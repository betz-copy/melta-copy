import { Divider, Drawer as MuiDrawer, Toolbar as MuiToolbar, styled } from '@mui/material';
import { sideBarTransition } from '../../theme';

const drawerWidth = 240;

export const Drawer = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== 'open' })(({ theme, open }) => ({
    flexShrink: 0,
    width: drawerWidth,
    whiteSpace: 'nowrap',
    boxSizing: 'border-box',
    transition: sideBarTransition,
    '& .MuiDrawer-paper': {
        width: drawerWidth,
        overflowX: 'hidden',
        transition: sideBarTransition,
    },
    ...(!open && {
        ...{
            width: `calc(${theme.spacing(10)} + 1px)`,
        },
        '& .MuiDrawer-paper': {
            width: `calc(${theme.spacing(10)} + 1px)`,
            transition: sideBarTransition,
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
