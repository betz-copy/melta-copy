/* eslint-disable react-hooks/rules-of-hooks */
import { KeyboardArrowLeft, KeyboardArrowRight } from '@mui/icons-material';
import { Box, IconButton } from '@mui/material';
import React, { CSSProperties } from 'react';
import { environment } from '../../globals';
import { FileExtensions, IFile } from '../../interfaces/preview';
import { useFilePreview } from '../../utils/useFilePreview';
import { SmallPreview } from './SmallPreview';
import { getFileExtension } from '../../utils/getFileType';
import { getFileName } from '../../utils/getFileName';

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
    const { data, isLoading, isError } = useFilePreview(
        file.id,
        file.contentType,
        getFileExtension(getFileName(file.id)) !== FileExtensions.pdf ? file.targetExtension : undefined,
    );

    const getHalfTheHeight = (height: CSSProperties['maxHeight']) =>
        `${Number(height?.toString().replace(/\D/g, '') || environment.smallPreviewHeight.number) / 2}${
            height?.toString().replace(/[0-9]/g, '') || environment.smallPreviewHeight.unit
        }`;

    return (
        <Box sx={{ borderRadius: '1rem', border: '2px solid #1E2775', overflow: 'hidden' }}>
            <Box sx={{ height: '0px', width: '0px', display: 'flex', justifyContent: 'start', alignItems: 'center' }}>
                <IconButton
                    sx={{
                        position: 'relative',
                        right: '0',
                        top: getHalfTheHeight(maxHeight),
                        color: '#101440',
                        zIndex: 2,
                        '&:hover': { color: 'white', bgcolor: '#10144040' },
                    }}
                    disabled={currentIndex === 0}
                    onClick={() => {
                        decreaseIndex();
                    }}
                >
                    <KeyboardArrowRight />
                </IconButton>
            </Box>
            <SmallPreview
                data={data}
                loading={isLoading}
                contentType={file.contentType}
                error={isError}
                height={maxHeight}
                width={maxWidth}
                sx={{ height: '100%', width: '100%' }}
            />
            <Box sx={{ height: '0px', display: 'flex', justifyContent: 'end', alignItems: 'center' }}>
                <IconButton
                    sx={{
                        position: 'relative',
                        left: '0',
                        bottom: getHalfTheHeight(maxHeight),
                        color: '#101440',
                        zIndex: 2,
                        '&:hover': { color: 'white', bgcolor: '#10144040' },
                    }}
                    disabled={currentIndex === files.length - 1}
                    onClick={() => {
                        increaseIndex();
                    }}
                >
                    <KeyboardArrowLeft />
                </IconButton>
            </Box>
        </Box>
    );
};

export default OpenSmallPreview;
