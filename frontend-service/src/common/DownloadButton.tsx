import React from 'react';
import { FileDownload as FileDownloadIcon } from '@mui/icons-material';
import { IconButton, Typography } from '@mui/material';
import Downloader from 'js-file-downloader';
import { environment } from '../globals';
import { getFileName } from '../utils/getFileName';

const DownloadButton: React.FC<{ fileId: string }> = ({ fileId }) => {
    if (!fileId) {
        return null;
    }

    const fileName = getFileName(fileId);

    return (
        <IconButton
            onClick={(event) => {
                event.stopPropagation();
                new Downloader({ url: `/api${environment.api.storage}/${fileId}`, filename: fileName, withCredentials: true });
            }}
            sx={{ borderRadius: 10 }}
        >
            <FileDownloadIcon />
            <Typography style={{ marginRight: '5px' }}>{fileName}</Typography>
        </IconButton>
    );
};

export { DownloadButton };
