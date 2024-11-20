import { Box, CircularProgress, Grid, IconButton, Link, Typography } from '@mui/material';
import React, { ReactNode, useMemo, useState } from 'react';
import { AutoAwesome } from '@mui/icons-material';
import i18next from 'i18next';
import { environment } from '../../globals';
import { getFileName } from '../../utils/getFileName';
import { getFileExtension, getFileNameWithoutExtension, getPreviewContentType } from '../../utils/getFileType';
import FileIcon from './FileIcon';
import { PreviewDialog } from './PreviewDialog';
import { HighlightText } from '../../utils/HighlightText';
import { MeltaTooltip } from '../MeltaTooltip';

const OpenPreviewContent: React.FC<{
    fileName: string;
    onClick?: () => Promise<void>;
    img?: ReactNode;
    showText?: boolean;
    searchValue?: string;
    highlightAll?: boolean;
}> = ({ fileName, onClick, img, showText, searchValue, highlightAll }) => {
    const text = useMemo(() => getFileNameWithoutExtension(fileName), [fileName]);

    return (
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
                        <HighlightText text={text} searchedText={highlightAll ? text : searchValue} />
                    </Typography>
                )}

                {highlightAll && (
                    <MeltaTooltip title={i18next.t('entitiesTableOfTemplate.semanticSearch')} arrow>
                        <AutoAwesome style={{ height: '18px' }} />
                    </MeltaTooltip>
                )}
            </IconButton>
        </Grid>
    );
};

const OpenPreview: React.FC<{
    fileId: string | File;
    img?: ReactNode;
    showText?: boolean;
    type?: 'download' | 'preview' | 'exportTable';
    onClick?: () => Promise<void>;
    loading?: boolean;
    searchValue?: string;
    entityIdsToInclude?: string[];
}> = ({ fileId, img, showText = true, type = 'preview', onClick, loading, searchValue, entityIdsToInclude }) => {
    // eslint-disable-next-line no-nested-ternary
    const fileName = typeof fileId === 'string' ? (type === 'exportTable' ? fileId : getFileName(fileId)) : fileId.name;
    const [open, setOpen] = useState(false);
    const contentType = getPreviewContentType(fileName);

    const handleButtonClick = async () => {
        setOpen(true);
    };

    const highlightAll = useMemo(() => {
        const isFileNameSearched = searchValue && fileName.toLowerCase().includes(searchValue);
        return !isFileNameSearched && entityIdsToInclude?.includes(typeof fileId === 'string' ? fileId : fileId.name);
    }, [entityIdsToInclude, fileId, fileName, searchValue]);

    return (
        <Grid>
            {type === 'download' && (
                <Link href={`/api${environment.api.storage}/${fileId}`} target="_blank" download>
                    <OpenPreviewContent fileName={fileName} img={img} showText={showText} searchValue={searchValue} highlightAll={highlightAll} />
                </Link>
            )}
            {type === 'preview' && (
                <Box>
                    <OpenPreviewContent
                        fileName={fileName}
                        onClick={handleButtonClick}
                        img={img}
                        showText={showText}
                        searchValue={searchValue}
                        highlightAll={highlightAll}
                    />
                    {open && <PreviewDialog fileId={fileId} setOpen={setOpen} open={open} fileName={fileName} contentType={contentType} />}
                </Box>
            )}
            {type === 'exportTable' &&
                (loading ? <CircularProgress size="24px" /> : <OpenPreviewContent fileName={fileName} onClick={onClick} showText={showText} />)}
        </Grid>
    );
};

export default OpenPreview;
