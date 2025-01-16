import React from 'react';
import i18next from 'i18next';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';
import { useDarkModeStore } from './stores/darkMode';

interface MeltaUpdatesProps {
    open: boolean;
    handleClose: () => void;
    meltaUpdates: Record<string, string>;
}

const MeltaUpdates: React.FC<MeltaUpdatesProps> = ({ open, handleClose, meltaUpdates }) => {
    const darkMode = useDarkModeStore((state) => state.darkMode);

    return (
        <Dialog open={open} onClose={handleClose}>
            <DialogTitle color={darkMode ? '#787c9e' : '#1e2775'}>{i18next.t('meltaUpdates.title')}</DialogTitle>
            <DialogContent
                style={{
                    minHeight: '300px',
                    minWidth: '500px',
                }}
            >
                {Object.entries(meltaUpdates).map(([title, description]) => (
                    <Box display="flex" key={description} gap={2} marginY={1}>
                        <Typography fontSize="15px">·</Typography>
                        <Typography fontSize="15px" fontWeight={600}>
                            {title}:
                        </Typography>
                        <Typography fontSize="15px">{description}</Typography>
                    </Box>
                ))}
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>{i18next.t('meltaUpdates.gotIt')}</Button>
            </DialogActions>
        </Dialog>
    );
};

export { MeltaUpdates };
