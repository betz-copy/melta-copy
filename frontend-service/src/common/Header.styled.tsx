import { styled, AppBar, AppBarProps, IconButton } from '@mui/material';

const drawerWidth: number = 240;

const AppBarComponent = styled(AppBar, {
    shouldForwardProp: (prop) => prop !== 'open',
})<AppBarProps & { open: boolean }>(({ theme, open }) => ({
    zIndex: theme.zIndex.drawer + 1,
    transition: theme.transitions.create(['width', 'margin'], {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
    }),
    ...(open && {
        marginLeft: drawerWidth,
        width: `calc(100% - ${drawerWidth}px)`,
        transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
        }),
    }),
}));

const MenuIconButton = styled(
    IconButton,
    {},
)<{ open: boolean }>(({ open }) => ({
    marginRight: '36px',
    ...(open && {
        display: 'none',
    }),
}));

export { AppBarComponent, MenuIconButton };
