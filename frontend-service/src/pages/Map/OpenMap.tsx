import { Dialog, Grid, IconButton, Typography } from '@mui/material';
import React, { useState } from 'react';
import { LocationOn } from '@mui/icons-material';
import { environment } from '../../globals';
import { HighlightText } from '../../utils/HighlightText';
import EntityWithLocationFields from './LocationPreview';
import { IEntity } from '../../interfaces/entities';
import { IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';

const OpenMap: React.FC<{
    field: string;
    entity: IEntity;
    entityTemplate: IMongoEntityTemplatePopulated;
    showText?: boolean;
    searchValue?: string;
}> = ({ field, entity, entityTemplate, showText = true, searchValue }) => {
    const [open, setOpen] = useState(false);

    const handleButtonClick = async () => {
        setOpen(true);
    };

    return (
        <Grid>
            <Grid style={{ overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '100%' }}>
                <IconButton
                    sx={{ borderRadius: 10, maxWidth: '100%' }}
                    onClick={(e) => {
                        e.stopPropagation();
                        handleButtonClick?.();
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
                            <HighlightText text={field} searchedText={searchValue} />
                        </Typography>
                    )}
                </IconButton>
            </Grid>
            {open && (
                <Dialog open={open} onClose={() => setOpen(false)}>
                    <EntityWithLocationFields entity={entity} entityTemplate={entityTemplate} styles={{ height: '800px', width: '600px' }} />
                </Dialog>
            )}
        </Grid>
    );
};

export default OpenMap;
