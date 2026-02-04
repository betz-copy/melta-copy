import { FileDownload as FileDownloadIcon } from '@mui/icons-material';
import { IconButton } from '@mui/material';
import i18next from 'i18next';
import Downloader from 'js-file-downloader';
import React from 'react';
import { toast } from 'react-toastify';
import { environment } from '../globals';
import { useWorkspaceStore } from '../stores/workspace';
import { getFileName } from '../utils/getFileName';

const DownloadButton: React.FC<{ fileId: string | File }> = ({ fileId }) => {
    const workspace = useWorkspaceStore((state) => state.workspace);

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
                        headers: [{ name: environment.workspaceIdHeaderName, value: workspace._id }],
                    });

                    if (typeof fileId !== 'string') URL.revokeObjectURL(url);
                } catch (error) {
                    console.error(error);
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
