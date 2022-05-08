import React from 'react';
import { Box, IconButton, Popover, Typography } from '@mui/material';

const IconButtonWithPopoverText: React.FC<{
    iconButtonProps: Omit<React.ComponentProps<typeof IconButton>, 'onMouseEnter' | 'onMouseLeave'>;
    popoverText: string;
}> = ({ children, iconButtonProps, popoverText }) => {
    const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);

    const closePopover = () => setAnchorEl(null);
    const openPopover = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    return (
        <Box sx={{ display: 'inline' }}>
            <IconButton {...iconButtonProps} onMouseEnter={openPopover} onMouseLeave={closePopover}>
                {children}
            </IconButton>
            <Popover
                open={Boolean(anchorEl)}
                anchorEl={anchorEl}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'center',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'center',
                }}
                onClose={closePopover}
                disableRestoreFocus
                sx={{
                    pointerEvents: 'none',
                }}
            >
                <Typography sx={{ padding: '5px' }}>{popoverText}</Typography>
            </Popover>
        </Box>
    );
};

export default IconButtonWithPopoverText;
