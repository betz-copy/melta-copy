import React, { Fragment, useMemo } from 'react';
import { useQueryClient } from 'react-query';
import { Grid, Typography } from '@mui/material';
import { IScheduleComponentData } from '../../../interfaces/syncfusion';
import { IEntityTemplateMap } from '../../../interfaces/entityTemplates';
import { getConnectedEntityDetails } from '../../../utils/gantts';
import { IRelationshipTemplateMap } from '../../../interfaces/relationshipTemplates';
import { FieldsDisplay } from './FieldsDisplay';
import { environment } from '../../../globals';

const { ganttSettings } = environment;

type GanttEventProps = IScheduleComponentData & { expanded?: boolean };

export const GanttEvent: React.FC<GanttEventProps> = ({ entityWithConnections: { entity, relationships }, ganttItem, expanded }) => {
    const queryClient = useQueryClient();

    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;
    const relationshipTemplates = queryClient.getQueryData<IRelationshipTemplateMap>('getRelationshipTemplates')!;

    const { connectedEntityTemplate, connectedEntityTemplateColor } = useMemo(
        () => getConnectedEntityDetails(ganttItem, entityTemplates, relationshipTemplates),
        [ganttItem, entityTemplates, relationshipTemplates],
    );

    const entityTemplate = entityTemplates.get(entity.templateId);
    if (!entityTemplate) return null;

    return (
        <Grid container alignItems="center" width="100%" spacing={0.5} marginLeft={0} marginTop="-0.4rem" direction={expanded ? 'column' : 'row'}>
            {expanded && (
                <Grid item>
                    <Typography fontWeight="bold" color="white" fontSize={18}>
                        {entityTemplate.displayName}
                    </Typography>
                </Grid>
            )}

            <FieldsDisplay fields={ganttItem.entityTemplate.fieldsToShow} entity={entity} entityTemplate={entityTemplate} expanded={expanded} />

            {Boolean(relationships?.length) && ganttItem.connectedEntityTemplate && connectedEntityTemplate && (
                <>
                    <Grid item>
                        <Typography fontSize={14} fontWeight="bold" color="white">
                            {ganttSettings.separators.template}
                        </Typography>
                    </Grid>

                    {expanded && (
                        <Grid item>
                            <Typography fontWeight="bold" color="white" fontSize={18}>
                                {connectedEntityTemplate.displayName}
                            </Typography>
                        </Grid>
                    )}

                    {relationships!.map((relationship, index) => (
                        <Fragment key={relationship.otherEntity.properties._id}>
                            {Boolean(index) && (
                                <Grid item>
                                    <Typography fontWeight="bold" color="white" fontSize={7}>
                                        {ganttSettings.separators.entity}
                                    </Typography>
                                </Grid>
                            )}

                            <FieldsDisplay
                                fields={ganttItem.connectedEntityTemplate!.fieldsToShow}
                                entity={relationship.otherEntity}
                                entityTemplate={connectedEntityTemplate}
                                underlineColor={expanded ? undefined : connectedEntityTemplateColor}
                                expanded={expanded}
                            />
                        </Fragment>
                    ))}
                </>
            )}
        </Grid>
    );
};
