import React, { useMemo } from 'react';
import { IScheduleComponentData } from '../../../interfaces/syncfusion';
import { useQueryClient } from 'react-query';
import { IEntityTemplateMap } from '../../../interfaces/entityTemplates';
import { getConnectedEntityDetails } from '../../../utils/gantts';
import { IRelationshipTemplateMap } from '../../../interfaces/relationshipTemplates';
import { FieldsDisplay } from './FieldsDisplay';
import { Grid, Typography } from '@mui/material';
import { environment } from '../../../globals';

const { ganttSettings } = environment;

type GanttEventProps = IScheduleComponentData & { expanded?: boolean };

export const GanttEvent: React.FC<GanttEventProps> = ({ entityWithConnections: { entity, relationships }, ganttItem, expanded }) => {
    const queryClient = useQueryClient();
    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;
    const relationshipTemplates = queryClient.getQueryData<IRelationshipTemplateMap>('getRelationshipTemplates')!;

    const entityTemplate = entityTemplates.get(entity.templateId);
    if (!entityTemplate) return <></>;

    const { connectedEntityTemplate, connectedEntityTemplateColor } = useMemo(() => getConnectedEntityDetails(ganttItem, entityTemplates, relationshipTemplates), []);

    return (
        <Grid container alignItems="center" spacing={0.5} marginTop='-0.34rem' direction={expanded ? 'column' : 'row'} sx={{ direction: 'ltr' }}>
            {expanded &&
                <Grid item>
                    <Typography fontWeight="bold" color="white" fontSize={18}>
                        {entityTemplate.displayName}
                    </Typography>
                </Grid>}

            <FieldsDisplay fields={ganttItem.entityTemplate.fieldsToShow} entity={entity} entityTemplate={entityTemplate} expanded={expanded} />

            {relationships?.[0] && ganttItem.connectedEntityTemplate && connectedEntityTemplate && <>
                <Grid item>
                    <Typography fontSize={14} fontWeight="bold" color="white">
                        {ganttSettings.templateSeparator}
                    </Typography>
                </Grid>
                {expanded &&
                    <Grid item>
                        <Typography fontWeight="bold" color="white" fontSize={18}>
                            {connectedEntityTemplate.displayName}
                        </Typography>
                    </Grid>}

                <FieldsDisplay
                    fields={ganttItem.connectedEntityTemplate.fieldsToShow}
                    entity={relationships[0].otherEntity}
                    entityTemplate={connectedEntityTemplate}
                    underlineColor={expanded ? undefined : connectedEntityTemplateColor}
                    expanded={expanded} />
            </>}
        </Grid>
    );
};
