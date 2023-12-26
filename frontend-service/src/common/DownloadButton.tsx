import React from 'react';
import { IconButton } from '@mui/material';
import { FileDownload as FileDownloadIcon } from '@mui/icons-material';
import Downloader from 'js-file-downloader';
import { getFileName } from '../utils/getFileName';
import { environment } from '../globals';

const DownloadButton: React.FC<{ fileId: string }> = ({ fileId }) => {
    const fileName = getFileName(fileId);

    return (
        <IconButton
            onClick={async (event) => {
                event.stopPropagation();
                new Downloader({
                    url: `/api${environment.api.storage}/${fileId}`,
                    filename: fileName,
                    withCredentials: true,
                });
            }}
            sx={{ color: 'white' }}
        >
            <FileDownloadIcon />
        </IconButton>
    );
};

export { DownloadButton };
