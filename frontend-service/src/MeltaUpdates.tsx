import { CheckCircleOutline, InfoOutlined } from '@mui/icons-material';
import { Box, Button, Dialog, DialogActions, DialogContent, Grid, Typography, useTheme } from '@mui/material';
import i18next from 'i18next';
import React from 'react';
import Confetti from 'react-confetti';
import ReactDOM from 'react-dom';
import { MeltaTooltip } from './common/MeltaTooltip';
import { useDarkModeStore } from './stores/darkMode';

interface MeltaUpdatesProps {
    open: boolean;
    handleClose: () => void;
    meltaUpdates: Record<string, string>;
    titleDescription?: string;
}

const MeltaUpdates: React.FC<MeltaUpdatesProps> = ({ open, handleClose, meltaUpdates, titleDescription }) => {
    const darkMode = useDarkModeStore((state) => state.darkMode);
    const theme = useTheme();

    const circleDesign = {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: '50%',
    };

    return (
        <>
            {open && <Confetti />}

            {open &&
                ReactDOM.createPortal(
                    <Box
                        component="img"
                        src="/icons/melta-updates.svg"
                        sx={{
                            position: 'fixed',
                            top: 'calc(50% - 210px)',
                            right: 'calc(50% + 86px)',
                            width: 170,
                            zIndex: 2000,
                            pointerEvents: 'none',
                        }}
                    />,
                    document.body,
                )}

            <Dialog open={open} onClose={handleClose}>
                <DialogContent
                    sx={{
                        minWidth: '480px',
                        display: 'flex',
                        flexDirection: 'column',
                        position: 'relative',
                    }}
                >
                    <Grid display="flex" flexDirection="column" alignItems="center" my={2}>
                        <Grid marginBottom={1}>
                            <Box
                                sx={{
                                    ...circleDesign,
                                    width: '48px',
                                    height: '48px',
                                    backgroundColor: darkMode ? 'rgb(147, 152, 194)' : '#F1F7FF',
                                }}
                            >
                                <Box
                                    sx={{
                                        ...circleDesign,
                                        width: '35px',
                                        height: '35px',
                                        backgroundColor: darkMode ? 'rgb(134 141 199)' : '#DEEDFF',
                                    }}
                                >
                                    <CheckCircleOutline sx={{ color: darkMode ? 'white' : '#1E2775', fontSize: '16px' }} />
                                </Box>
                            </Box>
                        </Grid>
                        <Typography color={darkMode ? '#787c9e' : '#53566E'} fontWeight={600} fontSize="22px">
                            {i18next.t('meltaUpdates.title')}
                        </Typography>
                        {titleDescription && (
                            <Typography color={darkMode ? 'white' : '#53566E'} fontSize="18px">
                                {titleDescription}
                            </Typography>
                        )}
                    </Grid>

                    {Object.entries(meltaUpdates).map(([title, description], index) => (
                        <Box display="flex" alignItems="center" key={description} gap={2} margin={1}>
                            <Box
                                sx={{
                                    ...circleDesign,
                                    background: theme.palette.primary.main,
                                    height: '35px',
                                    width: '35px',
                                }}
                            >
                                <Typography fontWeight={700} fontSize="15px" color="white">
                                    {index + 1}
                                </Typography>
                            </Box>
                            <Typography fontSize="16px" color={darkMode ? '' : '#53566E'}>
                                {title}
                            </Typography>
                            <MeltaTooltip title={description}>
                                <InfoOutlined sx={{ color: '#166BD4' }} />
                            </MeltaTooltip>
                        </Box>
                    ))}
                </DialogContent>

                <DialogActions>
                    <Button
                        variant="contained"
                        fullWidth
                        sx={{
                            margin: '15px',
                            borderRadius: '7px',
                        }}
                        onClick={handleClose}
                    >
                        <Typography color="white">{i18next.t('meltaUpdates.confirmation')}</Typography>
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export { MeltaUpdates };
