import React, { useState } from 'react';
import { IconButton, Typography } from '@mui/material';
import { FileDownload as FileDownloadIcon } from '@mui/icons-material';
import { Preview } from './Preview';
import { getFileName } from '../utils/getFileName';
import { getPreviewContentType } from '../utils/getFileType';
import { useFilePreview } from '../utils/useFilePreview';
import { environment } from '../globals';

const OpenPreviewButton: React.FC<{ fileId: string }> = ({ fileId }) => {
    const fileName = getFileName(fileId);
    const [open, setOpen] = useState(false);
    const contentType = getPreviewContentType(fileName);
    const { data, refetch, isLoading, isError } = useFilePreview(fileId, contentType);

    return (
        <>
            <IconButton
                onClick={async () => {
                    setOpen(true);
                    if (!data) {
                        await refetch();
                    }
                }}
                sx={{ borderRadius: 10 }}
            >
                <FileDownloadIcon />
                <Typography style={{ marginRight: '5px', fontSize: environment.mainFontSizes.headlineSubTitleFontSize }}>{fileName}</Typography>
            </IconButton>
            <Preview data={data} fileId={fileId} setOpen={setOpen} open={open} loading={isLoading} fileName={fileName} error={isError} />
        </>
    );
};

export { OpenPreviewButton };
