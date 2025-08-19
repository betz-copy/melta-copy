import { CloseSharp } from '@mui/icons-material';
import { Box, ClickAwayListener, Grid, IconButton, Popper, useTheme } from '@mui/material';
import Slide from '@mui/material/Slide';
import React, { CSSProperties, ReactNode } from 'react';
import { useDarkModeStore } from '../stores/darkMode';

const PopperSidebar: React.FC<{
    open: boolean;
    setOpen: React.Dispatch<React.SetStateAction<boolean>>;
    title: React.ReactNode;
    side: 'right' | 'left';
    sideMargin?: CSSProperties['margin'];
    width?: CSSProperties['width'];
    isCheckBoxClicked?: boolean;
    children?: ReactNode;
}> = ({ children, open, setOpen, title, side, sideMargin = 0, width = '22rem', isCheckBoxClicked = false }) => {
    const darkMode = useDarkModeStore((state) => state.darkMode);
    const theme = useTheme();

    return (
        <Popper open={open} transition sx={{ left: side === 'right' ? 0 : 'auto', marginX: sideMargin, zIndex: '200' }}>
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
                                <Grid padding="15px" sx={{ position: 'relative' }}>
                                    <Grid container alignItems="center" height="2.5rem" paddingX="0.2rem">
                                        {title}
                                    </Grid>
                                    <IconButton
                                        onClick={() => {
                                            setOpen(false);
                                        }}
                                        size="small"
                                        sx={{ position: 'absolute', top: '20px', right: '15px' }}
                                    >
                                        <CloseSharp sx={{ color: theme.palette.primary.main }} />
                                    </IconButton>
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
