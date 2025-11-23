import { KeyboardArrowUp as KeyboardArrowUpIcon } from '@mui/icons-material';
import { Box, Fab, Fade } from '@mui/material';
import React from 'react';

const ScrollToTop: React.FC<{ fadeInTrigger: boolean }> = ({ fadeInTrigger }) => {
    return (
        <Fade in={fadeInTrigger}>
            <Box
                onClick={() => document.querySelector('#main-box')?.scrollTo({ top: 0, left: 0, behavior: 'smooth' })}
                role="presentation"
                sx={{ position: 'fixed', bottom: 32, right: 32 }}
            >
                <Fab size="small" color="primary">
                    <KeyboardArrowUpIcon />
                </Fab>
            </Box>
        </Fade>
    );
};

export default ScrollToTop;
