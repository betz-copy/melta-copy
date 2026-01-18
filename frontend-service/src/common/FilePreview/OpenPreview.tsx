import { AutoAwesome } from '@mui/icons-material';
import { Grid, IconButton, Link, Typography } from '@mui/material';
import { ISemanticSearchResult } from '@packages/semantic-search';
import i18next from 'i18next';
import React, { useMemo, useState } from 'react';
import { environment } from '../../globals';
import { useWorkspaceStore } from '../../stores/workspace';
import { getFileName } from '../../utils/getFileName';
import { getFileExtension, getFileNameWithoutExtension, getPreviewContentType } from '../../utils/getFileType';
import { HighlightText } from '../../utils/HighlightText';
import MeltaTooltip from '../MeltaDesigns/MeltaTooltip';
import FileIcon from './FileIcon';
import { PreviewDialog } from './PreviewDialog';

type PreviewImage = React.ReactElement | string | number | null | undefined;

const OpenPreviewContent: React.FC<{
    fileName: string;
    onClick?: () => Promise<void>;
    img?: PreviewImage;
    showText?: boolean;
    searchValue?: string;
    highlightAll?: boolean;
    color?: string;
}> = ({ fileName, onClick, img, showText, searchValue, highlightAll, color }) => {
    const text = useMemo(() => getFileNameWithoutExtension(fileName), [fileName]);
    const workspace = useWorkspaceStore((state) => state.workspace);

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
                    <HighlightText
                        text={text}
                        searchedText={highlightAll ? text : searchValue}
                        color={color}
                        sx={{
                            marginRight: '5px',
                            fontSize: workspace.metadata.agGrid.defaultFontSize,
                            textOverflow: 'ellipsis',
                            overflow: 'hidden',
                            whiteSpace: 'nowrap',
                            maxWidth: '100%',
                        }}
                    />
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
    img?: PreviewImage;
    showText?: boolean;
    download?: boolean;
    onClick?: () => Promise<void>;
    searchValue?: string;
    entityFileIdsWithTexts?: ISemanticSearchResult[string][string];
    defaultFileName?: string;
    disabled?: boolean;
    color?: string;
}> = ({ fileId, img, showText = true, download, onClick, searchValue, entityFileIdsWithTexts, defaultFileName, disabled, color }) => {
    const fileName = defaultFileName ?? (typeof fileId === 'string' ? getFileName(fileId) : fileId.name);

    const [open, setOpen] = useState(false);
    const contentType = getPreviewContentType(fileName);

    const handleButtonClick = async () => {
        if (disabled) return;
        setOpen(true);
    };

    const highlightAll = useMemo(() => {
        const isFileNameSearched = searchValue && fileName.toLowerCase().includes(searchValue);
        return (
            !isFileNameSearched &&
            entityFileIdsWithTexts
                ?.map((entityIdToInclude) => entityIdToInclude.minioFileId)
                .includes(typeof fileId === 'string' ? fileId : fileId.name)
        );
    }, [entityFileIdsWithTexts, fileId, fileName, searchValue]);

    const matchSentence = entityFileIdsWithTexts?.find((entityIdToInclude) => entityIdToInclude.minioFileId === fileId)?.text;

    if (download) {
        const content = (
            <OpenPreviewContent
                fileName={fileName}
                img={img}
                showText={showText}
                searchValue={searchValue}
                onClick={onClick}
                highlightAll={highlightAll}
                color={color}
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
    return matchSentence ? (
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
                    color={color}
                />
                {open && <PreviewDialog fileId={fileId} setOpen={setOpen} open={open} fileName={fileName} contentType={contentType} />}
            </Grid>
        </MeltaTooltip>
    ) : (
        <Grid>
            <OpenPreviewContent
                fileName={fileName}
                onClick={handleButtonClick}
                img={img}
                showText={showText}
                searchValue={searchValue}
                highlightAll={highlightAll}
                color={color}
            />
            {open && <PreviewDialog fileId={fileId} setOpen={setOpen} open={open} fileName={fileName} contentType={contentType} />}
        </Grid>
    );
};

export default OpenPreview;
