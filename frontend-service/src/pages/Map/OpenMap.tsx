import { Box, Dialog, Grid, IconButton, Typography } from '@mui/material';
import React, { useState } from 'react';
import { AutoAwesome, LocationOn } from '@mui/icons-material';
import i18next from 'i18next';
import { environment } from '../../globals';
import { HighlightText } from '../../utils/HighlightText';
import EntityWithLocationFields from './EntityWithLocationFields';
import { MeltaTooltip } from '../../common/MeltaTooltip';
import { IEntity } from '../../interfaces/entities';
import { IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';

const OpenMapContent: React.FC<{
    field: string;
    onClick?: () => Promise<void>;
    showText?: boolean;
    searchValue?: string;
    highlightAll?: boolean;
}> = ({ field, onClick, showText, searchValue, highlightAll }) => {
    return (
        <Grid style={{ overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '100%' }}>
            <IconButton
                sx={{ borderRadius: 10, maxWidth: '100%' }}
                onClick={(e) => {
                    e.stopPropagation();
                    onClick?.();
                }}
            >
                <LocationOn style={{ height: '18px' }} />
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
                        <HighlightText text={field} searchedText={highlightAll ? field : searchValue} />
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

const OpenMap: React.FC<{
    field: string;
    entity: IEntity;
    entityTemplate: IMongoEntityTemplatePopulated;
    showText?: boolean;
    download?: boolean;
    searchValue?: string;
}> = ({ field, entity, entityTemplate, showText = true, download, searchValue }) => {
    const [open, setOpen] = useState(false);

    const handleButtonClick = async () => {
        setOpen(true);
    };

    // const highlightAll = useMemo(() => {
    //     const isFileNameSearched = searchValue && fileName.toLowerCase().includes(searchValue);
    //     return !isFileNameSearched && entityIdsToInclude?.includes(typeof fileId === 'string' ? fileId : fileId.name);
    // }, [entityIdsToInclude, fileId, fileName, searchValue]);

    return (
        <Grid>
            {download ? (
                // TODO: think what to do when it's print mode!
                // <Link href={`/api${environment.api.storage}/${fileId}`} target="_blank" download>
                <OpenMapContent field={field} showText={showText} searchValue={searchValue} />
            ) : (
                // </Link>
                <Box>
                    <OpenMapContent
                        field={field}
                        onClick={handleButtonClick}
                        showText={showText}
                        searchValue={searchValue}
                        // highlightAll={highlightAll}
                    />
                    {open && (
                        <Dialog open={open} onClose={() => setOpen(false)}>
                            <EntityWithLocationFields entity={entity} entityTemplate={entityTemplate} styles={{ height: '800px', width: '600px' }} />
                        </Dialog>
                    )}
                </Box>
            )}
        </Grid>
    );
};

export default OpenMap;
