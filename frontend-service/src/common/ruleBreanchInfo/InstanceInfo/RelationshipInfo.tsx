import React, { useState } from 'react';
import { Collapse, Divider, Grid, Typography } from '@mui/material';
import { ExpandLess as ExpandLessIcon, ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { useQueryClient } from 'react-query';
import { IEntity } from '../../../interfaces/entities';
import { environment } from '../../../globals';
import {
    ActionTypes,
    IActionPopulated,
    ICreateEntityMetadataPopulated,
    ICreateRelationshipMetadataPopulated,
    IDuplicateEntityMetadataPopulated,
    IUpdateEntityMetadataPopulated,
} from '../../../interfaces/ruleBreaches/actionMetadata';
import { RelationshipTitle } from '../../RelationshipTitle';
import { IMongoRelationshipTemplatePopulated, IRelationshipTemplateMap } from '../../../interfaces/relationshipTemplates';
import { IEntityTemplateMap, IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { EntityPropertiesInternal } from '../../EntityProperties';
import { EntityTemplateColor } from '../../EntityTemplateColor';
import { getEntityTemplateColor } from '../../../utils/colors';

interface RelationshipInfoProps {
    relationship: IEntity | string | null;
    actions: IActionPopulated[];
}

export const RelationshipInfo: React.FC<RelationshipInfoProps> = ({ relationship, actions }) => {
    const [open, setOpen] = useState(false);

    const queryClient = useQueryClient();

    let relationshipTemplateId: string | null = null;

    let rel: IMongoRelationshipTemplatePopulated | null = null;

    const relationshipTemplates = queryClient.getQueryData<IRelationshipTemplateMap>('getRelationshipTemplates')!;
    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;

    const getFullEntity = (entity: IEntity | string | null): IMongoEntityTemplatePopulated => {
        if (!entity) {
            return {
                _id: 'empty',
                properties: {
                    hide: [],
                    properties: {},
                    required: [],
                    type: 'object',
                },
                category: { _id: 'empty', color: 'empty', displayName: 'empty', name: 'empty' },
                disabled: false,
                displayName: 'empty',
                name: 'empty',
                propertiesOrder: [],
                propertiesPreview: [],
                propertiesTypeOrder: [],
                uniqueConstraints: [],
            };
        }
        if (typeof entity === 'string' && entity.startsWith(environment.brokenRulesFakeEntityIdPrefix)) {
            // The id structure is '$numberPart._id' so the slice(1,-4) is in order to cut the '$' in the beginning,
            // and the '._id' in the end
            const numberPart = entity.slice(1, -4);
            const actionIndex = Number(numberPart) < actions.length ? Number(numberPart) : 0;
            const { templateId, properties } = actions[actionIndex].actionMetadata as
                | ICreateEntityMetadataPopulated
                | IDuplicateEntityMetadataPopulated;

            let mergedProperties = { ...properties };

            // if the created entity updated by actions- show the updated properties
            actions.forEach((currentAction) => {
                if (
                    currentAction.actionType === ActionTypes.UpdateEntity &&
                    (currentAction.actionMetadata as IUpdateEntityMetadataPopulated).entity?.properties._id === properties._id
                ) {
                    const { updatedFields } = currentAction.actionMetadata as IUpdateEntityMetadataPopulated;

                    mergedProperties = {
                        ...properties,
                        ...updatedFields,
                    };
                }
            });

            const entityTemplate = entityTemplates.get(templateId)!;

            return {
                _id: entityTemplate._id,
                properties: {
                    hide: [],
                    properties: mergedProperties,
                    required: [],
                    type: 'object',
                },
                category: entityTemplate.category,
                disabled: false,
                displayName: entityTemplate.displayName,
                name: entityTemplate.name,
                propertiesOrder: [],
                propertiesPreview: [],
                propertiesTypeOrder: [],
                uniqueConstraints: [],
            };
        }

        const entityToPopulate: IEntity = entity as IEntity;
        const entityTemplate = entityTemplates.get(entityToPopulate.templateId)!;

        return {
            _id: entityTemplate._id,
            properties: {
                hide: [],
                properties: entityToPopulate.properties,
                required: [],
                type: 'object',
            },
            category: entityTemplate.category,
            disabled: false,
            displayName: entityTemplate.displayName,
            name: entityTemplate.name,
            propertiesOrder: [],
            propertiesPreview: [],
            propertiesTypeOrder: [],
            uniqueConstraints: [],
        };
    };

    console.log({ relationshipTemplates });

    if (typeof relationship === 'string' && relationship.startsWith(environment.brokenRulesFakeEntityIdPrefix)) {
        // The id structure is '$numberPart._id' so the slice(1,-4) is in order to cut the '$' in the beginning,
        // and the '._id' in the end
        const numberPart = relationship.slice(1, -4);
        const actionIndex = Number(numberPart) < actions.length ? Number(numberPart) : 0;

        const actionMetadata: ICreateRelationshipMetadataPopulated = actions[actionIndex]
            .actionMetadata as unknown as ICreateRelationshipMetadataPopulated;

        console.log({ actionMetadata });

        relationshipTemplateId = actionMetadata.relationshipTemplateId;

        const relationshipTemplate = relationshipTemplates.get(relationshipTemplateId)!;

        console.log({ relationshipTemplate });

        rel = {
            _id: 'temp',
            sourceEntity: getFullEntity(actionMetadata.sourceEntity),
            destinationEntity: getFullEntity(actionMetadata.destinationEntity),
            name: relationshipTemplate.name,
            displayName: relationshipTemplate.displayName,
            createdAt: relationshipTemplate.createdAt,
            updatedAt: relationshipTemplate.updatedAt,
        };
    }

    console.log({ rel });

    const header = rel ? <RelationshipTitle relationshipTemplate={rel} /> : <Grid />;

    const entityHeader = (templateId: string) => {
        const entityTemplate = templateId ? entityTemplates.get(templateId) : null;

        const entityTemplateColor = entityTemplate ? getEntityTemplateColor(entityTemplate) : '';
        return (
            <Grid item container gap="20px">
                <Grid item>
                    <EntityTemplateColor entityTemplateColor={entityTemplateColor} style={{ height: '20px' }} />
                </Grid>
                <Grid item>
                    <Typography
                        style={{
                            fontSize: environment.mainFontSizes.headlineSubTitleFontSize,
                            color: '#101440',
                            fontWeight: '400',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            width: '130px',
                        }}
                    >
                        {entityTemplate?.displayName || ''}
                    </Typography>
                </Grid>
            </Grid>
        );
    };

    return (
        <Grid container onClick={() => setOpen((prev) => !prev)}>
            <Grid item paddingTop="8px">
                {open ? (
                    <ExpandLessIcon style={{ color: '#787C9E', width: '20px', height: '20px' }} />
                ) : (
                    <ExpandMoreIcon style={{ color: '#787C9E', width: '20px', height: '20px' }} />
                )}
            </Grid>
            <Grid
                item
                container
                alignItems="center"
                paddingLeft="20px"
                paddingTop="10px"
                paddingBottom="10px"
                gap="5px"
                style={{ backgroundColor: '#FFFFFF', borderRadius: '10px', width: 'fit-content', maxWidth: '90%' }}
            >
                {header}
                <Collapse in={open} timeout="auto" unmountOnExit>
                    <Grid container item gap="20px">
                        <Divider orientation="horizontal" style={{ width: '95%', alignSelf: 'center' }} />
                        <Grid item>
                            {entityHeader(rel?.sourceEntity._id || '')}
                            {rel?.sourceEntity && (
                                <EntityPropertiesInternal
                                    properties={{
                                        ...rel?.sourceEntity.properties.properties,
                                        _id: rel?.sourceEntity._id,
                                        createdAt: new Date().toISOString(),
                                        updatedAt: new Date().toISOString(),
                                        disabled: false,
                                    }}
                                    entityTemplate={entityTemplates.get(rel?.sourceEntity._id)!}
                                    style={{
                                        flexDirection: 'row',
                                        flexWrap: 'wrap',
                                        rowGap: '20px',
                                        columnGap: '20px',
                                        alignItems: 'center',
                                        width: '100%',
                                    }}
                                    innerStyle={{ width: '32%' }}
                                    showPreviewPropertiesOnly
                                    textWrap
                                    mode="normal"
                                />
                            )}
                        </Grid>
                        <Grid item>
                            {entityHeader(rel?.destinationEntity._id || '')}
                            {rel?.destinationEntity && (
                                <EntityPropertiesInternal
                                    properties={{
                                        ...rel?.destinationEntity.properties.properties,
                                        _id: rel?.destinationEntity._id,
                                        createdAt: new Date().toISOString(),
                                        updatedAt: new Date().toISOString(),
                                        disabled: false,
                                    }}
                                    entityTemplate={entityTemplates.get(rel?.destinationEntity._id)!}
                                    style={{
                                        flexDirection: 'row',
                                        flexWrap: 'wrap',
                                        rowGap: '20px',
                                        columnGap: '20px',
                                        alignItems: 'center',
                                        width: '100%',
                                    }}
                                    innerStyle={{ width: '32%' }}
                                    showPreviewPropertiesOnly
                                    textWrap
                                    mode="normal"
                                />
                            )}
                        </Grid>
                    </Grid>
                </Collapse>
            </Grid>
        </Grid>
    );
};
