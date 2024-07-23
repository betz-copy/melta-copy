import React, { CSSProperties } from 'react';
import { Grid, tooltipClasses, useTheme, Typography } from '@mui/material';
import { useQueryClient } from 'react-query';
import { AppRegistration as DefaultEntityTemplateIcon } from '@mui/icons-material';
import { NavLink } from 'react-router-dom';
import i18next from 'i18next';
import { MeltaTooltip } from './MeltaTooltip';
import { IEntityTemplateMap, IMongoEntityTemplatePopulated } from '../interfaces/entityTemplates';
import { EntityPropertiesInternal } from './EntityProperties';
import { CustomIcon } from './CustomIcon';
import { environment } from '../globals';
import { getEntityTemplateColor } from '../utils/colors';
import { ColoredEnumChip } from './ColoredEnumChip';
import { IEntity } from '../interfaces/entities';

interface RelationshipReferenceViewProps {
    entity: IEntity | string;
    relatedTemplateId: string;
    relatedTemplateField: string;
    style?: CSSProperties;
}
const RelationshipReferenceView: React.FC<RelationshipReferenceViewProps> = ({ entity, relatedTemplateId, relatedTemplateField }) => {
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
                            <CustomIcon
                                iconUrl={relatedEntityTemplate.iconFileId}
                                height={environment.iconSize.height}
                                width={environment.iconSize.width}
                                color={theme.palette.primary.main}
                            />
                        ) : (
                            <DefaultEntityTemplateIcon
                                sx={{
                                    color: theme.palette.primary.main,
                                    height: environment.iconSize.height,
                                    width: environment.iconSize.width,
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
            <NavLink
                to={`/entity/${entity.properties._id}`}
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
                                    height={environment.iconSize.height}
                                    width={environment.iconSize.width}
                                    color={theme.palette.primary.main}
                                />
                            ) : (
                                <DefaultEntityTemplateIcon
                                    sx={{
                                        color: theme.palette.primary.main,
                                        height: environment.iconSize.height,
                                        width: environment.iconSize.width,
                                    }}
                                />
                            )
                        }
                    />
                </Grid>
            </NavLink>
        </MeltaTooltip>
    );
};

export default RelationshipReferenceView;
