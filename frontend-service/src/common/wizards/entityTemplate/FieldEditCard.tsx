import React from 'react';
import { FastField, Field, FormikErrors, FormikHandlers, FormikTouched, getIn } from 'formik';
import { TextField, Box, MenuItem, Grid, Card, CardContent, Switch, FormControlLabel, IconButton } from '@mui/material';
import { Delete as DeleteIcon, DragHandle as DragHandleIcon } from '@mui/icons-material';
import { Draggable } from 'react-beautiful-dnd';
import i18next from 'i18next';
import { validPropertyTypes } from './AddFields';
import { EntityTemplateFormInputProperties, EntityTemplateWizardValues } from './index';

interface FieldEditCardProps {
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

const FieldEditCard: React.FC<FieldEditCardProps> = ({
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
    const name = `properties[${index}].name`;
    const touchedName = getIn(touched, name);
    const errorName = getIn(errors, name);

    const title = `properties[${index}].title`;
    const touchedTitle = getIn(touched, title);
    const errorTitle = getIn(errors, title);

    const type = `properties[${index}].type`;
    const touchedType = getIn(touched, type);
    const errorType = getIn(errors, type);

    const required = `properties[${index}].required`;
    const preview = `properties[${index}].preview`;

    const isNewProperty = Boolean(initialValues.properties.find((property) => property.name === value.name));

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
                                            label={i18next.t('wizard.entityTemplate.propertyName')}
                                            id={name}
                                            name={name}
                                            value={value.name}
                                            onChange={handleChange}
                                            error={touchedName && Boolean(errorName)}
                                            helperText={touchedName && errorName}
                                            disabled={isEditMode && isNewProperty}
                                            sx={{ width: '33%', marginRight: '5px' }}
                                        />
                                        <FastField
                                            component={TextField}
                                            label={i18next.t('wizard.entityTemplate.propertyDisplayName')}
                                            id={title}
                                            name={title}
                                            value={value.title}
                                            onChange={handleChange}
                                            error={touchedTitle && Boolean(errorTitle)}
                                            helperText={touchedTitle && errorTitle}
                                            sx={{ width: '33%', marginRight: '5px' }}
                                        />
                                        <TextField
                                            select
                                            fullWidth
                                            type="text"
                                            label={i18next.t('wizard.entityTemplate.propertyType')}
                                            id={type}
                                            name={type}
                                            value={value.type}
                                            onChange={handleChange}
                                            error={touchedType && Boolean(errorType)}
                                            helperText={touchedType && errorType}
                                            disabled={isEditMode && areThereAnyInstances && isNewProperty}
                                            sx={{ width: '33%' }}
                                        >
                                            {validPropertyTypes.map((validType) => (
                                                <MenuItem key={validType} value={validType}>
                                                    {i18next.t(`propertyTypes.${validType}`)}
                                                </MenuItem>
                                            ))}
                                        </TextField>
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
                                            <FormControlLabel
                                                control={
                                                    <Field
                                                        id={preview}
                                                        name={preview}
                                                        component={Switch}
                                                        onChange={handleChange}
                                                        checked={value.preview}
                                                    />
                                                }
                                                label={i18next.t('validation.preview') as string}
                                            />
                                        </Box>

                                        <IconButton disabled={isEditMode && areThereAnyInstances && isNewProperty} onClick={() => remove(index)}>
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

export default FieldEditCard;
