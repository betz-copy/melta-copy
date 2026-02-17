import { ImportExport as RelatedIcon } from '@mui/icons-material';
import { Grid, Typography } from '@mui/material';
import React, { CSSProperties, Fragment, useMemo } from 'react';
import { useQueryClient } from 'react-query';
import { environment } from '../../../globals';
import { IScheduleComponentData } from '../../../interfaces/syncfusion';
import { IEntityTemplateMap, IRelationshipTemplateMap } from '../../../interfaces/template';
import { filteredMap } from '../../../utils/filteredMap';
import { getConnectedEntityTemplatesDetails } from '../../../utils/gantts';
import { FieldsDisplay } from './FieldsDisplay';

const { ganttSettings } = environment;

type GanttEventProps = IScheduleComponentData & { expanded?: boolean };

export const GanttEvent: React.FC<GanttEventProps> = ({ entityWithConnections: { entity, relationships }, ganttItem, expanded }) => {
    const queryClient = useQueryClient();

    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;
    const relationshipTemplates = queryClient.getQueryData<IRelationshipTemplateMap>('getRelationshipTemplates')!;

    const connectedEntityTemplatesDetails = useMemo(
        () => getConnectedEntityTemplatesDetails(ganttItem, entityTemplates, relationshipTemplates),
        [ganttItem, entityTemplates, relationshipTemplates],
    );

    const entityTemplate = entityTemplates.get(entity.templateId);
    if (!entityTemplate) return null;

    const textStyle: CSSProperties = {
        color: 'white',
        fontWeight: 'bold',
        opacity: 0.8,
    };

    let connectedEntityTemplatesIndex = -1;

    return (
        <Grid
            container
            alignItems="center"
            width="100%"
            spacing={0.5}
            marginLeft={0}
            marginTop="-0.3rem"
            direction={expanded ? 'column' : 'row'}
            sx={{ opacity: 1 }}
        >
            {expanded && (
                <Grid>
                    <Typography fontSize={18} sx={{ ...textStyle }}>
                        {entityTemplate.displayName}
                    </Typography>
                </Grid>
            )}

            <FieldsDisplay
                fields={ganttItem.entityTemplate.fieldsToShow}
                entity={entity}
                entityTemplate={entityTemplate}
                textStyle={textStyle}
                expanded={expanded}
            />

            {filteredMap(connectedEntityTemplatesDetails, ({ connectedEntityTemplate, fieldsToShow, connectedEntityTemplateColor }) => {
                const relevantRelationships = relationships!.filter(({ otherEntity: { templateId } }) => templateId === connectedEntityTemplate._id);
                if (!relevantRelationships.length) return { include: false };

                connectedEntityTemplatesIndex++;

                return {
                    include: true,
                    value: (
                        <Fragment key={connectedEntityTemplate._id}>
                            <Grid>
                                <Typography fontSize={14} sx={{ ...textStyle }}>
                                    {connectedEntityTemplatesIndex ? (
                                        ganttSettings.separators.template
                                    ) : expanded ? (
                                        <RelatedIcon style={{ marginBottom: '-0.4rem' }} />
                                    ) : (
                                        ganttSettings.separators.related
                                    )}
                                </Typography>
                            </Grid>

                            {expanded && (
                                <Grid>
                                    <Typography fontSize={18} sx={{ ...textStyle }}>
                                        {connectedEntityTemplate.displayName}
                                    </Typography>
                                </Grid>
                            )}

                            {relevantRelationships.map((relationship, relationshipIndex) => (
                                <Fragment key={relationship.otherEntity.properties._id}>
                                    {Boolean(relationshipIndex) && (
                                        <Grid>
                                            <Typography fontSize={7} sx={{ ...textStyle }}>
                                                {ganttSettings.separators.entity}
                                            </Typography>
                                        </Grid>
                                    )}

                                    <FieldsDisplay
                                        fields={fieldsToShow}
                                        entity={relationship.otherEntity}
                                        entityTemplate={connectedEntityTemplate}
                                        textStyle={textStyle}
                                        underlineColor={expanded ? undefined : connectedEntityTemplateColor}
                                        expanded={expanded}
                                    />
                                </Fragment>
                            ))}
                        </Fragment>
                    ),
                };
            })}
        </Grid>
    );
};
