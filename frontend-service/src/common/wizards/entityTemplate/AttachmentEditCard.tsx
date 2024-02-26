import React, { memo } from 'react';
import { FormikErrors, FormikTouched } from 'formik';
import { TextField, Box, Grid, Card, CardContent, Switch, FormControlLabel, IconButton, MenuItem } from '@mui/material';
import { Delete as DeleteIcon, DragHandle as DragHandleIcon } from '@mui/icons-material';
import { Draggable } from 'react-beautiful-dnd';
import i18next from 'i18next';
import isEqual from 'lodash.isequal';
import { CommonFormInputProperties } from './commonInterfaces';

interface AttachmentEditCardProps {
    value: CommonFormInputProperties;
    index: number;
    isEditMode?: boolean;
    initialValue: CommonFormInputProperties | undefined;
    areThereAnyInstances?: boolean;
    touched?: FormikTouched<CommonFormInputProperties>;
    errors?: FormikErrors<CommonFormInputProperties>;
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    remove: (index: number) => any;
    supportChangeToRequiredWithInstances: boolean;
}

export const AttachmentEditCard: React.FC<AttachmentEditCardProps> = ({
    value,
    index,
    isEditMode,
    initialValue,
    areThereAnyInstances,
    touched,
    errors,
    onChange,
    remove,
    supportChangeToRequiredWithInstances,
}) => {
    console.log(value)
    const name = `attachmentProperties[${index}].name`;
    const touchedName = touched?.name;
    const errorName = errors?.name;

    const title = `attachmentProperties[${index}].title`;
    const touchedTitle = touched?.title;
    const errorTitle = errors?.title;
    const type = `properties[${index}].type`;

    const validPropertyTypes = ["fileId", "multipleFiles"];
    // TODO: implement array field on files
    // const type = `attachmentProperties[${index}].type`;

    const required = `attachmentProperties[${index}].required`;

    const isNewProperty = !initialValue;

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
                                        <TextField
                                            label={i18next.t('wizard.entityTemplate.attachmentName')}
                                            id={name}
                                            name={name}
                                            value={value.name}
                                            onChange={onChange}
                                            error={touchedName && Boolean(errorName)}
                                            helperText={touchedName && errorName}
                                            disabled={isDisabled}
                                            sx={{ width: '50%', marginRight: '5px' }}
                                        />
                                        <TextField
                                            label={i18next.t('wizard.entityTemplate.attachmentDisplayName')}
                                            id={title}
                                            name={title}
                                            value={value.title}
                                            onChange={onChange}
                                            error={touchedTitle && Boolean(errorTitle)}
                                            helperText={touchedTitle && errorTitle}
                                            sx={{ width: '50%', marginRight: '5px' }}
                                        />
                                        <TextField
                                            select
                                            type="text"
                                            label={i18next.t('wizard.entityTemplate.propertyType')}
                                            id={type}
                                            name={type}
                                            value={value.type}
                                            onChange={onChange}
                                            disabled={isDisabled}
                                            sx={{ marginRight: '5px' }}
                                            fullWidth
                                        >
                                            {validPropertyTypes
                                                .map((validType) => {
                                                    return(
                                                    <MenuItem key={validType} value={validType}>
                                                        {i18next.t(`propertyTypes.${validType}`)}
                                                    </MenuItem>
                                                )})}
                                        </TextField>
                                    </Grid>
                                    <Grid container justifyContent="space-between">
                                        <Box>
                                            {value.required !== undefined && (
                                                <FormControlLabel
                                                    control={
                                                        <Switch
                                                            id={required}
                                                            name={required}
                                                            onChange={onChange}
                                                            checked={value.required}
                                                            disabled={(supportChangeToRequiredWithInstances
                                                                ? false
                                                                : isEditMode &&
                                                                  areThereAnyInstances &&
                                                                  (isNewProperty || (!isNewProperty && !initialValue?.required)))}
                                                        />
                                                    }
                                                    label={i18next.t('validation.required')}
                                                />
                                            )}
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

export const MemoAttachmentEditCard = memo(
    AttachmentEditCard,
    (prev, next) =>
        prev.index === next.index &&
        prev.areThereAnyInstances === next.areThereAnyInstances &&
        isEqual(prev.value, next.value) &&
        isEqual(prev.touched, next.touched) &&
        isEqual(prev.errors, next.errors),
);
