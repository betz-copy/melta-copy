import React from 'react';
import { IconButton } from '@mui/material';
import { FileDownload as FileDownloadIcon } from '@mui/icons-material';
import Downloader from 'js-file-downloader';
import { toast } from 'react-toastify';
import i18next from 'i18next';
import { getFileName } from '../utils/getFileName';
import { environment } from '../globals';

const DownloadButton: React.FC<{ fileId: string | File }> = ({ fileId }) => {
    const fileName = typeof fileId === 'string' ? getFileName(fileId) : fileId.name;

    return (
        <IconButton
            onClick={async (event) => {
                event.stopPropagation();
                const url = typeof fileId === 'string' ? `/api${environment.api.storage}/${fileId}` : URL.createObjectURL(fileId);
                try {
                    await new Downloader({
                        url,
                        filename: fileName,
                        withCredentials: true,
                    });

                    if (typeof fileId !== 'string') URL.revokeObjectURL(url);
                } catch (error) {
                    toast.error(i18next.t('errorPage.fileDownloadError'));
                }
            }}
            sx={{ color: 'white' }}
        >
            <FileDownloadIcon />
        </IconButton>
    );
};

export { DownloadButton };
