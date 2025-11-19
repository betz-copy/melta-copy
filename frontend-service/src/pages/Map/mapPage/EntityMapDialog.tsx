import { AppRegistration as DefaultEntityTemplateIcon } from '@mui/icons-material';
import { Box, Dialog, Grid, Typography } from '@mui/material';
import i18next from 'i18next';
import { useQueryClient } from 'react-query';
import { useLocation } from 'wouter';
import { CustomIcon } from '../../../common/CustomIcon';
import { EntityProperties } from '../../../common/EntityProperties';
import FlexBox from '../../../common/FlexBox';
import IconButtonWithPopover from '../../../common/IconButtonWithPopover';
import { IEntity } from '../../../interfaces/entities';
import { IEntityTemplateMap } from '../../../interfaces/entityTemplates';
import { useWorkspaceStore } from '../../../stores/workspace';
import { getEntityTemplateColor } from '../../../utils/colors';

type props = {
    open: boolean;
    onClose: () => void;
    entityWithMatchingField: { node: IEntity; matchingField: string };
};

const EntityMapDialog = ({ open, onClose, entityWithMatchingField }: props) => {
    const [_, navigate] = useLocation();
    const queryClient = useQueryClient();
    const workspace = useWorkspaceStore((state) => state.workspace);
    const { height, width } = workspace.metadata.iconSize;

    const entityTemplateMap = queryClient.getQueryData<IEntityTemplateMap>(['getEntityTemplates']);

    const entityTemplate = entityTemplateMap!.get(entityWithMatchingField.node.templateId)!;
    const entityTemplateColor = getEntityTemplateColor(entityTemplate);

    const locationField = entityWithMatchingField.matchingField.slice(0, -37);
    const locationFieldTitle = entityTemplate.properties.properties[locationField].title;

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
                        ({`${i18next.t('wizard.processTemplate.field')} ${locationFieldTitle}`})
                    </Typography>
                </Box>
                <IconButtonWithPopover popoverText={i18next.t('entitiesTableOfTemplate.navigateToEntityPage')}>
                    <FlexBox onClick={() => navigate(`/entity/${entityWithMatchingField.node.properties._id}`)}>
                        <img src="/icons/read-more-icon.svg" alt="readMore" />
                    </FlexBox>
                </IconButtonWithPopover>
            </Box>
            <Grid size={{ xs: 8 }} container alignItems="center" padding="20px">
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
                    coloredFields={entityWithMatchingField.node.coloredFields}
                />
            </Grid>
        </Dialog>
    );
};

export default EntityMapDialog;
