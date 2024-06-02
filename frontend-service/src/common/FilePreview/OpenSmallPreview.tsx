import { KeyboardArrowLeft, KeyboardArrowRight } from '@mui/icons-material';
import { Box, IconButton } from '@mui/material';
import React, { CSSProperties } from 'react';
import { FileExtensions, IFile } from '../../interfaces/preview';
import { SmallPreview } from './SmallPreview';

interface IOpenSmallPreview {
    files: IFile[];
    currentIndex: number;
    increaseIndex: () => void;
    decreaseIndex: () => void;
    targetExtensions?: FileExtensions[];
    maxHeight?: CSSProperties['maxHeight'];
    maxWidth?: CSSProperties['maxWidth'];
}

const OpenSmallPreview: React.FC<IOpenSmallPreview> = ({ files, currentIndex, increaseIndex, decreaseIndex, maxHeight, maxWidth }) => {
    const file = files[currentIndex];

    return (
        <Box sx={{ borderRadius: '1rem', border: '1.5px solid #1E2775', overflow: 'hidden', height: '100%', position: 'relative' }}>
            {currentIndex !== 0 && (
                <IconButton
                    sx={{
                        position: 'absolute',
                        left: 0,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        zIndex: 2,
                    }}
                    onClick={decreaseIndex}
                >
                    <KeyboardArrowRight />
                </IconButton>
            )}

            <SmallPreview file={file} height={maxHeight} width={maxWidth} />

            {currentIndex !== files.length - 1 && (
                <IconButton
                    sx={{
                        position: 'absolute',
                        right: 0,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        zIndex: 2,
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
