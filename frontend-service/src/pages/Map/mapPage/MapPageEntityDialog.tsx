import React from 'react';
import { Box, Dialog, Grid, Typography } from '@mui/material';
import { useQueryClient } from 'react-query';
import i18next from 'i18next';
import { useLocation } from 'wouter';
import { IEntity } from '../../../interfaces/entities';
import { IEntityTemplateMap } from '../../../interfaces/entityTemplates';
import { EntityProperties } from '../../../common/EntityProperties';
import { CustomIcon } from '../../../common/CustomIcon';
import { environment } from '../../../globals';
import { getEntityTemplateColor } from '../../../utils/colors';
import IconButtonWithPopover from '../../../common/IconButtonWithPopover';

type props = {
    open: boolean;
    onClose: () => void;
    entityWithMatchingField: { node: IEntity; field: string };
};

const MapPageEntityDialog = ({ open, onClose, entityWithMatchingField }: props) => {
    const [_, navigate] = useLocation();
    const queryClient = useQueryClient();

    const entityTemplateMap = queryClient.getQueryData<IEntityTemplateMap>(['getEntityTemplates']);

    const entityTemplate = entityTemplateMap!.get(entityWithMatchingField.node.templateId)!;
    const entityTemplateColor = getEntityTemplateColor(entityTemplate);

    return (
        <Dialog open={open} onClose={onClose}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box padding={1} display="flex" gap="10px" alignItems="center">
                    <CustomIcon
                        iconUrl={entityTemplate.iconFileId!}
                        height={environment.iconSize.height}
                        width={environment.iconSize.width}
                        color={entityTemplateColor}
                    />
                    <Typography fontSize="20px" fontWeight={700}>
                        {entityTemplate.displayName} -
                    </Typography>
                    <Typography fontSize="18px" fontWeight={600}>
                        ({i18next.t('wizard.processTemplate.field')} {entityTemplate.properties.properties[entityWithMatchingField.field].title})
                    </Typography>
                </Box>
                <IconButtonWithPopover popoverText={i18next.t('entitiesTableOfTemplate.navigateToEntityPage')}>
                    <img src="/icons/read-more-icon.svg" onClick={() => navigate(`/entity/${entityWithMatchingField.node.properties._id}`)} />
                </IconButtonWithPopover>
            </Box>
            <Grid item xs={8} container paddingLeft="4px" paddingBottom="14px" height="fit-content" minHeight="37px" alignItems="center">
                <EntityProperties
                    entityTemplate={entityTemplate}
                    properties={entityWithMatchingField.node.properties}
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
