import React, { useState } from 'react';
import { Collapse, Divider, Grid, Typography } from '@mui/material';
import { ExpandLess as ExpandLessIcon, ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import i18next from 'i18next';
import { useQueryClient } from 'react-query';
import { IEntity } from '../../../interfaces/entities';
import { environment } from '../../../globals';
import { IActionPopulated } from '../../../interfaces/ruleBreaches/actionMetadata';
import { IEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { EntityTemplateColor } from '../../EntityTemplateColor';
import { getEntityTemplateColor } from '../../../utils/colors';
import { EntityPropertiesInternal } from '../../EntityProperties';

interface EntityInfoProps {
    entity: IEntity | null;
    actions: IActionPopulated[];
    entityTemplate: IEntityTemplatePopulated;
}

export const EntityInfo: React.FC<EntityInfoProps> = ({ entity, actions, entityTemplate }) => {
    const [open, setOpen] = useState(false);

    const queryClient = useQueryClient();

    let entityForLink: IEntity | null;

    // const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;

    // if (!entity) {
    //     entityForLink = null;
    // } else if (typeof entity === 'string' && entity.startsWith(environment.brokenRulesFakeEntityIdPrefix)) {
    //     // The id structure is '$numberPart._id' so the slice(1,-4) is in order to cut the '$' in the beginning,
    //     // and the '._id' in the end
    //     const numberPart = entity.slice(1, -4);
    //     const actionIndex = Number(numberPart) < actions.length ? Number(numberPart) : 0;
    //     const { templateId, properties } = actions[actionIndex].actionMetadata as ICreateEntityMetadataPopulated | IDuplicateEntityMetadataPopulated;

    //     let mergedProperties = { ...properties };

    //     // if the created entity updated by actions- show the updated properties
    //     actions.forEach((currentAction) => {
    //         if (
    //             currentAction.actionType === ActionTypes.UpdateEntity &&
    //             (currentAction.actionMetadata as IUpdateEntityMetadataPopulated).entity?.properties._id === properties._id
    //         ) {
    //             const { updatedFields } = currentAction.actionMetadata as IUpdateEntityMetadataPopulated;

    //             mergedProperties = {
    //                 ...properties,
    //                 ...updatedFields,
    //             };
    //         }
    //     });

    //     entityForLink = {
    //         templateId,
    //         properties: {
    //             // if entity wasn't created yet, put generated properties. if it has, it will override
    //             _id: entity,
    //             createdAt: new Date().toISOString(),
    //             updatedAt: new Date().toISOString(),
    //             disabled: false,

    //             ...mergedProperties,
    //         },
    //     };
    // } else {
    //     const updatedProperties = actions.reduce((previousUpdatedProperties, currentAction) => {
    //         if (
    //             currentAction.actionType === ActionTypes.UpdateEntity &&
    //             (currentAction.actionMetadata as IUpdateEntityMetadataPopulated).entity?.properties._id === (entity as IEntity).properties._id
    //         ) {
    //             return {
    //                 ...previousUpdatedProperties,
    //                 ...(currentAction.actionMetadata as IUpdateEntityMetadataPopulated).updatedFields,
    //             };
    //         }
    //         return previousUpdatedProperties;
    //     }, (entity as IEntity).properties);

    //     entityForLink = {
    //         templateId: (entity as IEntity).templateId,
    //         properties: updatedProperties,
    //     };
    // }

    // const entityTemplate = entityForLink?.templateId ? entityTemplates.get(entityForLink.templateId) : null;

    const entityTemplateColor = entityTemplate ? getEntityTemplateColor(entityTemplate) : '';

    const header = (
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

    const entityPropertiesTooltip =
        // eslint-disable-next-line no-nested-ternary
        !entityTemplate || !entity ? (
            ''
        ) : !entityTemplate.propertiesPreview.length ? (
            i18next.t('graph.noPreviewProperties')
        ) : (
            <EntityPropertiesInternal
                properties={entity.properties}
                entityTemplate={entityTemplate}
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
        );

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
                        <Grid item>{header}</Grid>
                        <Grid item>{entityPropertiesTooltip}</Grid>
                    </Grid>
                </Collapse>
            </Grid>
        </Grid>
    );
};
