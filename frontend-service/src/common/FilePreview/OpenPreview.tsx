import { Box, Grid, IconButton, Typography } from '@mui/material';
import React, { CSSProperties, useState } from 'react';
import { environment } from '../../globals';
import { FileExtensions } from '../../interfaces/preview';
import { getFileName } from '../../utils/getFileName';
import { getFileExtension, getFileNameWithoutExtension, getPreviewContentType } from '../../utils/getFileType';
import { useFilePreview } from '../../utils/useFilePreview';
import FileIcon from './FileIcon';
import { PreviewDialog } from './PreviewDialog';
import { SmallPreview } from './SmallPreview';

interface IOpenPreview {
    fileId: string;
    targetExtension?: FileExtensions;
    getSmallPreview?: boolean;
    startOpen?: boolean;
    maxHeight?: CSSProperties['maxHeight'];
    maxWidth?: CSSProperties['maxWidth'];
}

const OpenPreview: React.FC<IOpenPreview> = ({ fileId, targetExtension, getSmallPreview = false, startOpen = false, maxHeight, maxWidth }) => {
    const [open, setOpen] = useState(startOpen);

    const fileName = getFileName(fileId);
    const contentType = getPreviewContentType(fileName);
    const { data, refetch, isLoading, isError } = useFilePreview(fileId, contentType, targetExtension);

    return getSmallPreview ? (
        <Box sx={{ borderRadius: '1rem', border: '2px solid #1E2775', overflow: 'hidden' }}>
            <SmallPreview
                data={data}
                fileId={fileId}
                loading={isLoading}
                fileName={fileName}
                error={isError}
                maxHeight={maxHeight}
                maxWidth={maxWidth}
                sx={{ height: '100%', width: '100%' }}
            />
        </Box>
    ) : (
        <Grid sx={{ overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '100%' }}>
            <IconButton
                onClick={async () => {
                    setOpen(true);
                    if (!data) {
                        await refetch();
                    }
                }}
                sx={{ borderRadius: 10, maxWidth: '100%' }}
            >
                <FileIcon extension={getFileExtension(fileName)} style={{ height: '18px' }} />

                <Typography
                    sx={{
                        marginRight: '5px',
                        fontSize: environment.mainFontSizes.headlineSubTitleFontSize,
                        textOverflow: 'ellipsis',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                        maxWidth: '100%',
                    }}
                >
                    {getFileNameWithoutExtension(fileName)}
                </Typography>
            </IconButton>
            <PreviewDialog data={data} fileId={fileId} setOpen={setOpen} open={open} loading={isLoading} fileName={fileName} error={isError} />
        </Grid>
    );
};

export { OpenPreview };
