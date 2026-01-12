import { Button, Grid } from '@mui/material';
import { IEntityTemplateMap } from '@packages/entity-template';
import { IGantt, IGanttItem } from '@packages/gantt';
import { IRelationshipTemplateMap } from '@packages/relationship-template';
import { FieldArray, FormikProps } from 'formik';
import i18next from 'i18next';
import { pickBy } from 'lodash';
import React from 'react';
import { useQueryClient } from 'react-query';
import { FormikAutoComplete } from '../../../../common/inputs/FormikAutoComplete';
import { useDarkModeStore } from '../../../../stores/darkMode';
import { getRelationshipString } from '../../../../utils/gantts';
import { ConnectionIcon } from '../ConnectionIcon.styled';
import { RemoveFromArrayButton } from './RemoveFromArrayButton';

interface IEditConnectedEntityTemplatesProps {
    formik: FormikProps<IGantt>;
    ganttItem: IGanttItem;
    itemKey: string;
    relevantRelationshipIds?: string[];
    disabled?: boolean;
}

export const EditConnectedEntityTemplates: React.FC<IEditConnectedEntityTemplatesProps> = ({
    formik,
    ganttItem,
    itemKey,
    relevantRelationshipIds = [],
    disabled,
}) => {
    const darkMode = useDarkModeStore((state) => state.darkMode);

    const { setFieldValue } = formik;

    const queryClient = useQueryClient();

    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;
    const relationshipTemplates = queryClient.getQueryData<IRelationshipTemplateMap>('getRelationshipTemplates')!;

    const connectedEntityTemplatesKey = `${itemKey}.connectedEntityTemplates`;

    return (
        <Grid container direction="column" alignItems="stretch">
            <FieldArray name={connectedEntityTemplatesKey} validateOnChange={false}>
                {({ push, remove }) => (
                    <>
                        {Boolean(ganttItem.connectedEntityTemplates.length) && (
                            <Grid alignSelf="center">
                                <ConnectionIcon />
                            </Grid>
                        )}

                        {ganttItem.connectedEntityTemplates.map(({ relationshipTemplateId }, index) => {
                            const itemConnectedEntityTemplateKey = `${connectedEntityTemplatesKey}[${index}]`;

                            const relationshipTemplate = relationshipTemplates.get(relationshipTemplateId);
                            const connectedEntityTemplate =
                                relationshipTemplate &&
                                entityTemplates.get(
                                    ganttItem.entityTemplate.id === relationshipTemplate.sourceEntityId
                                        ? relationshipTemplate.destinationEntityId
                                        : relationshipTemplate.sourceEntityId,
                                );

                            const connectedEntityTemplateFields = Object.keys(
                                pickBy(connectedEntityTemplate?.properties.properties, ({ format }) => format !== 'comment'),
                            );

                            return (
                                <Grid
                                    container
                                    direction="column"
                                    alignItems="stretch"
                                    spacing={1}
                                    border={`solid ${darkMode ? 'grey' : 'lightgray'} 1px`}
                                    borderRadius={2}
                                    padding="1rem"
                                    paddingRight="1.7rem"
                                    paddingTop="2.3rem"
                                    marginY="0.5rem"
                                    marginLeft="-0.35rem"
                                    position="relative"
                                    // can't use relationshipTemplateId (or a similar id of the connectedEntityTemplate) because it doesn't necessary exist while editing
                                    // biome-ignore lint/suspicious/noArrayIndexKey: Yahalom knows what he's doing
                                    key={index}
                                >
                                    <RemoveFromArrayButton
                                        tooltip={i18next.t('gantts.actions.deleteConnectedEntityTemplate')}
                                        onRemove={() => remove(index)}
                                    />

                                    <Grid>
                                        <FormikAutoComplete
                                            formik={formik}
                                            formikField={`${itemConnectedEntityTemplateKey}.relationshipTemplateId`}
                                            options={relevantRelationshipIds}
                                            label={i18next.t('relationshipTemplate')}
                                            getOptionLabel={(option) => getRelationshipString(option, entityTemplates, relationshipTemplates)}
                                            getOptionDisabled={(option) =>
                                                ganttItem.connectedEntityTemplates.some(
                                                    (currConnectedEntityTemplates) => currConnectedEntityTemplates.relationshipTemplateId === option,
                                                )
                                            }
                                            disabled={disabled}
                                            onChange={(value) => {
                                                setFieldValue(itemConnectedEntityTemplateKey, {
                                                    relationshipTemplateId: value,
                                                    fieldsToShow: [],
                                                } as IGanttItem['connectedEntityTemplates'][number]);
                                            }}
                                        />
                                    </Grid>
                                    <Grid>
                                        <FormikAutoComplete
                                            multiple
                                            hideSelectedOptions
                                            formik={formik}
                                            formikField={`${itemConnectedEntityTemplateKey}.fieldsToShow`}
                                            options={connectedEntityTemplateFields || []}
                                            label={i18next.t('gantts.fieldsToShow')}
                                            getOptionLabel={(option) => connectedEntityTemplate?.properties.properties[option]?.title || ''}
                                            disabled={!connectedEntityTemplate || disabled}
                                        />
                                    </Grid>
                                </Grid>
                            );
                        })}

                        <Grid alignSelf="center">
                            <Button
                                onClick={() =>
                                    push({
                                        relationshipTemplateId: '',
                                        fieldsToShow: [],
                                    } as IGanttItem['connectedEntityTemplates'][number])
                                }
                            >
                                {i18next.t('gantts.actions.addConnectedEntityTemplate')}
                            </Button>
                        </Grid>
                    </>
                )}
            </FieldArray>
        </Grid>
    );
};
