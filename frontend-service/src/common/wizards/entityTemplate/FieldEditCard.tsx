import React, { memo, SetStateAction, useState } from 'react';
import { FormikErrors, FormikTouched } from 'formik';
import {
    TextField,
    Box,
    MenuItem,
    Grid,
    Card,
    CardContent,
    Switch,
    FormControlLabel,
    IconButton,
    Chip,
    Autocomplete,
    Typography,
    Button,
    Checkbox,
} from '@mui/material';
import {
    Delete as DeleteIcon,
    Close as CloseIcon,
    DragHandle as DragHandleIcon,
    NotificationsActive as NotificationsActiveIcon,
    NotificationsOff as NotificationsOffIcon,
    AddCircle as AddCircleOutline,
} from '@mui/icons-material';
import { Draggable } from 'react-beautiful-dnd';
import i18next from 'i18next';
import isEqual from 'lodash.isequal';
import pickBy from 'lodash.pickby';
import { dateNotificationTypes, validPropertyTypes } from './AddFields';
import { CommonFormInputProperties } from './commonInterfaces';
import { MinimizedColorPicker } from '../../inputs/MinimizedColorPicker';
import IconButtonWithPopover from '../../IconButtonWithPopover';

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
    setUniqueConstraints?: (uniqueConstraints: { groupName: string; properties: string[] }[]) => void;
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
    const unique = `properties[${index}].unique`;

    const initialEnumOptions = initialValue?.options || [];
    const [addUniqueGroupCheckBox, setAddUniqueGroupCheckBox] = useState(false);
    const [createUniqueGroup, setCreateUniqueGroup] = useState(false);
    const [uniqueGroupName, setUniqueGroupName] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const createNewUniqueGroup = () => {
        if (uniqueGroupName) {
            const existingGroup = uniqueConstraints?.find((group) => group.groupName === uniqueGroupName);
            if (!existingGroup) {
                const newGroup = { groupName: uniqueGroupName, properties: [value.name] };
                const updatedConstraints = uniqueConstraints ? [...uniqueConstraints, newGroup] : [newGroup];
                setUniqueConstraints!(updatedConstraints);
                setIsProcessing(true);
                setAddUniqueGroupCheckBox(true);
                setCreateUniqueGroup(true);
            }
        }
    };

    const addToProperties = (selectedGroupName) => {
        const existingGroup = uniqueConstraints?.find((group) => group.groupName === uniqueGroupName);
        const propertyExists = uniqueConstraints?.some((group) => group.properties.includes(value.name));

        if (!existingGroup && !propertyExists) {
            const updatedConstraints = uniqueConstraints!.map((group) => {
                if (group.groupName === selectedGroupName) {
                    return {
                        ...group,
                        properties: [...group.properties, value.name],
                    };
                }
                return group;
            });
            setUniqueConstraints!(updatedConstraints);
        }
    };

    const deleteUniqueGroup = (groupName) => {
        const updatedConstraints = uniqueConstraints!
            .map((group) => ({
                ...group,
                properties: group.properties.filter((prop) => prop !== groupName),
            }))
            .filter((group) => group.groupName !== groupName);

        setUniqueConstraints!(updatedConstraints);
        setUniqueGroupName('');
        setCreateUniqueGroup(false);
        setIsProcessing(false);
    };

    const deletePropFromUniqueConstraints = (groupName, fieldName) => {
        const updatedConstraints = uniqueConstraints!.map((group) => {
            if (group.groupName === groupName) {
                return {
                    ...group,
                    properties: group.properties.filter((prop) => prop !== fieldName),
                };
            }
            return group;
        });
        setUniqueGroupName('');
        setUniqueConstraints!(updatedConstraints);
    };

    console.log({ uniqueConstraints });

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

                                                    // required is always set when serial in checked
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
                                                                    // unique is allowed only if required=true, automatic uncheck 'unique' too
                                                                    unique: !checked && prevValue.unique ? false : prevValue.unique,
                                                                }));
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
                                            {value.type !== 'serialNumber' && value.unique !== undefined && setValues && (
                                                // <MeltaTooltip title={UniqueCheckboxTooltipTitle}>
                                                <FormControlLabel
                                                    control={
                                                        <Switch
                                                            id={unique}
                                                            name={unique}
                                                            onChange={(_e, checked) => {
                                                                setValues((prevValue) => ({
                                                                    ...prevValue,
                                                                    unique: checked,
                                                                    // unique is allowed only if required=true, automatic check 'required' too
                                                                    required: checked ? true : prevValue.required,
                                                                }));
                                                            }}
                                                            checked={value.unique}
                                                        />
                                                    }
                                                    label={i18next.t('validation.unique')}
                                                />
                                                // </MeltaTooltip>
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
                                        {value.unique && (
                                            <Grid container direction="row">
                                                <Grid item container alignItems="center" flexWrap="nowrap">
                                                    <FormControlLabel
                                                        control={
                                                            <Checkbox
                                                                checked={addUniqueGroupCheckBox}
                                                                onChange={(e) => setAddUniqueGroupCheckBox(e.target.checked)}
                                                                name="addUniqueGroupCheckbox"
                                                            />
                                                        }
                                                        label={i18next.t('wizard.entityTemplate.createOrAddUniqueGroup')}
                                                    />
                                                </Grid>
                                                {addUniqueGroupCheckBox && (
                                                    <>
                                                        <Grid container direction="row" paddingBottom="10px">
                                                            {createUniqueGroup ? (
                                                                <>
                                                                    <IconButton
                                                                        aria-label="close"
                                                                        onClick={() => deleteUniqueGroup(uniqueGroupName)}
                                                                        disabled={
                                                                            !uniqueConstraints?.some(
                                                                                (group) =>
                                                                                    group.groupName === uniqueGroupName &&
                                                                                    group.properties.includes(value.name),
                                                                            )
                                                                        }
                                                                    >
                                                                        <CloseIcon />
                                                                    </IconButton>

                                                                    <TextField
                                                                        label={i18next.t('wizard.entityTemplate.uniqueGroupName')}
                                                                        value={uniqueGroupName}
                                                                        onChange={(e) => setUniqueGroupName(e.target.value)}
                                                                        sx={{ marginRight: '5px' }}
                                                                        error={touchedName && Boolean(errorName)}
                                                                        helperText={touchedName && errorName}
                                                                        disabled={isProcessing}
                                                                    />
                                                                    <Button
                                                                        type="button"
                                                                        variant="contained"
                                                                        style={{
                                                                            height: 'min-content',
                                                                            marginTop: '4px',
                                                                            marginRight: '5px',
                                                                        }}
                                                                        onClick={createNewUniqueGroup}
                                                                        disabled={isProcessing}
                                                                    >
                                                                        <Typography sx={{ fontSize: 'small' }}>
                                                                            {i18next.t('wizard.entityTemplate.addUniqueGrouptoList')}
                                                                        </Typography>
                                                                    </Button>
                                                                </>
                                                            ) : (
                                                                <IconButtonWithPopover
                                                                    iconButtonProps={{ onClick: () => setCreateUniqueGroup(true) }}
                                                                    popoverText={i18next.t('wizard.entityTemplate.createNewUniqueGroup')}
                                                                    placement="left"
                                                                    style={{ fontSize: 'small' }}
                                                                >
                                                                    <AddCircleOutline />
                                                                </IconButtonWithPopover>
                                                            )}
                                                        </Grid>
                                                        <Grid container direction="row">
                                                            <TextField
                                                                select
                                                                label={i18next.t('wizard.entityTemplate.selectExistingUniqueGroup')}
                                                                name={uniqueGroupName}
                                                                value={uniqueGroupName}
                                                                onChange={(e) => setUniqueGroupName(e.target.value)}
                                                                sx={{ marginRight: '5px' }}
                                                                fullWidth
                                                                SelectProps={{
                                                                    endAdornment: uniqueConstraints?.some(
                                                                        (group) => group.groupName === uniqueGroupName,
                                                                    ) && (
                                                                        <IconButton
                                                                            aria-label="delete"
                                                                            onClick={() => {
                                                                                deletePropFromUniqueConstraints(uniqueGroupName, value.name);
                                                                                setUniqueGroupName('');
                                                                            }}
                                                                        >
                                                                            <DeleteIcon />
                                                                        </IconButton>
                                                                    ),
                                                                }}
                                                            >
                                                                {uniqueConstraints?.map((group) => (
                                                                    <MenuItem
                                                                        key={group.groupName}
                                                                        value={group.groupName}
                                                                        onClick={() => addToProperties(group.groupName)}
                                                                    >
                                                                        <Grid container alignItems="center" justifyContent="space-between">
                                                                            <Grid item>{group.groupName}</Grid>
                                                                        </Grid>
                                                                    </MenuItem>
                                                                ))}
                                                            </TextField>
                                                        </Grid>
                                                    </>
                                                )}

                                                {/* {!addUniqueGroupCheckBox &&
                                                    setUniqueConstraints!((prevConstraints) => {
                                                        const newConstraints = [
                                                            ...prevConstraints,
                                                            {
                                                                groupName: value.name,
                                                                properties: [value.name],
                                                            },
                                                        ];
                                                        return newConstraints;
                                                    })} */}
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
