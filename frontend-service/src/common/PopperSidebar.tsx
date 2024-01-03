import React, { CSSProperties } from 'react';
import { Box, Divider, IconButton, Popper, Typography, Grid, ClickAwayListener } from '@mui/material';
import { CloseSharp } from '@mui/icons-material';
import Slide from '@mui/material/Slide';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { lightTheme } from '../theme';

const PopperSidebar: React.FC<{
    open: boolean;
    setOpen: React.Dispatch<React.SetStateAction<boolean>>;
    title: string;
    side: 'right' | 'left';
    topButtons?: React.ReactNode;
    sideMargin?: CSSProperties['margin'];
    width?: CSSProperties['width'];
}> = ({ children, open, setOpen, title, side, topButtons, sideMargin = 0, width = '22rem' }) => {
    const darkMode = useSelector((state: RootState) => state.darkMode);

    return (
        <Popper open={open} transition sx={{ left: side === 'right' ? 0 : 'auto', marginX: sideMargin }}>
            {({ TransitionProps }) => (
                <Slide {...TransitionProps} direction={side === 'right' ? 'left' : 'right'}>
                    <Box paddingTop="3.8rem" paddingX="1.1rem">
                        <ClickAwayListener onClickAway={() => setOpen(false)}>
                            <Grid
                                container
                                direction="column"
                                wrap="nowrap"
                                width={width}
                                bgcolor={darkMode ? '#2e2e2e' : '#fcfeff'}
                                height="92.9vh"
                                borderRadius="15px"
                                boxShadow="5px 5px 5px 5px #0000000D"
                                position="sticky"
                                overflow="none"
                            >
                                <Grid item>
                                    <Grid container alignItems="center" height="2.5rem" paddingX="0.2rem">
                                        <IconButton onClick={() => setOpen(false)} size="small" sx={{ position: 'absolute' }}>
                                            <CloseSharp />
                                        </IconButton>

                                        <Typography
                                            color={lightTheme.palette.primary.main}
                                            fontFamily="Rubik"
                                            component="h5"
                                            variant="h5"
                                            marginX="auto"
                                            fontWeight="bold"
                                        >
                                            {title}
                                        </Typography>

                                        <Box position="absolute" right={10}>
                                            {topButtons}
                                        </Box>
                                    </Grid>
                                    <Divider sx={{ marginX: '10px' }} />
                                </Grid>

                                {children}
                            </Grid>
                        </ClickAwayListener>
                    </Box>
                </Slide>
            )}
        </Popper>
    );
};

export default PopperSidebar;
