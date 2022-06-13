import React from 'react';
import { FastField, Field, FormikErrors, FormikHandlers, FormikTouched, getIn } from 'formik';
import { TextField, Box, Grid, Card, CardContent, Switch, FormControlLabel, IconButton } from '@mui/material';
import { Delete as DeleteIcon, DragHandle as DragHandleIcon } from '@mui/icons-material';
import { Draggable } from 'react-beautiful-dnd';
import i18next from 'i18next';
import { EntityTemplateFormInputProperties, EntityTemplateWizardValues } from './index';

interface AttachmentEditCardProps {
    value: EntityTemplateFormInputProperties;
    index: number;
    isEditMode?: Boolean;
    initialValues: EntityTemplateWizardValues;
    areThereAnyInstances?: Boolean;
    touched: FormikTouched<EntityTemplateWizardValues>;
    errors: FormikErrors<EntityTemplateWizardValues>;
    handleChange: FormikHandlers['handleChange'];
    remove: (index: number) => any;
}

const AttachmentEditCard: React.FC<AttachmentEditCardProps> = ({
    value,
    index,
    isEditMode,
    initialValues,
    areThereAnyInstances,
    touched,
    errors,
    handleChange,
    remove,
}) => {
    const name = `attachmentProperties[${index}].name`;
    const touchedName = getIn(touched, name);
    const errorName = getIn(errors, name);

    const title = `attachmentProperties[${index}].title`;
    const touchedTitle = getIn(touched, title);
    const errorTitle = getIn(errors, title);

    const required = `attachmentProperties[${index}].required`;

    const isNewProperty = !initialValues.attachmentProperties.find((property) => property.id === value.id);

    const isDisabled = Boolean(isEditMode && !isNewProperty && areThereAnyInstances);

    return (
        <Draggable draggableId={value.id} index={index}>
            {(draggableProvided) => (
                <Grid item ref={draggableProvided.innerRef} {...draggableProvided.draggableProps} alignSelf="stretch" marginBottom="1rem">
                    <Card elevation={3} sx={{ padding: '0.5rem' }}>
                        <CardContent sx={{ '&:last-child': { padding: 0 } }}>
                            <Grid container justifyContent="space-between" wrap="nowrap" alignItems="center">
                                <Box {...draggableProvided.dragHandleProps}>
                                    <DragHandleIcon fontSize="large" />
                                </Box>

                                <Grid container direction="column">
                                    <Grid container wrap="nowrap">
                                        <FastField
                                            component={TextField}
                                            label={i18next.t('wizard.entityTemplate.attachmentName')}
                                            id={name}
                                            name={name}
                                            value={value.name}
                                            onChange={handleChange}
                                            error={touchedName && Boolean(errorName)}
                                            helperText={touchedName && errorName}
                                            disabled={isDisabled}
                                            sx={{ width: '50%', marginRight: '5px' }}
                                        />
                                        <FastField
                                            component={TextField}
                                            label={i18next.t('wizard.entityTemplate.attachmentDisplayName')}
                                            id={title}
                                            name={title}
                                            value={value.title}
                                            onChange={handleChange}
                                            error={touchedTitle && Boolean(errorTitle)}
                                            helperText={touchedTitle && errorTitle}
                                            sx={{ width: '50%', marginRight: '5px' }}
                                        />
                                    </Grid>
                                    <Grid container justifyContent="space-between">
                                        <Box>
                                            <FormControlLabel
                                                control={
                                                    <Field
                                                        id={required}
                                                        name={required}
                                                        component={Switch}
                                                        onChange={handleChange}
                                                        checked={value.required}
                                                        disabled={isEditMode && areThereAnyInstances}
                                                    />
                                                }
                                                label={i18next.t('validation.required') as string}
                                            />
                                        </Box>

                                        <IconButton disabled={isDisabled} onClick={() => remove(index)}>
                                            <DeleteIcon />
                                        </IconButton>
                                    </Grid>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>
            )}
        </Draggable>
    );
};

export default AttachmentEditCard;
