import { Box, Grid, IconButton, Link, Typography } from '@mui/material';
import React, { ReactNode, useState } from 'react';
import { environment } from '../../globals';
import { getFileName } from '../../utils/getFileName';
import { getFileExtension, getFileNameWithoutExtension, getPreviewContentType } from '../../utils/getFileType';
import FileIcon from './FileIcon';
import { PreviewDialog } from './PreviewDialog';
import { useWorkspaceStore } from '../../stores/workspace';

const OpenPreviewContent: React.FC<{ fileName: string; onClick?: () => Promise<void>; img?: ReactNode; showText?: boolean }> = ({
    fileName,
    onClick,
    img,
    showText,
}) => {
    const workspace = useWorkspaceStore((state) => state.workspace);

    return (
        <Grid style={{ overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '100%' }}>
            <IconButton sx={{ borderRadius: 10, maxWidth: '100%' }} onClick={onClick}>
                {img ?? <FileIcon extension={getFileExtension(fileName)} style={{ height: '18px' }} />}
                {showText && (
                    <Typography
                        sx={{
                            marginRight: '5px',
                            fontSize: workspace.metadata.mainFontSizes.headlineSubTitleFontSize,
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
};

const OpenPreview: React.FC<{
    fileId: string | File;
    img?: ReactNode;
    showText?: boolean;
    download?: boolean;
}> = ({ fileId, img, showText = true, download }) => {
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
                    <OpenPreviewContent fileName={fileName} img={img} showText={showText} />
                </Link>
            ) : (
                <Box>
                    <OpenPreviewContent fileName={fileName} onClick={handleButtonClick} img={img} showText={showText} />
                    {open && <PreviewDialog fileId={fileId} setOpen={setOpen} open={open} fileName={fileName} contentType={contentType} />}
                </Box>
            )}
        </Grid>
    );
};

export default OpenPreview;
