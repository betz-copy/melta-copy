import React, { useMemo } from 'react';
import { Button, Grid } from '@mui/material';
import { FieldArray, FormikProps } from 'formik';
import { useQueryClient } from 'react-query';
import i18next from 'i18next';
import { IBasicGantt, IGanttItem } from '../../../interfaces/gantts';
import { IEntityTemplateMap, IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { FormikAutoComplete } from '../../../common/inputs/FormikAutoComplete';
import { IRelationshipTemplateMap } from '../../../interfaces/relationshipTemplates';
import { ConnectionIcon } from './ConnectionIcon.styled';
import { getGanttItemEditDetails } from '../../../utils/gantts';

interface IGanttItemEditProps {
    ganttItem: IGanttItem;
    index: number;
    formik: FormikProps<IBasicGantt>;
    connectedEntityTemplate?: IMongoEntityTemplatePopulated;
}

export const GanttItemEdit: React.FC<IGanttItemEditProps> = ({ ganttItem, index, formik, connectedEntityTemplate }) => {
    const { values, setFieldValue } = formik;

    const queryClient = useQueryClient();

    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;
    const relationshipTemplates = queryClient.getQueryData<IRelationshipTemplateMap>('getRelationshipTemplates')!;

    const entityTemplate = entityTemplates.get(ganttItem.entityTemplate.id);

    const { entityTemplateDateFields, relevantRelationshipIds } = useMemo(
        () => getGanttItemEditDetails(relationshipTemplates, entityTemplate),
        [entityTemplate, relationshipTemplates],
    );

    const itemKey = `items[${index}]`;
    const itemEntityTemplateKey = `${itemKey}.entityTemplate`;
    const itemConnectedEntityTemplateKey = `${itemKey}.connectedEntityTemplate`;

    const entityTemplateFields = entityTemplate && Object.keys(entityTemplate.properties.properties);
    const connectedEntityTemplateFields = connectedEntityTemplate && Object.keys(connectedEntityTemplate.properties.properties);

    return (
        <Grid container direction="column" alignItems="stretch" spacing={1.5}>
            <Grid item>
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
                        } as IGanttItem);
                    }}
                />
            </Grid>

            <Grid item>
                <FormikAutoComplete
                    formik={formik}
                    formikField={`${itemEntityTemplateKey}.startDateField`}
                    options={entityTemplateDateFields || []}
                    label={i18next.t('gantts.startDateField')}
                    getOptionLabel={(option) => entityTemplate?.properties.properties[option]?.title || ''}
                    disabled={!entityTemplate}
                    getOptionDisabled={(option) => ganttItem.entityTemplate.endDateField === option}
                />
            </Grid>
            <Grid item>
                <FormikAutoComplete
                    formik={formik}
                    formikField={`${itemEntityTemplateKey}.endDateField`}
                    options={entityTemplateDateFields || []}
                    label={i18next.t('gantts.endDateField')}
                    getOptionLabel={(option) => entityTemplate?.properties.properties[option]?.title || ''}
                    disabled={!entityTemplate}
                    getOptionDisabled={(option) => ganttItem.entityTemplate.startDateField === option}
                />
            </Grid>

            <Grid item>
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

            <Grid item container direction="column" alignItems="stretch" spacing={1} padding="rem" width="100%">
                {ganttItem.connectedEntityTemplate ? (
                    <>
                        <Grid item alignSelf="center">
                            <ConnectionIcon />
                        </Grid>

                        <Grid item>
                            <FormikAutoComplete
                                formik={formik}
                                formikField={`${itemConnectedEntityTemplateKey}.relationshipTemplateId`}
                                options={relevantRelationshipIds || []}
                                label={i18next.t('relationshipTemplate')}
                                getOptionLabel={(option) => {
                                    const relationShip = relationshipTemplates.get(option);
                                    if (!relationShip) return '';

                                    const sourceEntityTemplate = entityTemplates.get(relationShip.sourceEntityId);
                                    if (!sourceEntityTemplate) return '';

                                    const destinationEntityTemplate = entityTemplates.get(relationShip.destinationEntityId);
                                    if (!destinationEntityTemplate) return '';

                                    return `${relationShip.displayName} (${sourceEntityTemplate.displayName} > ${destinationEntityTemplate.displayName})`;
                                }}
                                disabled={!entityTemplate}
                                onChange={(value) => {
                                    setFieldValue(itemConnectedEntityTemplateKey, {
                                        relationshipTemplateId: value,
                                        fieldsToShow: [],
                                    } as IGanttItem['connectedEntityTemplate']);
                                }}
                            />
                        </Grid>
                        <Grid item>
                            <FormikAutoComplete
                                multiple
                                hideSelectedOptions
                                formik={formik}
                                formikField={`${itemConnectedEntityTemplateKey}.fieldsToShow`}
                                options={connectedEntityTemplateFields || []}
                                label={i18next.t('gantts.fieldsToShow')}
                                getOptionLabel={(option) => connectedEntityTemplate?.properties.properties[option]?.title || ''}
                                disabled={!connectedEntityTemplate}
                            />
                        </Grid>

                        <Grid item alignSelf="center">
                            <Button onClick={() => setFieldValue(itemConnectedEntityTemplateKey, undefined)}>
                                {i18next.t('gantts.actions.deleteConnectedEntityTemplate')}
                            </Button>
                        </Grid>
                    </>
                ) : (
                    <Grid item alignSelf="center">
                        <Button
                            onClick={() =>
                                setFieldValue(itemConnectedEntityTemplateKey, {
                                    relationshipTemplateId: '',
                                    fieldsToShow: [],
                                } as IGanttItem['connectedEntityTemplate'])
                            }
                        >
                            {i18next.t('gantts.actions.addConnectedEntityTemplate')}
                        </Button>
                    </Grid>
                )}

                <FieldArray name="items" validateOnChange={false}>
                    {({ remove }) => (
                        <Grid item alignSelf="center">
                            <Button onClick={() => remove(index)}>{i18next.t('gantts.actions.deleteItem')}</Button>
                        </Grid>
                    )}
                </FieldArray>
            </Grid>
        </Grid>
    );
};
