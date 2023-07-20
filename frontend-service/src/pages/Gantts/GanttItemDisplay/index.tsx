import React, { useMemo } from 'react';
import { IGanttItem } from '../../../interfaces/gantts';
import { Grid, Tooltip } from '@mui/material';
import { IEntityTemplateMap } from '../../../interfaces/entityTemplates';
import { IRelationshipTemplateMap } from '../../../interfaces/relationshipTemplates';
import { useQueryClient } from 'react-query';
import { getEntityTemplateColor } from '../../../utils/colors';
import { getConnectedEntityDetails } from '../../../utils/gantts';
import { EntityTemplateDisplay } from './EntityTemplateDisplay';
import { environment } from '../../../globals';

const { ganttSettings } = environment;

interface IGanttItemDisplayProps {
    item: IGanttItem;
    expanded?: boolean;
}

export const GanttItemDisplay: React.FC<IGanttItemDisplayProps> = ({ item, expanded }) => {
    const queryClient = useQueryClient();
    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;
    const relationshipTemplates = queryClient.getQueryData<IRelationshipTemplateMap>('getRelationshipTemplates')!;

    const entityTemplate = entityTemplates.get(item.entityTemplate.id)!;
    const entityTemplateColor = useMemo(() => entityTemplate ? getEntityTemplateColor(entityTemplate) : '', [entityTemplate])

    const { connectedEntityTemplate, relationship, connectedEntityTemplateColor } = useMemo(() => getConnectedEntityDetails(item, entityTemplates, relationshipTemplates), []);

    return (
        <Tooltip
            title={`${entityTemplate.displayName}${connectedEntityTemplate ? `${ganttSettings.templateSeparator} ${connectedEntityTemplate.displayName}` : ''}`}
            placement='right'
            disableHoverListener={expanded}
            arrow
        >
            <Grid container direction="column" paddingX="1rem" paddingY="0.4rem" spacing={1}>
                <EntityTemplateDisplay
                    entityTemplate={entityTemplate}
                    fieldsToShow={item.entityTemplate.fieldsToShow}
                    color={entityTemplateColor} expanded={expanded}
                    main
                />

                {connectedEntityTemplate && expanded &&
                    <EntityTemplateDisplay
                        entityTemplate={connectedEntityTemplate}
                        fieldsToShow={item.connectedEntityTemplate!.fieldsToShow}
                        color={connectedEntityTemplateColor}
                        relationshipName={relationship?.displayName}
                    />}
            </Grid>
        </Tooltip>
    );
};
