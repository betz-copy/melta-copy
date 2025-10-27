import { Dialog, Grid, IconButton, Typography } from '@mui/material';
import React, { useState } from 'react';
import { LocationOn } from '@mui/icons-material';
import { HighlightText } from '../../utils/HighlightText';
import { IEntity } from '../../interfaces/entities';
import { IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import { useWorkspaceStore } from '../../stores/workspace';
import LocationPreview from './LocationPreview';
import { IMongoChildTemplatePopulated } from '../../interfaces/childTemplates';

const OpenMap: React.FC<{
    field: string;
    entityProperties: IEntity['properties'];
    entityTemplate: IMongoEntityTemplatePopulated | IMongoChildTemplatePopulated;
    showText?: boolean;
    searchValue?: string;
    disableOpenMap?: boolean;
    color?: string;
}> = ({ field, entityProperties, entityTemplate, showText = true, searchValue, disableOpenMap, color }) => {
    const [open, setOpen] = useState(false);
    const workspace = useWorkspaceStore((state) => state.workspace);
    const { headlineSubTitleFontSize } = workspace.metadata.mainFontSizes;
    const handleButtonClick = async () => {
        setOpen(true);
    };

    return (
        <Grid>
            <Grid style={{ overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '100%' }}>
                <IconButton
                    sx={{ borderRadius: 10, maxWidth: '100%' }}
                    onClick={(e) => {
                        if (disableOpenMap) return;
                        e.stopPropagation();
                        handleButtonClick?.();
                    }}
                    disableRipple={disableOpenMap}
                >
                    <LocationOn style={{ height: '18px' }} />
                    {showText && (
                        <Typography
                            color={color}
                            sx={{
                                marginRight: '5px',
                                fontSize: headlineSubTitleFontSize,
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
                    <LocationPreview entityProperties={entityProperties} entityTemplate={entityTemplate} />
                </Dialog>
            )}
        </Grid>
    );
};

export default OpenMap;
