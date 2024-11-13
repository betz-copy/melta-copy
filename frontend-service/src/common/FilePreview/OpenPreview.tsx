import { Box, CircularProgress, Grid, IconButton, Link, Typography } from '@mui/material';
import React, { ReactNode, useState } from 'react';
import { environment } from '../../globals';
import { getFileName } from '../../utils/getFileName';
import { getFileExtension, getFileNameWithoutExtension, getPreviewContentType } from '../../utils/getFileType';
import FileIcon from './FileIcon';
import { PreviewDialog } from './PreviewDialog';

const OpenPreviewContent: React.FC<{
    fileName: string;
    onClick?: () => Promise<void> | React.MouseEventHandler<HTMLButtonElement>;
    img?: ReactNode;
    showText?: boolean;
}> = ({ fileName, onClick, img, showText }) => (
    <Grid style={{ overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '100%' }}>
        <IconButton
            sx={{ borderRadius: 10, maxWidth: '100%', gap: '10px' }}
            onClick={(e) => {
                e.stopPropagation();
                onClick?.();
            }}
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
    </Grid>
);

const OpenPreview: React.FC<{
    fileId: string | File;
    img?: ReactNode;
    showText?: boolean;
    type?: 'download' | 'preview' | 'exportTable';
    onClick?: React.MouseEventHandler<HTMLButtonElement>;
    loading?: boolean;
}> = ({ fileId, img, showText = true, type = 'preview', onClick, loading }) => {
    console.log({ fileId, type });

    // eslint-disable-next-line no-nested-ternary
    const fileName = typeof fileId === 'string' ? (type === 'exportTable' ? fileId : getFileName(fileId)) : fileId.name;
    console.log({ fileName });

    const [open, setOpen] = useState(false);
    const contentType = getPreviewContentType(fileName);

    const handleButtonClick = async () => {
        setOpen(true);
    };

    return (
        <Grid>
            {type === 'download' && (
                <Link href={`/api${environment.api.storage}/${fileId}`} target="_blank" download>
                    <OpenPreviewContent fileName={fileName} img={img} showText={showText} />
                </Link>
            )}
            {type === 'preview' && (
                <Box>
                    <OpenPreviewContent fileName={fileName} onClick={handleButtonClick} img={img} showText={showText} />
                    {open && <PreviewDialog fileId={fileId} setOpen={setOpen} open={open} fileName={fileName} contentType={contentType} />}
                </Box>
            )}
            {type === 'exportTable' &&
                (loading ? (
                    <CircularProgress size="24px" />
                ) : (
                    <OpenPreviewContent fileName={fileName} onClick={onClick as React.MouseEventHandler<HTMLButtonElement>} showText={showText} />
                ))}
        </Grid>
    );
};

export default OpenPreview;
