import React from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';
import { CloseOutlined as DeleteIcon } from '@mui/icons-material';

interface IRemoveFromArrayButtonProps {
    onRemove: () => void;
    tooltip: string;
}

export const RemoveFromArrayButton: React.FC<IRemoveFromArrayButtonProps> = ({ onRemove, tooltip }) => {
    return (
        <Box position="absolute" right="3px" top="3px">
            <Tooltip title={tooltip}>
                <IconButton onClick={() => onRemove()}>
                    <DeleteIcon />
                </IconButton>
            </Tooltip>
        </Box>
    );
};
