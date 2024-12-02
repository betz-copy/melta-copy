import React from 'react';
import { Box, Dialog, Grid, Typography, useTheme } from '@mui/material';
import { useQueryClient } from 'react-query';
import { IEntity } from '../../../interfaces/entities';
import { IEntityTemplateMap } from '../../../interfaces/entityTemplates';
import { EntityProperties } from '../../../common/EntityProperties';
import { CustomIcon } from '../../../common/CustomIcon';
import { environment } from '../../../globals';
import { template } from 'lodash';
import { getEntityTemplateColor } from '../../../utils/colors';
import IconButtonWithPopover from '../../../common/IconButtonWithPopover';

type props = {
    open: boolean;
    onClose: () => void;
    entity: IEntity;
};

const MapPageEntityDialog = ({ open, onClose, entity }: props) => {
    const queryClient = useQueryClient();
    const entityTemplateMap = queryClient.getQueryData<IEntityTemplateMap>(['getEntityTemplates']);
    const theme = useTheme();

    const entityTemplate = entityTemplateMap!.get(entity.templateId)!;
    const entityTemplateColor = getEntityTemplateColor(entityTemplate);

    console.log(entityTemplate);

    return (
        <Dialog open={open} onClose={onClose}>
            <Box display="flex" justifyContent="space-between">
                <Box padding={1} display="flex" gap="10px" alignItems="center">
                    <CustomIcon
                        iconUrl={entityTemplate.iconFileId!}
                        height={environment.iconSize.height}
                        width={environment.iconSize.width}
                        color={entityTemplateColor}
                    />
                    <Typography fontSize="20px" fontWeight="bold">
                        {entityTemplate.displayName}
                    </Typography>
                </Box>
                <IconButtonWithPopover />

                {/* icon: '/icons/read-more-icon.svg',
                action: () => {
                    navigate(`/entity/${entity.properties._id}`);
                },
                popoverText: i18next.t('wizard.entity.readMore'), */}
            </Box>
            <Grid item xs={8} container paddingLeft="4px" paddingBottom="14px" height="fit-content" minHeight="37px" alignItems="center">
                <EntityProperties
                    entityTemplate={entityTemplate}
                    properties={entity.properties}
                    mode="normal"
                    style={{
                        display: 'flex',
                        flexDirection: 'row',
                        flexWrap: 'wrap',
                        rowGap: '14px',
                        marginRight: '1rem',
                        paddingTop: '10px',
                        alignItems: 'center',
                        width: '100%',
                    }}
                    viewFirstLineOfLongText
                />
            </Grid>
        </Dialog>
    );
};

export default MapPageEntityDialog;
