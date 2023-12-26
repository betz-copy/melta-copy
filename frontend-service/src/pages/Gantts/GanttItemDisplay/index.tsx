import React, { useMemo } from 'react';
import { Grid, Tooltip } from '@mui/material';
import { useQueryClient } from 'react-query';
import { FormikProps } from 'formik';
import { IBasicGantt, IGanttItem } from '../../../interfaces/gantts';
import { IEntityTemplateMap } from '../../../interfaces/entityTemplates';
import { IRelationshipTemplateMap } from '../../../interfaces/relationshipTemplates';
import { getConnectedEntityTemplatesDetails } from '../../../utils/gantts';
import { EntityTemplateDisplay } from './EntityTemplateDisplay';
import { environment } from '../../../globals';
import { GanttItemEdit } from './GanttItemEdit';
import { ConnectionIcon } from './ConnectionIcon.styled';

const { separators } = environment.ganttSettings;

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

    const connectedEntityTemplatesDetails = useMemo(
        () => getConnectedEntityTemplatesDetails(item, entityTemplates, relationshipTemplates),
        [item, entityTemplates, relationshipTemplates],
    );

    const title = useMemo(
        () =>
            // eslint-disable-next-line prettier/prettier
            `${entityTemplate?.displayName} ${connectedEntityTemplatesDetails.length ? separators.related : ''} ${connectedEntityTemplatesDetails
                .map(({ connectedEntityTemplate: { displayName } }) => displayName)
                .join(separators.template)}`,
        [entityTemplate, connectedEntityTemplatesDetails],
    );

    if (edit)
        return (
            <Grid container direction="column" alignItems="stretch" paddingX="1rem" paddingY="1.5rem" width="100%">
                <GanttItemEdit ganttItem={item} index={index} formik={formik} />
            </Grid>
        );

    if (!entityTemplate) return null;

    const startDateTitle = entityTemplate.properties.properties[item.entityTemplate.startDateField].title;
    const endDateTitle = entityTemplate.properties.properties[item.entityTemplate.endDateField].title;

    return (
        <Tooltip title={title} placement="right" disableHoverListener={expanded} arrow>
            <Grid container direction="column" alignItems="center" paddingX="1rem" paddingY="0.6rem" spacing={1}>
                <EntityTemplateDisplay
                    entityTemplate={entityTemplate}
                    fieldsToShow={item.entityTemplate.fieldsToShow}
                    subTitle={`${startDateTitle} ${separators.startEnd} ${endDateTitle}`}
                    expanded={expanded}
                    main
                />

                {Boolean(connectedEntityTemplatesDetails.length) && <ConnectionIcon style={{ marginBottom: '-0.6rem' }} />}

                {connectedEntityTemplatesDetails.map(({ connectedEntityTemplate, relationship, fieldsToShow, connectedEntityTemplateColor }) => (
                    <EntityTemplateDisplay
                        key={connectedEntityTemplate._id}
                        entityTemplate={connectedEntityTemplate}
                        fieldsToShow={fieldsToShow}
                        color={connectedEntityTemplateColor}
                        sideNote={`(${relationship.displayName})`}
                        expanded={expanded}
                    />
                ))}
            </Grid>
        </Tooltip>
    );
};
