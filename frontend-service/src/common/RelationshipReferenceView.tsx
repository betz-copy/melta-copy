import React, { CSSProperties } from 'react';
import { Grid, tooltipClasses, useTheme, Typography } from '@mui/material';
import { useQueryClient } from 'react-query';
import { AppRegistration as DefaultEntityTemplateIcon } from '@mui/icons-material';
import { Link } from 'wouter';
import i18next from 'i18next';
import { MeltaTooltip } from './MeltaTooltip';
import { IEntityTemplateMap, IMongoEntityTemplatePopulated } from '../interfaces/entityTemplates';
import { EntityPropertiesInternal } from './EntityProperties';
import { CustomIcon } from './CustomIcon';
import { getEntityTemplateColor } from '../utils/colors';
import { ColoredEnumChip } from './ColoredEnumChip';
import { IEntity } from '../interfaces/entities';
import { useWorkspaceStore } from '../stores/workspace';

interface RelationshipReferenceViewProps {
    entity: IEntity | string;
    relatedTemplateId: string;
    relatedTemplateField: string;
    style?: CSSProperties;
    searchValue?: string;
}
const RelationshipReferenceView: React.FC<RelationshipReferenceViewProps> = ({ entity, relatedTemplateId, relatedTemplateField, searchValue }) => {
    const workspace = useWorkspaceStore((state) => state.workspace);
    const { height, width } = workspace.metadata.iconSize;
    const queryClient = useQueryClient();

    const theme = useTheme();

    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;

    const relatedEntityTemplate: IMongoEntityTemplatePopulated = entityTemplates.get(relatedTemplateId!)!;
    const entityTemplateColor = getEntityTemplateColor(relatedEntityTemplate);

    if (typeof entity === 'string') {
        return (
            <Grid display="inline-block">
                <ColoredEnumChip
                    key={entity}
                    label={entity}
                    color={entityTemplateColor}
                    icon={
                        relatedEntityTemplate.iconFileId ? (
                            <CustomIcon iconUrl={relatedEntityTemplate.iconFileId} height={height} width={width} color={theme.palette.primary.main} />
                        ) : (
                            <DefaultEntityTemplateIcon
                                sx={{
                                    color: theme.palette.primary.main,
                                    height: workspace.metadata.iconSize.height,
                                    width: workspace.metadata.iconSize.width,
                                }}
                            />
                        )
                    }
                />
            </Grid>
        );
    }

    return (
        <MeltaTooltip
            PopperProps={{
                sx: {
                    [`& .${tooltipClasses.tooltip}`]: {
                        fontSize: '1rem',
                        color: '#F2F4FA',
                        backgroundColor: '#F2F4FA !important',
                        boxShadow: 10,
                    },
                },
            }}
            slotProps={{
                arrow: { style: { color: '#F2F4FA' } },
            }}
            arrow
            placement="top"
            title={
                relatedEntityTemplate.propertiesPreview.length === 0 ? (
                    <Typography color="primary">{i18next.t('templateEntitiesAutocomplete.noPreviewFields')}</Typography>
                ) : (
                    <EntityPropertiesInternal
                        properties={entity.properties}
                        entityTemplate={relatedEntityTemplate}
                        showPreviewPropertiesOnly
                        mode="normal"
                        textWrap
                    />
                )
            }
        >
            <Link
                href={`/entity/${entity.properties._id}`}
                style={{ color: theme.palette.primary.main, textDecoration: 'inherit', fontWeight: 'bold' }}
            >
                <Grid display="inline-block">
                    <ColoredEnumChip
                        key={entity.properties[relatedTemplateField]}
                        label={entity.properties[relatedTemplateField]}
                        color={entityTemplateColor}
                        icon={
                            relatedEntityTemplate.iconFileId ? (
                                <CustomIcon
                                    iconUrl={relatedEntityTemplate.iconFileId}
                                    height={workspace.metadata.iconSize.height}
                                    width={workspace.metadata.iconSize.width}
                                    color={theme.palette.primary.main}
                                />
                            ) : (
                                <DefaultEntityTemplateIcon
                                    sx={{
                                        color: theme.palette.primary.main,
                                        height: workspace.metadata.iconSize.height,
                                        width: workspace.metadata.iconSize.width,
                                    }}
                                />
                            )
                        }
                        searchValue={searchValue}
                    />
                </Grid>
            </Link>
        </MeltaTooltip>
    );
};

export default RelationshipReferenceView;
