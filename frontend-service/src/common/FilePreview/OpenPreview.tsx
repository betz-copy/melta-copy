import { Grid, IconButton, Typography } from '@mui/material';
import React, { ReactNode, useState } from 'react';
import { environment } from '../../globals';
import { getFileName } from '../../utils/getFileName';
import { getFileExtension, getFileNameWithoutExtension, getPreviewContentType } from '../../utils/getFileType';
import FileIcon from './FileIcon';
import { PreviewDialog } from './PreviewDialog';

const OpenPreview: React.FC<{
    fileId: string;
    img?: ReactNode;
    showText?: boolean;
}> = ({ fileId, img, showText = true }) => {
    const fileName = getFileName(fileId);
    const [open, setOpen] = useState(false);
    const contentType = getPreviewContentType(fileName);

    return (
        <Grid sx={{ overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '100%' }}>
            <IconButton
                onClick={async () => {
                    setOpen(true);
                }}
                sx={{ borderRadius: 10, maxWidth: '100%' }}
            >
                {img ?? <FileIcon extension={getFileExtension(fileName)} style={{ height: '18px' }} />}

                {showText && (
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
                )}
            </IconButton>
            {open && <PreviewDialog fileId={fileId} setOpen={setOpen} open={open} fileName={fileName} contentType={contentType} />}
        </Grid>
    );
};

export default OpenPreview;
