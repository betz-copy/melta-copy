import React, { useState } from 'react';
import { Box, Grid, IconButton, Link, Typography } from '@mui/material';
import { Preview } from './PreviewDialog';
import { getFileName } from '../../utils/getFileName';
import { getFileExtension, getFileNameWithoutExtension, getPreviewContentType } from '../../utils/getFileType';
import { useFilePreview } from '../../utils/useFilePreview';
import { environment } from '../../globals';
import FileIcon from './FileIcon';

const PreviewButtonContent: React.FC<{ fileName: string; onClick?: () => Promise<void> }> = ({ fileName, onClick }) => (
    <Grid style={{ overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '100%' }}>
        <IconButton sx={{ borderRadius: 10, maxWidth: '100%' }} onClick={onClick}>
            <FileIcon extension={getFileExtension(fileName)} style={{ height: '18px' }} />
            <Typography
                style={{
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
    </Grid>
);

const OpenPreviewButton: React.FC<{ fileId: string; download?: boolean }> = ({ fileId, download }) => {
    const fileName = getFileName(fileId);
    const [open, setOpen] = useState(false);
    const contentType = getPreviewContentType(fileName);
    const { data, refetch, isLoading, isError } = useFilePreview(fileId, contentType);

    const handleButtonClick = async () => {
        setOpen(true);
        if (!data) {
            await refetch();
        }
    };

    return (
        <Grid>
            {download ? (
                <Link href={`/api${environment.api.storage}/${fileId}`} target="_blank" download>
                    <PreviewButtonContent fileName={fileName} />
                </Link>
            ) : (
                <Box>
                    <PreviewButtonContent fileName={fileName} onClick={handleButtonClick} />
                    <Preview data={data} fileId={fileId} setOpen={setOpen} open={open} loading={isLoading} fileName={fileName} error={isError} />
                </Box>
            )}
        </Grid>
    );
};

export { OpenPreviewButton };
