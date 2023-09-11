import React, { useMemo } from 'react';
import { IBasicGantt, IGanttItem } from '../../../interfaces/gantts';
import { Grid, Tooltip } from '@mui/material';
import { useQueryClient } from 'react-query';
import { IEntityTemplateMap } from '../../../interfaces/entityTemplates';
import { IRelationshipTemplateMap } from '../../../interfaces/relationshipTemplates';
import { getEntityTemplateColor } from '../../../utils/colors';
import { getConnectedEntityDetails } from '../../../utils/gantts';
import { EntityTemplateDisplay } from './EntityTemplateDisplay';
import { environment } from '../../../globals';
import { GanttItemEdit } from './GanttItemEdit';
import { FormikProps } from 'formik';
import { ConnectionIcon } from './ConnectionIcon.styled';

const { ganttSettings } = environment;

interface IGanttItemDisplayProps {
    item: IGanttItem;
    index: number;
    formik: FormikProps<IBasicGantt>;
    expanded?: boolean;
    edit?: boolean;
}

export const GanttItemDisplay: React.FC<IGanttItemDisplayProps> = ({ item, formik, index, expanded, edit }) => {
    const queryClient = useQueryClient();

    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;
    const relationshipTemplates = queryClient.getQueryData<IRelationshipTemplateMap>('getRelationshipTemplates')!;

    const entityTemplate = entityTemplates.get(item.entityTemplate.id);
    const entityTemplateColor = useMemo(() => entityTemplate ? getEntityTemplateColor(entityTemplate) : '', [entityTemplate])

    const { connectedEntityTemplate, relationship, connectedEntityTemplateColor } = useMemo(
        () => getConnectedEntityDetails(item, entityTemplates, relationshipTemplates),
        [item, entityTemplates, relationshipTemplates]
    );

    return (
        <Tooltip
            title={`${entityTemplate?.displayName}${connectedEntityTemplate ? `${ganttSettings.separators.template} ${connectedEntityTemplate.displayName}` : ''}`}
            placement='right'
            disableHoverListener={expanded || edit}
            arrow
        >
            {edit ? (
                <Grid container direction="column" alignItems="stretch" paddingX="1rem" paddingY="1.5rem" width="35rem">
                    <GanttItemEdit ganttItem={item} index={index} formik={formik} connectedEntityTemplate={connectedEntityTemplate} />
                </Grid>
            ) : (
                <Grid container direction="column" alignItems='center' paddingX="1rem" paddingY="0.6rem" spacing={1}>
                    {entityTemplate &&
                        <EntityTemplateDisplay
                            entityTemplate={entityTemplate}
                            fieldsToShow={item.entityTemplate.fieldsToShow}
                            color={entityTemplateColor}
                            expanded={expanded}
                            main
                        />}


                    {connectedEntityTemplate && <>
                        <ConnectionIcon style={{ marginBottom: '-0.6rem' }} />

                        <EntityTemplateDisplay
                            entityTemplate={connectedEntityTemplate}
                            fieldsToShow={item.connectedEntityTemplate!.fieldsToShow}
                            color={connectedEntityTemplateColor}
                            relationshipName={relationship?.displayName}
                            expanded={expanded}
                        />
                    </>}
                </Grid>
            )}
        </Tooltip >
    );
};
