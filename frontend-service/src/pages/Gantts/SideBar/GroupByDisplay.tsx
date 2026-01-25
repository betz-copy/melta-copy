import { Grid, Typography } from '@mui/material';
import { IGantt, IGanttGroupBy } from '@packages/gantt';
import { FormikProps } from 'formik';
import i18next from 'i18next';
import { isEqual } from 'lodash';
import React, { useMemo } from 'react';
import { useQueryClient } from 'react-query';
import { FormikAutoComplete } from '../../../common/inputs/FormikAutoComplete';
import MeltaTooltip from '../../../common/MeltaDesigns/MeltaTooltip';
import { IEntityTemplateMap } from '../../../interfaces/template';
import { filteredMap } from '../../../utils/filteredMap';
import { EntityTemplateDisplay } from '../GanttItemDisplay/EntityTemplateDisplay';
import { RemoveFromArrayButton } from '../GanttItemDisplay/GanttItemEdit/RemoveFromArrayButton';

interface GroupByDisplayProps {
    groupBy: IGanttGroupBy;
    formik: FormikProps<IGantt>;
    expanded?: boolean;
    edit?: boolean;
}

export const GroupByDisplay: React.FC<GroupByDisplayProps> = ({ groupBy, formik, expanded, edit }) => {
    const queryClient = useQueryClient();
    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;

    const groupByEntityTemplate = entityTemplates.get(groupBy.entityTemplateId);

    const uniqueGroupByEntityTemplateProperties = useMemo(
        () =>
            edit &&
            groupByEntityTemplate &&
            filteredMap(Object.keys(groupByEntityTemplate.properties.properties), (property) => ({
                include: Boolean(
                    groupByEntityTemplate.uniqueConstraints.find((uniqueConstraint) => isEqual(uniqueConstraint.properties, [property])),
                ),
                value: property,
            })),
        [groupByEntityTemplate, edit],
    );

    if (edit)
        return (
            <Grid container direction="column" padding="2rem" paddingTop="2rem" marginTop="0" position="relative" spacing={1.5} width="100%">
                <Typography display="inline">{i18next.t('gantts.groupByEntities')}</Typography>

                <RemoveFromArrayButton
                    tooltip={i18next.t('gantts.actions.deleteGroupBy')}
                    onRemove={() => {
                        formik.setValues((prev) => ({
                            ...prev,
                            groupBy: undefined,
                            items: prev.items.map((item) => ({ ...item, groupByRelationshipId: undefined })),
                        }));
                    }}
                />

                <Grid>
                    <FormikAutoComplete
                        formik={formik}
                        formikField="groupBy.entityTemplateId"
                        options={Array.from(entityTemplates.keys())}
                        label={i18next.t('entityTemplate')}
                        getOptionLabel={(option) => entityTemplates.get(option)?.displayName || ''}
                        onChange={(value) => {
                            formik.setFieldValue('groupBy', {
                                entityTemplateId: value,
                                groupNameField: '',
                            } as IGanttGroupBy);
                        }}
                    />
                </Grid>

                <Grid>
                    <FormikAutoComplete
                        formik={formik}
                        formikField="groupBy.groupNameField"
                        options={uniqueGroupByEntityTemplateProperties || []}
                        label={i18next.t('gantts.groupNameField')}
                        getOptionLabel={(option) => groupByEntityTemplate?.properties.properties[option]?.title || ''}
                        disabled={Boolean(!groupByEntityTemplate)}
                    />
                </Grid>
            </Grid>
        );

    if (!groupByEntityTemplate) return null;

    return (
        <MeltaTooltip
            title={`${i18next.t('gantts.groupByEntities')} ${groupByEntityTemplate.displayName}`}
            placement="right"
            disableHoverListener={expanded}
        >
            <Grid container direction="column" alignItems="center" paddingX="1rem" paddingY="0.8rem" spacing={1}>
                <EntityTemplateDisplay
                    entityTemplate={groupByEntityTemplate}
                    fieldsToShow={[]}
                    subTitle={groupByEntityTemplate.properties.properties[groupBy.groupNameField].title}
                    topNote={i18next.t('gantts.groupByEntities')}
                    expanded={expanded}
                    main
                />
            </Grid>
        </MeltaTooltip>
    );
};
