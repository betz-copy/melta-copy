import React, { CSSProperties } from 'react';
import { Grid, tooltipClasses, useTheme, Typography } from '@mui/material';
import { useQueryClient } from 'react-query';
import { AppRegistration as DefaultEntityTemplateIcon } from '@mui/icons-material';
import { Link } from 'wouter';
import i18next from 'i18next';
import { IEntity, IEntityTemplateMap, IMongoEntityTemplatePopulated } from '@microservices/shared';
import { MeltaTooltip } from './MeltaTooltip';
import { EntityPropertiesInternal } from './EntityProperties';
import { CustomIcon } from './CustomIcon';
import { environment } from '../globals';
import { getEntityTemplateColor } from '../utils/colors';
import { ColoredEnumChip } from './ColoredEnumChip';

interface RelationshipReferenceViewProps {
    entity: IEntity | string;
    relatedTemplateId: string;
    relatedTemplateField: string;
    style?: CSSProperties;
    searchValue?: string;
}
const RelationshipReferenceView: React.FC<RelationshipReferenceViewProps> = ({ entity, relatedTemplateId, relatedTemplateField, searchValue }) => {
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
                        searchValue={searchValue}
                    />
                </Grid>
            </Link>
        </MeltaTooltip>
    );
};

export default RelationshipReferenceView;
