import { Box, Grid, IconButton, Link, Typography } from '@mui/material';
import React, { ReactNode, useState } from 'react';
import { environment } from '../../globals';
import { getFileName } from '../../utils/getFileName';
import { getFileExtension, getFileNameWithoutExtension, getPreviewContentType } from '../../utils/getFileType';
import FileIcon from './FileIcon';
import { PreviewDialog } from './PreviewDialog';
import { HighlightText } from '../../utils/HighlightText';

const OpenPreviewContent: React.FC<{
    fileName: string;
    onClick?: () => Promise<void>;
    img?: ReactNode;
    showText?: boolean;
    searchValue?: string;
}> = ({ fileName, onClick, img, showText, searchValue }) => (
    <Grid style={{ overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '100%' }}>
        <IconButton
            sx={{ borderRadius: 10, maxWidth: '100%' }}
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
                    <HighlightText text={getFileNameWithoutExtension(fileName)} searchedText={searchValue} />
                </Typography>
            )}
        </IconButton>
    </Grid>
);

const OpenPreview: React.FC<{
    fileId: string | File;
    img?: ReactNode;
    showText?: boolean;
    download?: boolean;
    searchValue?: string;
}> = ({ fileId, img, showText = true, download, searchValue }) => {
    const fileName = typeof fileId === 'string' ? getFileName(fileId) : fileId.name;
    const [open, setOpen] = useState(false);
    const contentType = getPreviewContentType(fileName);

    const handleButtonClick = async () => {
        setOpen(true);
    };

    return (
        <Grid>
            {download ? (
                <Link href={`/api${environment.api.storage}/${fileId}`} target="_blank" download>
                    <OpenPreviewContent searchValue={searchValue} fileName={fileName} img={img} showText={showText} />
                </Link>
            ) : (
                <Box>
                    <OpenPreviewContent fileName={fileName} onClick={handleButtonClick} img={img} showText={showText} searchValue={searchValue} />
                    {open && <PreviewDialog fileId={fileId} setOpen={setOpen} open={open} fileName={fileName} contentType={contentType} />}
                </Box>
            )}
        </Grid>
    );
};

export default OpenPreview;
