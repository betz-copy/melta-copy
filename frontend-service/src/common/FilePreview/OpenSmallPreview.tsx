import { Box } from '@mui/material';
import React, { CSSProperties } from 'react';
import { FileExtensions } from '../../interfaces/preview';
import { getFileName } from '../../utils/getFileName';
import { getPreviewContentType } from '../../utils/getFileType';
import { useFilePreview } from '../../utils/useFilePreview';
import { SmallPreview } from './SmallPreview';

interface IOpenSmallPreview {
    fileId: string;
    targetExtension?: FileExtensions;
    maxHeight?: CSSProperties['maxHeight'];
    maxWidth?: CSSProperties['maxWidth'];
}

const OpenSmallPreview: React.FC<IOpenSmallPreview> = ({ fileId, targetExtension, maxHeight, maxWidth }) => {
    const fileName = getFileName(fileId);
    const contentType = getPreviewContentType(fileName);
    const { data, isLoading, isError } = useFilePreview(fileId, contentType, targetExtension);

    return (
        <Box sx={{ borderRadius: '1rem', border: '2px solid #1E2775', overflow: 'hidden' }}>
            <SmallPreview
                data={data}
                loading={isLoading}
                fileName={fileName}
                error={isError}
                height={maxHeight}
                width={maxWidth}
                sx={{ height: '100%', width: '100%' }}
            />
        </Box>
    );
};

export default OpenSmallPreview;
