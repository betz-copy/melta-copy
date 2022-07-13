import React from 'react';
import { FastField, Field, FormikErrors, FormikHandlers, FormikHelpers, FormikTouched, getIn } from 'formik';
import { TextField, Box, MenuItem, Grid, Card, CardContent, Switch, FormControlLabel, IconButton, Chip, Autocomplete } from '@mui/material';
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
    setFieldValue: FormikHelpers<EntityTemplateWizardValues>['setFieldValue'];
    handleChange: FormikHandlers['handleChange'];
    handleBlur: FormikHandlers['handleBlur'];
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
    setFieldValue,
    handleChange,
    handleBlur,
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

    const pattern = `properties[${index}].pattern`;
    const touchedPattern = getIn(touched, pattern);
    const errorPattern = getIn(errors, pattern);

    const patternCustomErrorMessage = `properties[${index}].patternCustomErrorMessage`;
    const touchedPatternCustomErrorMessage = getIn(touched, patternCustomErrorMessage);
    const errorPatternCustomErrorMessage = getIn(errors, patternCustomErrorMessage);

    const options = `properties[${index}].options`;
    const touchedOptions = getIn(touched, options);
    const errorOptions = getIn(errors, options);

    const required = `properties[${index}].required`;
    const preview = `properties[${index}].preview`;

    const initialEnumOptions = initialValues.properties.find((property) => property.id === value.id)?.options || [];

    const isNewProperty = !initialValues.properties.find((property) => property.id === value.id);

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

                                <Grid container direction="column" spacing={1}>
                                    <Grid item container wrap="nowrap">
                                        <FastField
                                            component={TextField}
                                            label={i18next.t('wizard.entityTemplate.propertyName')}
                                            id={name}
                                            name={name}
                                            value={value.name}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            error={touchedName && Boolean(errorName)}
                                            helperText={touchedName && errorName}
                                            disabled={isDisabled}
                                            sx={{ width: '25%', marginRight: '5px' }}
                                        />
                                        <FastField
                                            component={TextField}
                                            label={i18next.t('wizard.entityTemplate.propertyDisplayName')}
                                            id={title}
                                            name={title}
                                            value={value.title}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            error={touchedTitle && Boolean(errorTitle)}
                                            helperText={touchedTitle && errorTitle}
                                            sx={{ width: '25%', marginRight: '5px' }}
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
                                            onBlur={handleBlur}
                                            error={touchedType && Boolean(errorType)}
                                            helperText={touchedType && errorType}
                                            disabled={isDisabled}
                                            sx={{ width: value.type === 'enum' || value.type === 'pattern' ? '20%' : '50%', marginRight: '5px' }}
                                        >
                                            {validPropertyTypes.map((validType) => (
                                                <MenuItem key={validType} value={validType}>
                                                    {i18next.t(`propertyTypes.${validType}`)}
                                                </MenuItem>
                                            ))}
                                        </TextField>
                                        {value.type === 'enum' && (
                                            <Autocomplete
                                                id={options}
                                                multiple
                                                options={value.options}
                                                freeSolo
                                                value={value.options}
                                                onChange={(_e, currValue) => {
                                                    if (isDisabled) {
                                                        const newValues = currValue.filter((option) => initialEnumOptions.indexOf(option) === -1);

                                                        setFieldValue(options, [...initialEnumOptions, ...newValues]);
                                                    } else {
                                                        setFieldValue(options, currValue);
                                                    }
                                                }}
                                                onBlur={handleBlur}
                                                renderTags={(tagValue, getTagProps) =>
                                                    tagValue.map((option: string, tagIndex: number) => (
                                                        // eslint-disable-next-line react/jsx-key
                                                        <Chip
                                                            variant="outlined"
                                                            label={option}
                                                            {...getTagProps({ index: tagIndex })}
                                                            disabled={isDisabled && initialEnumOptions.includes(option)}
                                                        />
                                                    ))
                                                }
                                                filterSelectedOptions
                                                renderInput={(params) => (
                                                    <TextField
                                                        {...params}
                                                        label={i18next.t('propertyTypes.enum')}
                                                        error={touchedOptions && Boolean(errorOptions)}
                                                        helperText={touchedOptions && errorOptions}
                                                    />
                                                )}
                                                sx={{ width: '30%' }}
                                            />
                                        )}
                                        {value.type === 'pattern' && (
                                            <FastField
                                                component={TextField}
                                                label={i18next.t('propertyTypes.pattern')}
                                                id={pattern}
                                                name={pattern}
                                                value={value.pattern}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                                error={touchedPattern && Boolean(errorPattern)}
                                                helperText={touchedPattern && errorPattern}
                                                disabled={isDisabled}
                                                dir="ltr"
                                                sx={{ width: '30%' }}
                                            />
                                        )}
                                    </Grid>
                                    {value.type === 'pattern' && (
                                        <Grid item container>
                                            <FastField
                                                component={TextField}
                                                label={i18next.t('wizard.entityTemplate.customErrorMessage')}
                                                id={patternCustomErrorMessage}
                                                name={patternCustomErrorMessage}
                                                value={value.patternCustomErrorMessage}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                                error={touchedPatternCustomErrorMessage && Boolean(errorPatternCustomErrorMessage)}
                                                helperText={
                                                    touchedPatternCustomErrorMessage && errorPatternCustomErrorMessage
                                                        ? errorPatternCustomErrorMessage
                                                        : i18next.t('wizard.entityTemplate.customErrorMessageHelperText')
                                                }
                                                sx={{ width: '25%', marginRight: '5px' }}
                                            />
                                        </Grid>
                                    )}
                                    <Grid item container justifyContent="space-between">
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

export default FieldEditCard;
