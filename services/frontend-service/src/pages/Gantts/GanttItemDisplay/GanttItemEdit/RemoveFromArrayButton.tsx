import React from 'react';
import { Box, IconButton } from '@mui/material';
import { CloseOutlined as DeleteIcon } from '@mui/icons-material';
import { MeltaTooltip } from '../../../../common/MeltaTooltip';

interface IRemoveFromArrayButtonProps {
    onRemove: () => void;
    tooltip: string;
}

export const RemoveFromArrayButton: React.FC<IRemoveFromArrayButtonProps> = ({ onRemove, tooltip }) => {
    return (
        <Box position="absolute" right="3px" top="3px">
            <MeltaTooltip title={tooltip}>
                <IconButton onClick={() => onRemove()}>
                    <DeleteIcon />
                </IconButton>
            </MeltaTooltip>
        </Box>
    );
};
