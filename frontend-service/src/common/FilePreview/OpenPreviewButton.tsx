import { Grid, IconButton, Typography } from '@mui/material';
import React, { useState } from 'react';
import { environment } from '../../globals';
import { getFileName } from '../../utils/getFileName';
import { getFileExtension, getFileNameWithoutExtension, getPreviewContentType } from '../../utils/getFileType';
import { useFilePreview } from '../../utils/hooks/useFilePreview';
import FileIcon from './FileIcon';
import { Preview } from './PreviewDialog';

const OpenPreviewButton: React.FC<{ fileId: string }> = ({ fileId }) => {
    const fileName = getFileName(fileId);
    const [open, setOpen] = useState(false);
    const contentType = getPreviewContentType(fileName);
    const { data, refetch, isLoading, isError } = useFilePreview(fileId, contentType);

    return (
        <Grid style={{ overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '100%' }}>
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
            <Preview data={data} fileId={fileId} setOpen={setOpen} open={open} loading={isLoading} fileName={fileName} error={isError} />
        </Grid>
    );
};

export { OpenPreviewButton };
