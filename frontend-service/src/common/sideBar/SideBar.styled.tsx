import { styled, Drawer as MuiDrawer, Toolbar as MuiToolbar } from '@mui/material';
import { sideBarTransition } from '../../theme';

const drawerWidth = 240;

const Drawer = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== 'open' })(({ theme, open }) => ({
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

const Toolbar = styled(MuiToolbar)({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
});

export { Drawer, Toolbar };
