import React from 'react';
import * as Yup from 'yup';
import { FieldArray, getIn } from 'formik';
import { Box, Button, Grid, TextField, Card, CardContent, IconButton, FormControlLabel, Switch } from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import { useQuery, useQueryClient } from 'react-query';
import i18next from 'i18next';
import { StepComponentProps } from '../index';
import { EntityTemplateWizardValues } from './index';
import { variableNameValidation } from '../../../utils/validation';
import { getEntitiesByTemplateRequest } from '../../../services/entitiesService';

const attachmentsFieldSchema = {
    attachmentProperties: Yup.array().of(
        Yup.object({
            name: Yup.string().matches(variableNameValidation, i18next.t('validation.variableName')).required(i18next.t('validation.required')),
            title: Yup.string().required(i18next.t('validation.required')),
            required: Yup.boolean().required(i18next.t('validation.required')),
        }),
    ),
};

const AttachmentsField: React.FC<StepComponentProps<EntityTemplateWizardValues>> = ({
    values,
    touched,
    errors,
    handleChange,
    isEditMode,
    initialValues,
}) => {
    const queryClient = useQueryClient();

    useQuery(
        ['isThereInstancesByTemplateId', (values as EntityTemplateWizardValues & { _id: string })._id],
        () =>
            getEntitiesByTemplateRequest((values as EntityTemplateWizardValues & { _id: string })._id, {
                startRow: 0,
                endRow: 0,
                filterModel: {},
                sortModel: [],
            }),
        {
            enabled: isEditMode,
            initialData: { lastRowIndex: 0, rows: [] },
        },
    );

    const areThereAnyInstances =
        queryClient.getQueryData<{ lastRowIndex: number }>([
            'isThereInstancesByTemplateId',
            (values as EntityTemplateWizardValues & { _id: string })._id,
        ])!.lastRowIndex > 0;

    return (
        <FieldArray name="attachmentProperties">
            {({ push, remove }) => (
                <>
                    <Grid container maxWidth="600px">
                        {values.attachmentProperties.map((p, index) => {
                            const name = `attachmentProperties[${index}].name`;
                            const touchedName = getIn(touched, name);
                            const errorName = getIn(errors, name);

                            const title = `attachmentProperties[${index}].title`;
                            const touchedTitle = getIn(touched, title);
                            const errorTitle = getIn(errors, title);

                            const required = `attachmentProperties[${index}].required`;
                            const isNewProperty = Boolean(initialValues.properties.find((property) => property.name === p.name));

                            return (
                                <Grid item key={name}>
                                    <Card>
                                        <CardContent>
                                            <Grid container margin={1} justifyContent="space-between">
                                                <FormControlLabel
                                                    control={
                                                        <Switch
                                                            disabled={isEditMode && areThereAnyInstances}
                                                            onChange={handleChange}
                                                            name={required}
                                                        />
                                                    }
                                                    label={i18next.t('validation.required') as string}
                                                />
                                                <IconButton
                                                    disabled={isEditMode && areThereAnyInstances && isNewProperty}
                                                    onClick={() => remove(index)}
                                                >
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Grid>
                                            <Box margin={1}>
                                                <TextField
                                                    label={i18next.t('wizard.entityTemplate.attachmentName')}
                                                    name={name}
                                                    value={p.name}
                                                    onChange={handleChange}
                                                    error={touchedName && Boolean(errorName)}
                                                    helperText={touchedName && errorName}
                                                    disabled={isEditMode && isNewProperty}
                                                />
                                            </Box>
                                            <Box margin={1}>
                                                <TextField
                                                    label={i18next.t('wizard.entityTemplate.attachmentDisplayName')}
                                                    name={title}
                                                    value={p.title}
                                                    onChange={handleChange}
                                                    error={touchedTitle && Boolean(errorTitle)}
                                                    helperText={touchedTitle && errorTitle}
                                                />
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            );
                        })}
                    </Grid>
                    <Button
                        type="button"
                        variant="contained"
                        style={{ margin: '8px' }}
                        onClick={() => push({ name: '', title: '', required: false })}
                    >
                        {i18next.t('wizard.entityTemplate.addAttachment')}
                    </Button>
                </>
            )}
        </FieldArray>
    );
};

export { AttachmentsField, attachmentsFieldSchema };
