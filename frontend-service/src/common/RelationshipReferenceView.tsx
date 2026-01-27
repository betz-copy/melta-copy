import { AppRegistration as DefaultEntityTemplateIcon } from '@mui/icons-material';
import { Grid, Typography, tooltipClasses, useTheme } from '@mui/material';
import { IEntity } from '@packages/entity';
import { IMongoEntityTemplateWithConstraintsPopulated } from '@packages/entity-template';
import { CoordinateSystem } from '@packages/map';
import { IGetUnits } from '@packages/unit';
import i18next from 'i18next';
import React, { CSSProperties } from 'react';
import { useQueryClient } from 'react-query';
import { Link } from 'wouter';
import { IChildTemplateMap, IEntityTemplateMap } from '../interfaces/template';
import { useUserStore } from '../stores/user';
import { useWorkspaceStore } from '../stores/workspace';
import { isEntityFitsToChildTemplate } from '../utils/childTemplates';
import { getEntityTemplateColor } from '../utils/colors';
import { locationConverterToString } from '../utils/map/convert';
import { isWorkspaceAdmin } from '../utils/permissions/instancePermissions';
import { ColoredEnumChip } from './ColoredEnumChip';
import { CustomIcon } from './CustomIcon';
import { EntityPropertiesInternal } from './EntityProperties';
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
    const currentUser = useUserStore((state) => state.user);
    const currentUserKartoffelId = currentUser?.kartoffelId;

    const { height, width } = workspace.metadata.iconSize;
    const queryClient = useQueryClient();
    const theme = useTheme();

    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;
    const allowedChildTemplates = queryClient.getQueryData<IChildTemplateMap>('getChildTemplates')!;
    const childTemplatesOfRelatedTemplate =
        Array.from(allowedChildTemplates.values()).filter((child) => child.parentTemplate._id === relatedTemplateId) ?? [];

    const units = queryClient.getQueryData<IGetUnits>('getUnits')!;

    const template = entityTemplates.get(relatedTemplateId);
    const relatedTemplate = template ?? childTemplatesOfRelatedTemplate[0]?.parentTemplate;
    const entityTemplateColor = relatedTemplate ? getEntityTemplateColor(relatedTemplate as IMongoEntityTemplateWithConstraintsPopulated) : undefined;

    const adjustedChildTemplate = childTemplatesOfRelatedTemplate.find((child) =>
        isEntityFitsToChildTemplate(
            child,
            !template,
            entity,
            currentUserKartoffelId,
            currentUser.usersUnitsWithInheritance,
            isWorkspaceAdmin(currentUser?.permissions?.[workspace._id]),
        ),
    );

    const templateToInternal = React.useMemo(() => template ?? adjustedChildTemplate, [template, adjustedChildTemplate]);

    if (typeof entity === 'string' || typeof entity === 'number')
        return (
            <Grid display="inline-block" overflow={'hidden'} textOverflow={'ellipsis'}>
                <ColoredEnumChip
                    key={entity}
                    label={entity}
                    enumColor={color ?? entityTemplateColor}
                    icon={
                        relatedTemplate?.iconFileId ? (
                            <CustomIcon iconUrl={relatedTemplate.iconFileId} height={height} width={width} color={theme.palette.primary.main} />
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
                    color={color}
                />
            </Grid>
        );

    const relationshipObjectToField = (): string => {
        if (relatedTemplate?.properties.properties[relatedTemplateField].format === 'unitField')
            return units.find((unit) => unit._id === entity.properties[relatedTemplateField])?.name ?? '';

        if (relatedTemplate?.properties.properties[relatedTemplateField].format === 'location') {
            return entity.properties[`${relatedTemplateField}_coordinateSystem`] === CoordinateSystem.UTM
                ? (locationConverterToString(entity.properties[relatedTemplateField].location, CoordinateSystem.WGS84, CoordinateSystem.UTM) ?? '')
                : entity.properties[relatedTemplateField].location;
        }

        if (relatedTemplate?.properties.properties[relatedTemplateField].format === 'user') {
            const userProperty = entity.properties[relatedTemplateField];
            try {
                return JSON.parse(userProperty).fullName;
            } catch {
                return userProperty.fullName;
            }
        }

        if (
            relatedTemplate?.properties.properties[relatedTemplateField].type === 'array' &&
            relatedTemplate?.properties.properties[relatedTemplateField]?.items?.format === 'user'
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

    const chip = (
        <Grid display="inline-block" overflow={'hidden'} textOverflow={'ellipsis'} width={'100%'}>
            <ColoredEnumChip
                key={field}
                label={field}
                enumColor={entityTemplateColor}
                icon={
                    relatedTemplate?.iconFileId ? (
                        <CustomIcon iconUrl={relatedTemplate?.iconFileId} height={height} width={width} color={theme.palette.primary.main} />
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
                color={color}
                searchValue={searchValue}
            />
        </Grid>
    );

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
                    !templateToInternal || !relatedTemplate?.propertiesPreview.length ? (
                        <Typography color="#53566E">{i18next.t('templateEntitiesAutocomplete.noPreviewFields')}</Typography>
                    ) : (
                        <EntityPropertiesInternal
                            properties={entity.properties}
                            coloredFields={entity.coloredFields}
                            entityTemplate={templateToInternal}
                            showPreviewPropertiesOnly
                            mode="normal"
                            textWrap
                        />
                    )
                }
            >
                {!template ? (
                    chip
                ) : (
                    <Link
                        href={`/entity/${entity.properties._id}${!template ? `?childTemplateId=${adjustedChildTemplate?._id}` : ''}`}
                        style={{
                            color: theme.palette.primary.main,
                            textDecoration: 'inherit',
                            fontWeight: 'bold',
                        }}
                    >
                        {chip}
                    </Link>
                )}
            </MeltaTooltip>
        </Grid>
    );
};

export default RelationshipReferenceView;
