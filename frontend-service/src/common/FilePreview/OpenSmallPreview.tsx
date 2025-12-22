import { KeyboardArrowLeft, KeyboardArrowRight } from '@mui/icons-material';
import { Box, IconButton, useTheme } from '@mui/material';
import React from 'react';
import { FileExtensions, IFile } from '../../interfaces/preview';
import { SmallPreview } from './SmallPreview';

interface IOpenSmallPreview {
    files: IFile[];
    currentIndex: number;
    increaseIndex: () => void;
    decreaseIndex: () => void;
    targetExtensions?: FileExtensions[];
}

const OpenSmallPreview: React.FC<IOpenSmallPreview> = ({ files, currentIndex, increaseIndex, decreaseIndex }) => {
    const theme = useTheme();
    const file = files[currentIndex];

    return (
        <Box
            sx={{
                borderRadius: '1rem',
                border: `1.5px solid ${theme.palette.primary.main}`,
                overflow: 'hidden',
                height: '100%',
                position: 'relative',
            }}
        >
            {currentIndex !== 0 && (
                <IconButton
                    sx={{
                        position: 'absolute',
                        left: 0,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        zIndex: 2,
                        color: '#000',
                    }}
                    onClick={decreaseIndex}
                >
                    <KeyboardArrowRight />
                </IconButton>
            )}

            <SmallPreview file={file} />

            {currentIndex !== files.length - 1 && (
                <IconButton
                    sx={{
                        position: 'absolute',
                        right: 0,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        zIndex: 2,
                        color: '#000',
                    }}
                    onClick={increaseIndex}
                >
                    <KeyboardArrowLeft />
                </IconButton>
            )}
        </Box>
    );
};

export default OpenSmallPreview;
