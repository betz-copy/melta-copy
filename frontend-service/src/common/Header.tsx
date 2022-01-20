import React, { useState } from 'react';
import i18next from 'i18next';
import { Toolbar, IconButton, Grid, PaletteMode, Typography, AppBarProps } from '@mui/material';
import {
    Menu as MenuIcon,
    Brightness3 as DarkModeIcon,
    Brightness5 as LightModeIcon,
    ContactSupport as ContactSupportIcon,
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { SupportDialog } from './SupportDialog';
import { Greeting } from './Greeting';
import { LocalStorage } from '../utils/localStorage';
import { AppBarComponent, MenuIconButton } from './Header.styled';
import { RootState } from '../store';
import { setPaletteMode } from '../store/userPreferences';

interface HeaderProps extends AppBarProps {
    toggleDrawer: () => void;
    isDrawerOpen: boolean;
}

const Header: React.FC<HeaderProps> = ({ isDrawerOpen, toggleDrawer }) => {
    const currentUser = useSelector((state: RootState) => state.user);
    const paletteMode = useSelector((state: RootState) => state.userPreferences.paletteMode);
    const dispatch = useDispatch();

    const [checked, setChecked] = useState(paletteMode === 'dark');
    const [isSupportOpen, setIsSupportOpen] = useState(false);

    const changeTheme = () => {
        setChecked((currChecked) => {
            const newPaletteMode: PaletteMode = currChecked ? 'light' : 'dark';
            LocalStorage.set('paletteMode', newPaletteMode);
            dispatch(setPaletteMode(newPaletteMode));

            return !currChecked;
        });
    };

    const handleCloseSupportDialog = () => {
        setIsSupportOpen(false);
    };

    const handleOpenSupportDialog = () => {
        setIsSupportOpen(true);
    };

    return (
        <AppBarComponent position="absolute" open={isDrawerOpen}>
            <Toolbar>
                <Grid container justifyContent="space-between" direction="row" alignItems="center">
                    <Grid item>
                        <Grid container direction="row" alignItems="center">
                            <MenuIconButton edge="start" color="inherit" aria-label="open drawer" onClick={toggleDrawer} open={isDrawerOpen}>
                                <MenuIcon />
                            </MenuIconButton>
                            <Typography variant="h6" noWrap>
                                {i18next.t('appBar.title')}
                            </Typography>
                        </Grid>
                    </Grid>
                    <Grid item>
                        <Grid container direction="row" alignItems="center">
                            <Grid item>
                                <IconButton color="inherit" onClick={handleOpenSupportDialog}>
                                    <ContactSupportIcon />
                                </IconButton>
                                <SupportDialog open={isSupportOpen} handleClose={handleCloseSupportDialog} />
                            </Grid>
                            <Grid item>
                                <Grid container direction="row" alignItems="center">
                                    <IconButton color="inherit" onClick={changeTheme}>
                                        {checked ? <LightModeIcon /> : <DarkModeIcon />}
                                    </IconButton>
                                </Grid>
                            </Grid>
                            <Grid item>
                                <Greeting name={currentUser.name!} />
                            </Grid>
                        </Grid>
                    </Grid>
                </Grid>
            </Toolbar>
        </AppBarComponent>
    );
};

export { Header };
