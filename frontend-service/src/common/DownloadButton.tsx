import React from 'react';
import { FileDownload as FileDownloadIcon } from '@mui/icons-material';
import { IconButton, Typography } from '@mui/material';
import Downloader from 'js-file-downloader';
import { environment } from '../globals';

const DownloadButton: React.FC<{ fileId: string }> = ({ fileId }) => {
    if (!fileId) {
        return null;
    }

    return (
        <IconButton onClick={() => new Downloader({ url: `/api${environment.api.storage}/${fileId}`, filename: fileId, withCredentials: true })}>
            <FileDownloadIcon />
            <Typography style={{ marginRight: '5px' }}>{fileId}</Typography>
        </IconButton>
    );
};

export { DownloadButton };
