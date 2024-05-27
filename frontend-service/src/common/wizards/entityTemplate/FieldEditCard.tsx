import React, { memo, SetStateAction, useEffect } from 'react';
import { FormikErrors, FormikTouched } from 'formik';
import { TextField, Box, MenuItem, Grid, Card, CardContent, Switch, FormControlLabel, IconButton, Chip, Autocomplete } from '@mui/material';
import {
    Delete as DeleteIcon,
    DragHandle as DragHandleIcon,
    NotificationsActive as NotificationsActiveIcon,
    NotificationsOff as NotificationsOffIcon,
} from '@mui/icons-material';
import AddIcon from '@mui/icons-material/Add';
import { Draggable } from 'react-beautiful-dnd';
import i18next from 'i18next';
import isEqual from 'lodash.isequal';
import pickBy from 'lodash.pickby';
import { dateNotificationTypes, validPropertyTypes } from './AddFields';
import { CommonFormInputProperties } from './commonInterfaces';
import { MinimizedColorPicker } from '../../inputs/MinimizedColorPicker';
import { MeltaCheckbox } from '../../MeltaCheckbox';
import { MeltaTooltip } from '../../MeltaTooltip';
import { IUniqueConstraintOfTemplate } from '../../../interfaces/entities';

export interface FieldEditCardProps {
    value: CommonFormInputProperties;
    index: number;
    isEditMode?: boolean;
    initialValue: CommonFormInputProperties | undefined;
    areThereAnyInstances?: boolean;
    setValues?: (value: SetStateAction<CommonFormInputProperties>) => void;
    touched?: FormikTouched<CommonFormInputProperties>;
    errors?: FormikErrors<CommonFormInputProperties>;
    setFieldValue: (field: keyof CommonFormInputProperties, value: any) => void;
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    remove: (index: number) => any;
    supportSerialNumberType: boolean;
    supportEntityReferenceType: boolean;
    supportChangeToRequiredWithInstances: boolean;
    supportArrayFields: boolean;
    uniqueConstraints?: { groupName: string; properties: string[] }[];
    setUniqueConstraints?: (uniqueConstraints: SetStateAction<IUniqueConstraintOfTemplate[]>) => void;
}

export const FieldEditCard: React.FC<FieldEditCardProps> = ({
    value,
    index,
    isEditMode,
    initialValue,
    areThereAnyInstances,
    touched,
    errors,
    uniqueConstraints,
    setUniqueConstraints,
    setFieldValue,
    setValues,
    onChange,
    remove,
    supportSerialNumberType,
    supportEntityReferenceType,
    supportChangeToRequiredWithInstances,
    supportArrayFields,
}) => {
    const name = `properties[${index}].name`;
    const touchedName = touched?.name;
    const errorName = errors?.name;

    const title = `properties[${index}].title`;
    const touchedTitle = touched?.title;
    const errorTitle = errors?.title;

    const type = `properties[${index}].type`;
    const touchedType = touched?.type;
    const errorType = errors?.type;

    const pattern = `properties[${index}].pattern`;
    const touchedPattern = touched?.pattern;
    const errorPattern = errors?.pattern;

    const serialStarter = `properties[${index}].serialStarter`;
    const touchedSerialStarter = touched?.serialStarter;
    const errorSerialStarter = errors?.serialStarter;

    const patternCustomErrorMessage = `properties[${index}].patternCustomErrorMessage`;
    const touchedPatternCustomErrorMessage = touched?.patternCustomErrorMessage;
    const errorPatternCustomErrorMessage = errors?.patternCustomErrorMessage;

    const options = `properties[${index}].options`;
    const touchedOptions = touched?.options;
    const errorOptions = errors?.options;

    const dateNotification = `properties[${index}].dateNotification`;
    const calculateTime = `properties[${index}].calculateTime`;
    const touchedDateNotification = touched?.dateNotification;
    const errorDateNotification = errors?.dateNotification;

    const required = `properties[${index}].required`;
    const preview = `properties[${index}].preview`;
    const hide = `properties[${index}].hide`;

    const initialEnumOptions = initialValue?.options || [];
    const unique =
        value.type !== 'serialNumber' && uniqueConstraints!.filter((constraints) => constraints.properties.includes(value.name)).length > 0;
    const uniqueConstraintGroupName = uniqueConstraints!.find((constraint) => constraint.properties.includes(value.name))?.groupName!;

    const touchedUniqueGroupName = touched?.groupName;
    const errorUniqueGroupName = errors?.groupName;

    const createNewUniqueGroup = (groupName) => {
        if (groupName) {
            setUniqueConstraints!((prev) => {
                const existingGroup = prev?.find((group) => group.groupName === groupName);
                if (!existingGroup) {
                    const newGroup = { groupName, properties: [value.name] };
                    const updatedConstraints = (prev || []).map((group) => ({
                        ...group,
                        properties: group.properties.filter((prop) => prop !== value.name),
                    }));
                    updatedConstraints.push(newGroup);

                    const updatedConstraintsWithoutEmptyGroups = updatedConstraints.filter((group) => group.properties.length > 0);
                    return updatedConstraintsWithoutEmptyGroups;
                }
                return prev;
            });
        }
    };

    const addToProperties = (selectedGroupName) => {
        setUniqueConstraints!((prev) => {
            const existingGroup = prev?.find((group) => group.groupName === selectedGroupName);
            const propertyExists = existingGroup?.properties.includes(value.name);

            if (!propertyExists) {
                const updatedConstraints = (prev || [])
                    .map((group) => {
                        if (group.groupName === selectedGroupName) {
                            return {
                                ...group,
                                properties: [...group.properties, value.name],
                            };
                        }
                        if (group.properties.includes(value.name)) {
                            const updatedGroup = {
                                ...group,
                                properties: group.properties.filter((prop) => prop !== value.name),
                            };

                            if (!updatedGroup.properties.length) {
                                return null;
                            }
                            return updatedGroup;
                        }
                        return group;
                    })
                    .filter((group) => group !== null) as { groupName: string; properties: string[] }[];
                return updatedConstraints;
            }
            return prev;
        });
    };

    const createEmptyGroup = (fieldName) => {
        setUniqueConstraints!((prev) => {
            const existingGroup = prev?.find((group) => group.groupName === '' && group.properties.includes(fieldName));

            if (!existingGroup) {
                const newGroup = {
                    groupName: '',
                    properties: [fieldName],
                };
                const updatedConstraints = prev ? [...prev, newGroup] : [newGroup];
                return updatedConstraints;
            }
            return prev;
        });
    };

    const deletePropFromUniqueConstraints = (groupName, fieldName) => {
        setUniqueConstraints!((prev) => {
            const updatedConstraints = (prev || [])
                .map((group) => {
                    if (group.groupName === groupName) {
                        const updatedProperties = group.properties.filter((prop) => prop !== fieldName);
                        if (updatedProperties.length === 0) {
                            return null;
                        }
                        return {
                            ...group,
                            properties: updatedProperties,
                        };
                    }
                    return group;
                })
                .filter((group) => group !== null) as { groupName: string; properties: string[] }[];
            return updatedConstraints;
        });
    };

    const movePropAndCreateGroup = (fieldName) => {
        setUniqueConstraints!((prev) => {
            const existingGroupIndex = prev?.findIndex((group) => group.properties.includes(fieldName));

            if (existingGroupIndex !== -1) {
                const updatedConstraints = [...prev];

                const existingGroup = updatedConstraints[existingGroupIndex];
                const updatedProperties = existingGroup.properties.filter((prop) => prop !== fieldName);
                updatedConstraints[existingGroupIndex] = {
                    ...existingGroup,
                    properties: updatedProperties,
                };

                if (updatedProperties.length === 0) {
                    updatedConstraints.splice(existingGroupIndex, 1);
                }

                const newGroup = {
                    groupName: '',
                    properties: [fieldName],
                };
                updatedConstraints.push(newGroup);

                return updatedConstraints;
            }
            const newGroup = {
                groupName: '',
                properties: [fieldName],
            };
            const updatedConstraints = prev ? [...prev, newGroup] : [newGroup];
            return updatedConstraints;
        });
    };

    const deleteAndCreateEmptyGroup = (groupName) => {
        setUniqueConstraints!((prevConstraints) => {
            const groupToDelete = prevConstraints.find((group) => group.groupName === groupName);
            const updatedConstraints = prevConstraints.filter((group) => group.groupName !== groupName);
            groupToDelete!.properties.forEach((fieldName) => {
                const fieldInExistingGroup = updatedConstraints.some((group) => group.properties.includes(fieldName));
                if (!fieldInExistingGroup) {
                    updatedConstraints.push({ groupName: '', properties: [fieldName] });
                }
            });
            setValues!((prevValue) => ({
                ...prevValue,
                groupName: undefined,
            }));

            return updatedConstraints;
        });
    };

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
                                    <Grid container wrap="nowrap" marginBottom="0.4rem">
                                        <TextField
                                            label={i18next.t('wizard.entityTemplate.propertyName')}
                                            id={name}
                                            name={name}
                                            value={value.name}
                                            onChange={onChange}
                                            error={touchedName && Boolean(errorName)}
                                            helperText={touchedName && errorName}
                                            disabled={isDisabled}
                                            sx={{ marginRight: '5px' }}
                                            fullWidth
                                        />
                                        <TextField
                                            label={i18next.t('wizard.entityTemplate.propertyDisplayName')}
                                            id={title}
                                            name={title}
                                            value={value.title}
                                            onChange={onChange}
                                            error={touchedTitle && Boolean(errorTitle)}
                                            helperText={touchedTitle && errorTitle}
                                            sx={{ marginRight: '5px' }}
                                            fullWidth
                                        />
                                        <TextField
                                            select
                                            type="text"
                                            label={i18next.t('wizard.entityTemplate.propertyType')}
                                            id={type}
                                            name={type}
                                            value={value.type}
                                            onChange={(e) => {
                                                setValues?.((prevValue) => ({
                                                    ...prevValue,
                                                    type: e.target.value,
                                                    required: e.target.value === 'serialNumber',
                                                }));
                                            }}
                                            error={touchedType && Boolean(errorType)}
                                            helperText={touchedType && errorType}
                                            disabled={isDisabled}
                                            sx={{ marginRight: '5px' }}
                                            fullWidth
                                        >
                                            {validPropertyTypes
                                                .filter((validPropertyType) => {
                                                    if (validPropertyType === 'entityReference') return supportEntityReferenceType;
                                                    if (validPropertyType === 'serialNumber') {
                                                        if (!supportSerialNumberType) return false;

                                                        return !areThereAnyInstances;
                                                    }
                                                    if (validPropertyType === 'enumArray') return supportArrayFields;
                                                    if (validPropertyType === 'fileId' || validPropertyType === 'multipleFiles') return false; // TODO: support file inputs
                                                    return true;
                                                })
                                                .map((validType) => {
                                                    return (
                                                        <MenuItem key={validType} value={validType}>
                                                            {i18next.t(`propertyTypes.${validType}`)}
                                                        </MenuItem>
                                                    );
                                                })}
                                        </TextField>
                                    </Grid>
                                    <Grid item container justifyContent="space-between" flexWrap="nowrap">
                                        {(value.type === 'enum' || value.type === 'enumArray') && (
                                            <Autocomplete
                                                id={options}
                                                multiple
                                                options={value.options}
                                                freeSolo
                                                value={value.options}
                                                onChange={(_e, currValue) => {
                                                    if (isDisabled) {
                                                        const newValues = currValue.filter((option) => initialEnumOptions.indexOf(option) === -1);

                                                        setFieldValue('options', [...initialEnumOptions, ...newValues]);
                                                    } else {
                                                        setValues?.((prev) => ({
                                                            ...prev,
                                                            options: currValue,
                                                            // remove optionColors of deleted enum options
                                                            optionColors: pickBy(prev.optionColors, (_colors, option) => currValue.includes(option)),
                                                        }));
                                                    }
                                                }}
                                                renderTags={(tagValue, getTagProps) =>
                                                    tagValue.map((option: string, tagIndex: number) => {
                                                        const chipDisabled = isDisabled && initialEnumOptions.includes(option);

                                                        return (
                                                            <Box position="relative" key={option}>
                                                                <Chip
                                                                    variant="outlined"
                                                                    label={option}
                                                                    {...getTagProps({ index: tagIndex })}
                                                                    disabled={chipDisabled}
                                                                    icon={value.optionColors && <Box width="1.3rem" />}
                                                                />
                                                                {value.optionColors && (
                                                                    <MinimizedColorPicker
                                                                        color={value.optionColors[option]}
                                                                        onColorChange={(color) => {
                                                                            setFieldValue('optionColors', {
                                                                                ...value.optionColors,
                                                                                [option]: color,
                                                                            });
                                                                        }}
                                                                        circleSize="1.6rem"
                                                                        width="30rem"
                                                                        style={{ position: 'absolute', top: 4.5, left: 4.2, zIndex: 2000 }}
                                                                    />
                                                                )}
                                                            </Box>
                                                        );
                                                    })
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
                                                sx={{ marginRight: '5px' }}
                                                fullWidth
                                            />
                                        )}
                                        {value.type === 'pattern' && (
                                            <>
                                                <TextField
                                                    label={i18next.t('propertyTypes.pattern')}
                                                    id={pattern}
                                                    name={pattern}
                                                    value={value.pattern}
                                                    onChange={onChange}
                                                    error={touchedPattern && Boolean(errorPattern)}
                                                    helperText={touchedPattern && errorPattern}
                                                    disabled={isDisabled}
                                                    dir="ltr"
                                                    sx={{ marginRight: '5px' }}
                                                    fullWidth
                                                />
                                                <TextField
                                                    label={i18next.t('wizard.entityTemplate.customErrorMessage')}
                                                    id={patternCustomErrorMessage}
                                                    name={patternCustomErrorMessage}
                                                    value={value.patternCustomErrorMessage}
                                                    onChange={onChange}
                                                    error={touchedPatternCustomErrorMessage && Boolean(errorPatternCustomErrorMessage)}
                                                    helperText={
                                                        touchedPatternCustomErrorMessage && errorPatternCustomErrorMessage
                                                            ? errorPatternCustomErrorMessage
                                                            : i18next.t('wizard.entityTemplate.customErrorMessageHelperText')
                                                    }
                                                    sx={{ marginRight: '5px' }}
                                                    fullWidth
                                                />
                                            </>
                                        )}
                                        {value.type === 'serialNumber' && (
                                            <TextField
                                                label={i18next.t('wizard.entityTemplate.serialStarter')}
                                                id={serialStarter}
                                                name={serialStarter}
                                                value={value.serialStarter}
                                                onChange={(e) => {
                                                    setFieldValue('serialStarter', Number(e.target.value));
                                                }}
                                                type="number"
                                                error={touchedSerialStarter && Boolean(errorSerialStarter)}
                                                helperText={touchedSerialStarter && errorSerialStarter}
                                                disabled={isDisabled}
                                                dir="ltr"
                                                sx={{ marginRight: '5px' }}
                                                fullWidth
                                            />
                                        )}
                                        {(value.type === 'date' || value.type === 'date-time') &&
                                            'dateNotification' in value &&
                                            (value.dateNotification !== undefined ? (
                                                <Grid container direction="row">
                                                    <IconButton
                                                        onClick={() => setFieldValue('dateNotification', undefined)}
                                                        sx={{ borderRadius: 10 }}
                                                    >
                                                        <NotificationsActiveIcon />
                                                    </IconButton>
                                                    <TextField
                                                        select
                                                        label={i18next.t('wizard.entityTemplate.dateNotification')}
                                                        id={dateNotification}
                                                        name={dateNotification}
                                                        value={value.dateNotification ?? ''}
                                                        onChange={onChange}
                                                        error={touchedDateNotification && Boolean(errorDateNotification)}
                                                        helperText={touchedDateNotification && errorDateNotification}
                                                        sx={{ marginRight: '5px' }}
                                                        fullWidth
                                                    >
                                                        {dateNotificationTypes.map((notificationType) => (
                                                            <MenuItem key={notificationType} value={notificationType}>
                                                                {i18next.t(`wizard.entityTemplate.dateNotificationTypes.${notificationType}`)}
                                                            </MenuItem>
                                                        ))}
                                                    </TextField>
                                                </Grid>
                                            ) : (
                                                <IconButton onClick={() => setFieldValue('dateNotification', null)} sx={{ borderRadius: 10 }}>
                                                    <NotificationsOffIcon />
                                                </IconButton>
                                            ))}
                                    </Grid>
                                    <Grid item container justifyContent="space-between">
                                        <Box>
                                            {value.required !== undefined && setValues && (
                                                <FormControlLabel
                                                    control={
                                                        <Switch
                                                            id={required}
                                                            name={required}
                                                            onChange={(_e, checked) => {
                                                                setValues((prevValue) => ({
                                                                    ...prevValue,
                                                                    required: checked,
                                                                }));
                                                                // unique is allowed only if required=true, automatic uncheck 'unique' too
                                                                if (!checked && unique) {
                                                                    deletePropFromUniqueConstraints(uniqueConstraintGroupName, value.name);
                                                                }
                                                            }}
                                                            disabled={
                                                                value.type === 'serialNumber' ||
                                                                value.type === 'boolean' ||
                                                                (supportChangeToRequiredWithInstances
                                                                    ? false
                                                                    : isEditMode &&
                                                                      areThereAnyInstances &&
                                                                      (isNewProperty || (!isNewProperty && !initialValue?.required)))
                                                            }
                                                            checked={value.required}
                                                        />
                                                    }
                                                    label={i18next.t('validation.required')}
                                                />
                                            )}
                                            {value.preview !== undefined && (
                                                <FormControlLabel
                                                    control={
                                                        <Switch
                                                            id={preview}
                                                            name={preview}
                                                            onChange={onChange}
                                                            disabled={value.hide}
                                                            checked={value.preview}
                                                        />
                                                    }
                                                    label={i18next.t('validation.preview')}
                                                />
                                            )}
                                            {value.hide !== undefined && (
                                                <FormControlLabel
                                                    control={
                                                        <Switch
                                                            id={hide}
                                                            name={hide}
                                                            onChange={onChange}
                                                            disabled={value.preview}
                                                            checked={value.hide}
                                                        />
                                                    }
                                                    label={i18next.t('validation.hide')}
                                                />
                                            )}
                                            {unique !== undefined && setValues && value.type !== 'serialNumber' && (
                                                <FormControlLabel
                                                    control={
                                                        <Switch
                                                            id={String(unique)}
                                                            name={String(unique)}
                                                            checked={unique}
                                                            onChange={(_e, checked) => {
                                                                setValues((prevValue) => ({
                                                                    ...prevValue,
                                                                    required: checked ? true : prevValue.required,
                                                                    groupName: undefined,
                                                                    uniqueCheckbox: false,
                                                                }));
                                                                if (checked) {
                                                                    createEmptyGroup(value.name);
                                                                } else {
                                                                    deletePropFromUniqueConstraints(uniqueConstraintGroupName, value.name);
                                                                }
                                                            }}
                                                        />
                                                    }
                                                    label={i18next.t('validation.unique')}
                                                />
                                            )}
                                            {(value.type === 'date' || value.type === 'date-time') && 'calculateTime' in value && (
                                                <FormControlLabel
                                                    control={
                                                        <Switch
                                                            id={calculateTime}
                                                            name={calculateTime}
                                                            onChange={onChange}
                                                            checked={value.calculateTime ?? false}
                                                        />
                                                    }
                                                    label={i18next.t('validation.calculateTime')}
                                                />
                                            )}
                                        </Box>

                                        <IconButton disabled={isDisabled} onClick={() => remove(index)}>
                                            <DeleteIcon />
                                        </IconButton>
                                    </Grid>
                                    <Grid item container justifyContent="space-between" alignItems="center" flexWrap="nowrap">
                                        {unique && value.type !== 'serialNumber' && (
                                            <Grid container direction="row">
                                                <Grid item container alignItems="center" flexWrap="nowrap">
                                                    <MeltaTooltip title={i18next.t('validation.uniqueTooltipTitle')}>
                                                        <FormControlLabel
                                                            control={
                                                                <MeltaCheckbox
                                                                    checked={value.uniqueCheckbox}
                                                                    onChange={(_e, checked) => {
                                                                        setValues!((prevValue) => ({
                                                                            ...prevValue,
                                                                            uniqueCheckbox: checked,
                                                                        }));
                                                                        if (!checked) {
                                                                            movePropAndCreateGroup(value.name);
                                                                        }
                                                                    }}
                                                                />
                                                            }
                                                            label={i18next.t('wizard.entityTemplate.createOrAddUniqueGroup')}
                                                        />
                                                    </MeltaTooltip>
                                                </Grid>
                                                {value.uniqueCheckbox && (
                                                    <Autocomplete
                                                        id={uniqueConstraintGroupName}
                                                        value={uniqueConstraintGroupName}
                                                        fullWidth
                                                        freeSolo
                                                        disableClearable
                                                        options={
                                                            Array.isArray(uniqueConstraints)
                                                                ? uniqueConstraints
                                                                      .filter((group) => group.groupName !== '')
                                                                      ?.map((group) => group.groupName)
                                                                : []
                                                        }
                                                        onChange={(_event, newValue) => {
                                                            if (newValue !== null) {
                                                                addToProperties(newValue);
                                                                setValues!((prevValue) => ({
                                                                    ...prevValue,
                                                                    groupName: newValue,
                                                                }));
                                                            }
                                                        }}
                                                        renderInput={(params) => (
                                                            <div style={{ position: 'relative' }}>
                                                                <TextField
                                                                    {...params}
                                                                    label={i18next.t('wizard.entityTemplate.createOrAddUniqueGroup')}
                                                                    error={touchedUniqueGroupName && Boolean(errorUniqueGroupName)}
                                                                    helperText={touchedUniqueGroupName && errorUniqueGroupName}
                                                                    sx={{ marginRight: '5px' }}
                                                                    fullWidth
                                                                    InputProps={{
                                                                        ...params.InputProps,
                                                                        endAdornment: (
                                                                            <>
                                                                                {params.InputProps.endAdornment}
                                                                                {uniqueConstraintGroupName !== '' &&
                                                                                    params.inputProps.value === uniqueConstraintGroupName &&
                                                                                    uniqueConstraints?.some(
                                                                                        (group) => group.groupName === uniqueConstraintGroupName,
                                                                                    ) && (
                                                                                        <IconButton
                                                                                            aria-label="delete"
                                                                                            onClick={() => {
                                                                                                deleteAndCreateEmptyGroup(uniqueConstraintGroupName);
                                                                                            }}
                                                                                        >
                                                                                            <DeleteIcon />
                                                                                        </IconButton>
                                                                                    )}
                                                                            </>
                                                                        ),
                                                                    }}
                                                                />

                                                                {params.inputProps.value &&
                                                                    !uniqueConstraints?.some(
                                                                        (group) => group.groupName === params.inputProps.value,
                                                                    ) && (
                                                                        <IconButton
                                                                            aria-label="create"
                                                                            onClick={() => {
                                                                                createNewUniqueGroup(params.inputProps.value);
                                                                                setValues!((prevValue) => ({
                                                                                    ...prevValue,
                                                                                    groupName: String(params.inputProps.value),
                                                                                }));
                                                                            }}
                                                                            style={{
                                                                                position: 'absolute',
                                                                                left: 10,
                                                                                top: '50%',
                                                                                transform:
                                                                                    touchedUniqueGroupName && errorUniqueGroupName
                                                                                        ? 'translateY(-80%)'
                                                                                        : 'translateY(-50%)',
                                                                            }}
                                                                        >
                                                                            <AddIcon />
                                                                        </IconButton>
                                                                    )}
                                                            </div>
                                                        )}
                                                    />
                                                )}
                                            </Grid>
                                        )}
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

export const MemoFieldEditCard = memo(
    FieldEditCard,
    (prev, next) =>
        prev.index === next.index &&
        prev.areThereAnyInstances === next.areThereAnyInstances &&
        isEqual(prev.value, next.value) &&
        isEqual(prev.touched, next.touched) &&
        isEqual(prev.errors, next.errors) &&
        isEqual(prev.uniqueConstraints, next.uniqueConstraints),
);
