import { Box, Fab, Fade } from '@mui/material';
import { KeyboardArrowUp as KeyboardArrowUpIcon } from '@mui/icons-material';
import React, { RefObject } from 'react';

const ScrollToTop: React.FC<{ fadeInTrigger: boolean; scrollToElementRef: RefObject<HTMLElement> }> = ({ fadeInTrigger, scrollToElementRef }) => {
    return (
        <Fade in={fadeInTrigger}>
            <Box
                onClick={() => scrollToElementRef.current?.scrollIntoView({ block: 'center' })}
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
