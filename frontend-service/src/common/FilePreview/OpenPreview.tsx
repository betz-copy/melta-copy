import { Grid, IconButton, Link, Typography } from '@mui/material';
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
import { ISemanticSearchResult } from '../../interfaces/semanticSearch';

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
    download?: boolean;
    onClick?: () => Promise<void>;
    searchValue?: string;
    entityIdsToInclude?: ISemanticSearchResult[string][string];
}> = ({ fileId, img, showText = true, download, onClick, searchValue, entityIdsToInclude }) => {
    const fileName = typeof fileId === 'string' ? getFileName(fileId) : fileId.name;
    const [open, setOpen] = useState(false);
    const contentType = getPreviewContentType(fileName);

    const handleButtonClick = async () => {
        setOpen(true);
    };

    const highlightAll = useMemo(() => {
        const isFileNameSearched = searchValue && fileName.toLowerCase().includes(searchValue);
        return (
            !isFileNameSearched &&
            entityIdsToInclude?.map((entityIdToInclude) => entityIdToInclude.minioFileId).includes(typeof fileId === 'string' ? fileId : fileId.name)
        );
    }, [entityIdsToInclude, fileId, fileName, searchValue]);

    const matchSentence = entityIdsToInclude?.find((entityIdToInclude) => entityIdToInclude.minioFileId === fileId)?.text;

    if (download) {
        const content = (
            <OpenPreviewContent
                fileName={fileName}
                img={img}
                showText={showText}
                searchValue={searchValue}
                onClick={onClick}
                highlightAll={highlightAll}
            />
        );
        return onClick ? (
            content
        ) : (
            <Link href={`/api${environment.api.storage}/${fileId}`} target="_blank" download>
                {content}
            </Link>
        );
    }
    return (
        <MeltaTooltip
            title={
                <Typography
                    sx={{
                        maxHeight: '250px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 10,
                        WebkitBoxOrient: 'vertical',
                    }}
                >
                    {matchSentence}
                </Typography>
            }
            placement="right"
            disableHoverListener={open}
        >
            <Grid>
                <OpenPreviewContent
                    fileName={fileName}
                    onClick={handleButtonClick}
                    img={img}
                    showText={showText}
                    searchValue={searchValue}
                    highlightAll={highlightAll}
                />
                {open && <PreviewDialog fileId={fileId} setOpen={setOpen} open={open} fileName={fileName} contentType={contentType} />}
            </Grid>
        </MeltaTooltip>
    );
};

export default OpenPreview;
