import { AppRegistration as DefaultEntityTemplateIcon, VisibilityOff } from '@mui/icons-material';
import { Grid, tooltipClasses, Typography, useTheme } from '@mui/material';
import i18next from 'i18next';
import React, { CSSProperties } from 'react';
import { useQueryClient } from 'react-query';
import { Link } from 'wouter';
import { IEntity } from '../interfaces/entities';
import { IEntityTemplateMap, IMongoEntityTemplatePopulated } from '../interfaces/entityTemplates';
import { useWorkspaceStore } from '../stores/workspace';
import { getEntityTemplateColor } from '../utils/colors';
import { locationConverterToString } from '../utils/map/convert';
import { ColoredEnumChip } from './ColoredEnumChip';
import { CustomIcon } from './CustomIcon';
import { EntityPropertiesInternal } from './EntityProperties';
import { CoordinateSystem } from './inputs/JSONSchemaFormik/RjsfLocationWidget';
import MeltaTooltip from './MeltaDesigns/MeltaTooltip';
interface RelationshipReferenceViewProps {
    entity: IEntity | string;
    relatedTemplateId: string;
    relatedTemplateField: string;
    style?: CSSProperties;
    searchValue?: string;
    color?: string;
}
const RelationshipReferenceView: React.FC<RelationshipReferenceViewProps> = ({
    entity,
    relatedTemplateId,
    relatedTemplateField,
    searchValue,
    color,
}) => {
    const workspace = useWorkspaceStore((state) => state.workspace);
    const { height, width } = workspace.metadata.iconSize;
    const queryClient = useQueryClient();
    const theme = useTheme();

    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;

    const relatedEntityTemplate: IMongoEntityTemplatePopulated = entityTemplates.get(relatedTemplateId!)!;
    const entityTemplateColor = relatedEntityTemplate ? getEntityTemplateColor(relatedEntityTemplate) : undefined;

    if (!relatedEntityTemplate) {
        return (
            <Grid container alignItems="center" justifyContent="flex-start" height="100%" paddingTop={1.5}>
                <MeltaTooltip
                    slotProps={{
                        popper: {
                            sx: {
                                [`& .${tooltipClasses.tooltip}`]: {
                                    fontSize: '1rem',
                                    color: '#F2F4FA',
                                    backgroundColor: '#F2F4FA !important',
                                    boxShadow: 10,
                                },
                            },
                        },
                        arrow: { style: { color: '#F2F4FA' } },
                    }}
                    arrow
                    placement="top"
                    title={<Typography color="primary">{i18next.t('templateEntitiesAutocomplete.noWritePermissions')}</Typography>}
                >
                    <VisibilityOff sx={{ height, width, color: theme.palette.action.disabled }} />
                </MeltaTooltip>
            </Grid>
        );
    }

    if (typeof entity === 'string') {
        return (
            <Grid display="inline-block" overflow={'hidden'} textOverflow={'ellipsis'}>
                <ColoredEnumChip
                    key={entity}
                    label={entity}
                    color={color ?? entityTemplateColor}
                    icon={
                        relatedEntityTemplate.iconFileId ? (
                            <CustomIcon iconUrl={relatedEntityTemplate.iconFileId} height={height} width={width} color={theme.palette.primary.main} />
                        ) : (
                            <DefaultEntityTemplateIcon
                                sx={{
                                    color: theme.palette.primary.main,
                                    height,
                                    width,
                                }}
                            />
                        )
                    }
                />
            </Grid>
        );
    }

    const relationshipObjectToField = (): string => {
        if (relatedEntityTemplate.properties.properties[relatedTemplateField].format === 'location') {
            return entity.properties[`${relatedTemplateField}_coordinateSystem`] === CoordinateSystem.UTM
                ? (locationConverterToString(entity.properties[relatedTemplateField].location, CoordinateSystem.WGS84, CoordinateSystem.UTM) ?? '')
                : entity.properties[relatedTemplateField].location;
        }

        if (relatedEntityTemplate.properties.properties[relatedTemplateField].format === 'user') {
            const userProperty = entity.properties[relatedTemplateField];
            try {
                return JSON.parse(userProperty).fullName;
            } catch {
                return userProperty.fullName;
            }
        }

        if (
            relatedEntityTemplate.properties.properties[relatedTemplateField].type === 'array' &&
            relatedEntityTemplate.properties.properties[relatedTemplateField]?.items?.format === 'user'
        ) {
            const usersProperty = entity.properties[relatedTemplateField];
            if (Array.isArray(usersProperty)) {
                return entity.properties[relatedTemplateField].map((user) => JSON.parse(user).fullName).join(', ');
            }

            return usersProperty.fullNames.join(', ');
        }

        return entity?.properties[relatedTemplateField] ?? entity;
    };

    const field = relationshipObjectToField();

    return (
        <Grid>
            <MeltaTooltip
                slotProps={{
                    popper: {
                        sx: {
                            [`& .${tooltipClasses.tooltip}`]: {
                                fontSize: '1rem',
                                color: '#F2F4FA',
                                backgroundColor: '#F2F4FA !important',
                                boxShadow: 10,
                            },
                        },
                    },
                    arrow: { style: { color: '#F2F4FA' } },
                }}
                arrow
                placement="top"
                title={
                    relatedEntityTemplate.propertiesPreview.length === 0 ? (
                        <Typography color="#53566E">{i18next.t('templateEntitiesAutocomplete.noPreviewFields')}</Typography>
                    ) : (
                        <EntityPropertiesInternal
                            properties={entity.properties}
                            coloredFields={entity.coloredFields}
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
                    <Grid display="inline-block" overflow={'hidden'} textOverflow={'ellipsis'} width={'100%'}>
                        <ColoredEnumChip
                            key={field}
                            label={field}
                            color={entityTemplateColor}
                            icon={
                                relatedEntityTemplate.iconFileId ? (
                                    <CustomIcon
                                        iconUrl={relatedEntityTemplate.iconFileId}
                                        height={height}
                                        width={width}
                                        color={theme.palette.primary.main}
                                    />
                                ) : (
                                    <DefaultEntityTemplateIcon
                                        sx={{
                                            color: theme.palette.primary.main,
                                            height,
                                            width,
                                        }}
                                    />
                                )
                            }
                            searchValue={searchValue}
                        />
                    </Grid>
                </Link>
            </MeltaTooltip>
        </Grid>
    );
};

export default RelationshipReferenceView;
