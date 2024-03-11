import React, { useState } from 'react';
import { Grid, IconButton, Typography } from '@mui/material';
import Downloader from 'js-file-downloader';
import { toast } from 'react-toastify';
import i18next from 'i18next';
import { Preview } from './PreviewDialog';
import { getFileName } from '../../utils/getFileName';
import { getFileExtension, getFileNameWithoutExtension, getPreviewContentType } from '../../utils/getFileType';
import { useFilePreview } from '../../utils/useFilePreview';
import { environment } from '../../globals';
import FileIcon from './FileIcon';

const OpenPreviewButton: React.FC<{ fileId: string; toPrint?: boolean }> = ({ fileId, toPrint }) => {
    const fileName = getFileName(fileId);
    const [open, setOpen] = useState(false);
    const contentType = getPreviewContentType(fileName);
    const { data, refetch, isLoading, isError } = useFilePreview(fileId, contentType);

    return (
        <Grid style={{ overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '100%' }}>
            <IconButton
                onClick={async () => {
                    console.log('click');
                    if (toPrint) {
                        try {
                            await new Downloader({
                                url: `/api${environment.api.storage}/${fileId}`,
                                filename: fileName,
                                withCredentials: true,
                            });
                        } catch (error) {
                            console.error('Download error:', error);
                            toast.error(i18next.t('errorPage.fileDownloadError'));
                        }
                    } else {
                        setOpen(true);
                        if (!data) {
                            await refetch();
                        }
                    }
                }}
                sx={{ borderRadius: 10, maxWidth: '100%' }}
            >
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
            {!toPrint && (
                <Preview data={data} fileId={fileId} setOpen={setOpen} open={open} loading={isLoading} fileName={fileName} error={isError} />
            )}
        </Grid>
    );
};

export { OpenPreviewButton };
