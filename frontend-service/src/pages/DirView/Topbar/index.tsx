import { Add, ArrowForward, Edit, EditOff } from '@mui/icons-material';
import { Grid, SxProps } from '@mui/material';
import i18next from 'i18next';
import React from 'react';
import { useLocation } from 'wouter';
import { Mode } from '..';
import IconButtonWithPopover from '../../../common/IconButtonWithPopover';
import { useDarkModeStore } from '../../../stores/darkMode';
import { Loading } from './Loading';
import { Navigation } from './Navigation';

interface ITopbarProps {
    loading: boolean;
    openWizard: () => void;
    mode: Mode;
    setMode: (mode: Mode) => void;
}

export const Topbar: React.FC<ITopbarProps> = ({ loading, openWizard, mode, setMode }) => {
    const [location, setLocation] = useLocation();

    const darkMode = useDarkModeStore((state) => state.darkMode);

    const iconStyle: SxProps = { fontSize: '2rem' };

    return (
        <Grid
            container
            direction="column"
            px="1rem"
            py="0.5rem"
            sx={{ backgroundColor: darkMode ? '#131313' : '#fcfeff', boxShadow: '0px 4px 4px #0000000D' }}
        >
            {/* <Grid container item justifyContent="flex-end">
                <Grid item>
                    <img src="/icons/Melta_Logo.svg" width="300px" />
                </Grid>
            </Grid> */}

            <Grid container item alignItems="center" flexWrap="nowrap">
                <Grid container item alignItems="center" flexWrap="nowrap" spacing={2} xs={3}>
                    <Grid item>
                        <IconButtonWithPopover
                            popoverText={i18next.t('workspaces.goBack')}
                            iconButtonProps={{ onClick: () => setLocation(location.slice(0, location.lastIndexOf('/')) || '/') }}
                            disabled={location === '/'}
                        >
                            <ArrowForward sx={iconStyle} />
                        </IconButtonWithPopover>
                    </Grid>

                    <Grid item>{loading && <Loading />}</Grid>
                </Grid>

                <Grid item xs={9}>
                    <Navigation />
                </Grid>

                <Grid container item justifyContent="flex-end" alignItems="center" flexWrap="nowrap" xs={3}>
                    <Grid item>
                        <IconButtonWithPopover
                            popoverText={i18next.t(mode === Mode.edit ? 'workspaces.cancelEdit' : 'workspaces.edit')}
                            iconButtonProps={{ onClick: () => setMode(mode === Mode.edit ? Mode.view : Mode.edit) }}
                        >
                            {mode === Mode.edit ? <EditOff sx={iconStyle} /> : <Edit sx={iconStyle} />}
                        </IconButtonWithPopover>
                    </Grid>

                    <Grid item>
                        <IconButtonWithPopover popoverText={i18next.t('workspaces.createNew')} iconButtonProps={{ onClick: openWizard }}>
                            <Add sx={iconStyle} />
                        </IconButtonWithPopover>
                    </Grid>
                </Grid>
            </Grid>
        </Grid>
    );
};
