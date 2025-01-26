import React from 'react';
import { Box, Dialog, Grid, Typography } from '@mui/material';
import { useQueryClient } from 'react-query';
import { AppRegistration as DefaultEntityTemplateIcon } from '@mui/icons-material';
import i18next from 'i18next';
import { useLocation } from 'wouter';
import { IEntity } from '../../../interfaces/entities';
import { IEntityTemplateMap } from '../../../interfaces/entityTemplates';
import { EntityProperties } from '../../../common/EntityProperties';
import { CustomIcon } from '../../../common/CustomIcon';
import { getEntityTemplateColor } from '../../../utils/colors';
import IconButtonWithPopover from '../../../common/IconButtonWithPopover';
import FlexBox from '../../../common/FlexBox';
import { useWorkspaceStore } from '../../../stores/workspace';

type props = {
    open: boolean;
    onClose: () => void;
    entityWithMatchingField: { node: IEntity; matchingField: string };
};

const MapPageEntityDialog = ({ open, onClose, entityWithMatchingField }: props) => {
    const [_, navigate] = useLocation();
    const queryClient = useQueryClient();
    const workspace = useWorkspaceStore((state) => state.workspace);
    const { height, width } = workspace.metadata.iconSize;

    const entityTemplateMap = queryClient.getQueryData<IEntityTemplateMap>(['getEntityTemplates']);

    const entityTemplate = entityTemplateMap!.get(entityWithMatchingField.node.templateId)!;
    const entityTemplateColor = getEntityTemplateColor(entityTemplate);

    return (
        <Dialog open={open} onClose={onClose} sx={{ opacity: 0.95 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" padding="10px 20px 0px 20px">
                <Box display="flex" gap="10px" alignItems="center">
                    {entityTemplate.iconFileId ? (
                        <CustomIcon iconUrl={entityTemplate.iconFileId} height={height} width={width} color={entityTemplateColor} />
                    ) : (
                        <DefaultEntityTemplateIcon sx={{ color: entityTemplateColor, height, width }} />
                    )}
                    <Typography fontSize="20px" fontWeight={700}>
                        {entityTemplate.displayName} -
                    </Typography>
                    <Typography fontSize="18px" fontWeight={600}>
                        (
                        {`${i18next.t('wizard.processTemplate.field')} ${
                            entityTemplate.properties.properties[entityWithMatchingField.matchingField].title
                        }`}
                        )
                    </Typography>
                </Box>
                <IconButtonWithPopover popoverText={i18next.t('entitiesTableOfTemplate.navigateToEntityPage')}>
                    <FlexBox onClick={() => navigate(`/entity/${entityWithMatchingField.node.properties._id}`)}>
                        <img src="/icons/read-more-icon.svg" />
                    </FlexBox>
                </IconButtonWithPopover>
            </Box>
            <Grid item xs={8} container alignItems="center" padding="20px">
                <EntityProperties
                    entityTemplate={entityTemplate}
                    properties={entityWithMatchingField.node.properties}
                    mode="normal"
                    style={{
                        display: 'flex',
                        flexDirection: 'row',
                        flexWrap: 'wrap',
                        rowGap: '14px',
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
