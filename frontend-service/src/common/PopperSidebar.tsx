import React, { CSSProperties } from 'react';
import { Box, IconButton, Popper, Typography, Grid, ClickAwayListener, useTheme } from '@mui/material';
import { CloseSharp } from '@mui/icons-material';
import Slide from '@mui/material/Slide';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

const PopperSidebar: React.FC<{
    open: boolean;
    setOpen: React.Dispatch<React.SetStateAction<boolean>>;
    title: string;
    side: 'right' | 'left';
    sideMargin?: CSSProperties['margin'];
    width?: CSSProperties['width'];
    isCheckBoxClicked?: boolean;
}> = ({ children, open, setOpen, title, side, sideMargin = 0, width = '22rem', isCheckBoxClicked = false }) => {
    const darkMode = useSelector((state: RootState) => state.darkMode);
    const theme = useTheme();
    return (
        <Popper open={open} transition sx={{ left: side === 'right' ? 0 : 'auto', marginX: sideMargin }}>
            {({ TransitionProps }) => (
                <Slide {...TransitionProps} direction={side === 'right' ? 'left' : 'right'}>
                    <Box paddingTop="3.8rem" paddingX="1.1rem">
                        <ClickAwayListener
                            onClickAway={() => {
                                if (!isCheckBoxClicked) setOpen(false);
                            }}
                        >
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
                                <Grid item padding="15px">
                                    <Grid container alignItems="center" height="2.5rem" paddingX="0.2rem">
                                        <Typography
                                            color={theme.palette.primary.main}
                                            fontFamily="Rubik"
                                            component="h5"
                                            variant="h5"
                                            marginX="auto"
                                            fontWeight="bold"
                                        >
                                            {title}
                                        </Typography>
                                        <IconButton
                                            onClick={() => {
                                                setOpen(false);
                                            }}
                                            size="small"
                                        >
                                            <CloseSharp />
                                        </IconButton>
                                    </Grid>
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
