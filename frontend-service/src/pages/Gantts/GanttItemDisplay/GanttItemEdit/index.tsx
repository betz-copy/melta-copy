import { Grid } from '@mui/material';
import { FieldArray, FormikProps } from 'formik';
import i18next from 'i18next';
import { pickBy } from 'lodash';
import React, { useMemo } from 'react';
import { useQueryClient } from 'react-query';
import { FormikAutoComplete } from '../../../../common/inputs/FormikAutoComplete';
import { IEntityTemplateMap } from '../../../../interfaces/entityTemplates';
import { IBasicGantt, IGanttItem } from '../../../../interfaces/gantts';
import { IRelationshipTemplateMap } from '../../../../interfaces/relationshipTemplates';
import { useDarkModeStore } from '../../../../stores/darkMode';
import { getGanttItemEditDetails, getRelationshipString } from '../../../../utils/gantts';
import { EditConnectedEntityTemplates } from './EditConnectedEntityTemplates.tsx';
import { RemoveFromArrayButton } from './RemoveFromArrayButton';

interface IGanttItemEditProps {
    ganttItem: IGanttItem;
    index: number;
    formik: FormikProps<IBasicGantt>;
}

export const GanttItemEdit: React.FC<IGanttItemEditProps> = ({ ganttItem, index, formik }) => {
    const darkMode = useDarkModeStore((state) => state.darkMode);

    const { values, setFieldValue } = formik;

    const queryClient = useQueryClient();

    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;
    const relationshipTemplates = queryClient.getQueryData<IRelationshipTemplateMap>('getRelationshipTemplates')!;

    const entityTemplate = entityTemplates.get(ganttItem.entityTemplate.id);

    const { entityTemplateDateFields, relevantRelationshipIds, groupByRelevantRelationshipIds } = useMemo(
        () => getGanttItemEditDetails(relationshipTemplates, entityTemplate, values.groupBy),
        [entityTemplate, relationshipTemplates, values.groupBy],
    );

    const itemKey = `items[${index}]`;
    const itemEntityTemplateKey = `${itemKey}.entityTemplate`;

    const entityTemplateFields = Object.keys(pickBy(entityTemplate?.properties.properties, ({ format }) => format !== 'comment'));

    return (
        <Grid
            container
            direction="column"
            alignItems="stretch"
            spacing={1.5}
            border={`solid ${darkMode ? 'grey' : 'lightgray'} 1px`}
            borderRadius={2}
            padding="1rem"
            paddingRight="1.8rem"
            paddingTop="2rem"
            marginLeft="-0.3rem"
            marginTop="0.1rem"
            position="relative"
        >
            <FieldArray name="items" validateOnChange={false}>
                {({ remove }) => <RemoveFromArrayButton tooltip={i18next.t('gantts.actions.deleteItem')} onRemove={() => remove(index)} />}
            </FieldArray>

            <Grid>
                <FormikAutoComplete
                    formik={formik}
                    formikField={`${itemEntityTemplateKey}.id`}
                    options={Array.from(entityTemplates.keys())}
                    label={i18next.t('entityTemplate')}
                    getOptionLabel={(option) => entityTemplates.get(option)?.displayName || ''}
                    getOptionDisabled={(option) => values.items.some((item) => item.entityTemplate.id === option)}
                    onChange={(value) => {
                        setFieldValue(itemKey, {
                            entityTemplate: { id: value, startDateField: '', endDateField: '', fieldsToShow: [] },
                            connectedEntityTemplates: [],
                        } as IGanttItem);
                    }}
                />
            </Grid>

            <Grid>
                <FormikAutoComplete
                    formik={formik}
                    formikField={`${itemEntityTemplateKey}.startDateField`}
                    options={entityTemplateDateFields || []}
                    label={i18next.t('gantts.startDateField')}
                    getOptionLabel={(option) => entityTemplate?.properties.properties[option]?.title || ''}
                />
            </Grid>
            <Grid>
                <FormikAutoComplete
                    formik={formik}
                    formikField={`${itemEntityTemplateKey}.endDateField`}
                    options={entityTemplateDateFields || []}
                    label={i18next.t('gantts.endDateField')}
                    getOptionLabel={(option) => entityTemplate?.properties.properties[option]?.title || ''}
                />
            </Grid>

            <Grid>
                <FormikAutoComplete
                    multiple
                    hideSelectedOptions
                    formik={formik}
                    formikField={`${itemEntityTemplateKey}.fieldsToShow`}
                    options={entityTemplateFields || []}
                    label={i18next.t('gantts.fieldsToShow')}
                    getOptionLabel={(option) => entityTemplate?.properties.properties[option]?.title || ''}
                    disabled={!entityTemplate}
                />
            </Grid>

            {Boolean(values.groupBy) && (
                <Grid>
                    <FormikAutoComplete
                        formik={formik}
                        formikField={`${itemKey}.groupByRelationshipId`}
                        options={groupByRelevantRelationshipIds || []}
                        label={i18next.t('gantts.groupByRelationship')}
                        getOptionLabel={(option) => getRelationshipString(option, entityTemplates, relationshipTemplates)}
                        disabled={!entityTemplate}
                    />
                </Grid>
            )}

            <EditConnectedEntityTemplates
                formik={formik}
                ganttItem={ganttItem}
                itemKey={itemKey}
                relevantRelationshipIds={relevantRelationshipIds}
                disabled={!entityTemplate}
            />
        </Grid>
    );
};
