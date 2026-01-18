import { LocationOn } from '@mui/icons-material';
import { Dialog, Grid, IconButton } from '@mui/material';
import { IMongoChildTemplateWithConstraintsPopulated } from '@packages/child-template';
import { IEntity } from '@packages/entity';
import { IMongoEntityTemplateWithConstraintsPopulated } from '@packages/entity-template';
import React, { useState } from 'react';
import { useWorkspaceStore } from '../../stores/workspace';
import { HighlightText } from '../../utils/HighlightText';
import LocationPreview from './LocationPreview';

const OpenMap: React.FC<{
    field: string;
    entityProperties: IEntity['properties'];
    entityTemplate: IMongoEntityTemplateWithConstraintsPopulated | IMongoChildTemplateWithConstraintsPopulated;
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
                        <HighlightText
                            text={field}
                            searchedText={searchValue}
                            color={color}
                            sx={{
                                marginRight: '5px',
                                fontSize: headlineSubTitleFontSize,
                                textOverflow: 'ellipsis',
                                overflow: 'hidden',
                                whiteSpace: 'nowrap',
                                maxWidth: '100%',
                            }}
                        />
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
