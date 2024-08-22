import { Add, ArrowForward /* ManageAccounts */ } from '@mui/icons-material';
import { Box, Grid, Slide, SxProps, useTheme } from '@mui/material';
import i18next from 'i18next';
import React from 'react';
import { useLocation } from 'wouter';
import IconButtonWithPopover from '../../../common/IconButtonWithPopover';
import { MeltaIcon } from '../../../common/MeltaIcon';
import { ProfileButton } from '../../../common/sideBar/ProfileButton';
import { useDarkModeStore } from '../../../stores/darkMode';
import { useMeltaPlusStore } from '../../../stores/meltaPlus';
import { useUserStore } from '../../../stores/user';
import { Loading } from './Loading';
import { Navigation } from './Navigation';

interface ITopbarProps {
    loading: boolean;
    openWizard: () => void;
    openPermissionsDialog: () => void;
}

export const Topbar: React.FC<ITopbarProps> = ({ loading, openWizard /* openPermissionsDialog */ }) => {
    const currentUser = useUserStore((state) => state.user);

    const [location, setLocation] = useLocation();

    const darkMode = useDarkModeStore((state) => state.darkMode);
    const meltaPlus = useMeltaPlusStore((state) => state.meltaPlus);
    const toggleMeltaPlus = useMeltaPlusStore((state) => state.toggleMeltaPlus);

    const theme = useTheme();

    const iconStyle: SxProps = { fontSize: '2rem', color: 'white' };
    const iconButtonStyle: SxProps = { '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.2)' } };

    return (
        <Grid
            container
            px="0.5rem"
            py="0.5rem"
            flexWrap="nowrap"
            sx={{
                position: 'relative',
                backgroundColor: darkMode ? '#131313' : theme.palette.primary.main,
                boxShadow: '0px 2px 2px #333',
                zIndex: 10,
            }}
        >
            <Grid container item alignItems="center" flexWrap="nowrap" spacing={1} xs={3}>
                <Grid item>
                    <ProfileButton
                        currentUser={currentUser}
                        text={i18next.t('permissions.permissionsOfUserDialog.readTitle')}
                        isDrawerOpen
                        onClick={() => {}}
                    />
                </Grid>

                {/*
                <Grid item>
                    <IconButtonWithPopover
                        popoverText={i18next.t('permissions.permissionsManagmentPageTitle')}
                        iconButtonProps={{ onClick: openPermissionsDialog, sx: iconButtonStyle }}
                    >
                        <ManageAccounts sx={iconStyle} />
                    </IconButtonWithPopover>
                </Grid>
                */}

                <Grid item>
                    <IconButtonWithPopover
                        popoverText={i18next.t('workspaces.createNew')}
                        iconButtonProps={{
                            onClick: openWizard,
                            sx: iconButtonStyle,
                        }}
                        disabled={loading}
                    >
                        <Add sx={iconStyle} />
                    </IconButtonWithPopover>
                </Grid>
                <Grid item>{loading && <Loading />}</Grid>
            </Grid>

            <Grid container item alignItems="center" xs={9}>
                <Grid item>
                    <IconButtonWithPopover
                        popoverText={i18next.t('workspaces.goBack')}
                        iconButtonProps={{ onClick: () => setLocation(location.slice(0, location.lastIndexOf('/')) || '/'), sx: iconButtonStyle }}
                        disabled={location === '/'}
                    >
                        <ArrowForward sx={{ ...iconStyle, ...(location === '/' ? { color: 'gray', opacity: 0.5 } : {}) }} />
                    </IconButtonWithPopover>
                </Grid>

                <Grid item xs>
                    <Navigation />
                </Grid>
            </Grid>

            <Grid container item xs={3} justifyContent="flex-end">
                <Box
                    position="relative"
                    onClick={(event) => {
                        if (event.detail >= 3) toggleMeltaPlus();
                    }}
                >
                    <Slide in={meltaPlus} direction="down">
                        <Add
                            sx={{
                                position: 'absolute',
                                left: '-1%',
                                top: '-3%',
                                fontSize: 60,
                                color: 'white',
                                zIndex: 1,
                                stroke: '#000',
                                strokeWidth: '0.1px',
                            }}
                        />
                    </Slide>

                    <MeltaIcon width="300px" height="60px" expanded />
                </Box>
            </Grid>
        </Grid>
    );
};
