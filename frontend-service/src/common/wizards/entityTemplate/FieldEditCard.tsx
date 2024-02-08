import React, { memo, SetStateAction, useRef, useState } from 'react';
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
    Tooltip,
    Typography,
    Popover,
} from '@mui/material';
import {
    Delete as DeleteIcon,
    DragHandle as DragHandleIcon,
    NotificationsActive as NotificationsActiveIcon,
    NotificationsOff as NotificationsOffIcon,
} from '@mui/icons-material';
import { Draggable } from 'react-beautiful-dnd';
import i18next from 'i18next';
import isEqual from 'lodash.isequal';
import EditIcon from '@mui/icons-material/Edit';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { dateNotificationTypes, validPropertyTypes } from './AddFields';

import { CommonFormInputProperties } from './commonInterfaces';
import { MinimizedColorPicker } from '../../inputs/MinimizedColorPicker';
import { updateListFieldRequest } from '../../../services/templates/enitityTemplatesService';
import { AreYouSureDialog } from '../../dialogs/AreYouSureDialog';
import { IEntityTemplateMap } from '../../../interfaces/entityTemplates';

const UniqueCheckboxTooltipTitle = (
    <Box sx={{ whiteSpace: 'pre-wrap' }}>
        <Typography>{i18next.t('validation.uniqueTooltipTitle')}</Typography>
    </Box>
);

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
    supportEditEnum: boolean;
    templateId: string;
}

export const FieldEditCard: React.FC<FieldEditCardProps> = ({
    value,
    index,
    isEditMode,
    initialValue,
    areThereAnyInstances,
    touched,
    errors,
    setFieldValue,
    setValues,
    onChange,
    remove,
    supportSerialNumberType,
    supportEntityReferenceType,
    supportChangeToRequiredWithInstances,
    supportEditEnum,
    templateId,
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
    const touchedDateNotification = touched?.dateNotification;
    const errorDateNotification = errors?.dateNotification;

    const required = `properties[${index}].required`;
    const preview = `properties[${index}].preview`;
    const hide = `properties[${index}].hide`;
    const unique = `properties[${index}].unique`;

    const initialEnumOptions = initialValue?.options || [];
    const isNewProperty = !initialValue;
    const isDisabled = Boolean(isEditMode && !isNewProperty && areThereAnyInstances);

    const [editIndex, setEditIndex] = useState<number | null>(null);

    const queryClient = useQueryClient();

    const [localOption, setLocalOption] = useState<string>('');

    const handleEditChange = (e, _tagIndex) => {
        e.preventDefault();
        setLocalOption(e.target.value);
    };

    const { mutate: updateListField, isLoading } = useMutation(
        (tagIndex: number) => {
            return updateListFieldRequest(templateId, value.options[tagIndex], value, localOption);
        },
        {
            onError: () => {
                if (editIndex !== null) {
                    setLocalOption('');
                    setEditIndex(null);
                    // only change to new value on success!
                }
            },
            onSuccess: (_resultOfMutation, tagIndex) => {
                queryClient.setQueryData<IEntityTemplateMap>('getEntityTemplates', (entityTemplateMap) => {
                    const prevEntityTemplate = entityTemplateMap!.get(templateId)!;

                    const newOptions = value.options.map((option, i) => {
                        if (tagIndex === i) {
                            return localOption;
                        }
                        return option;
                    });

                    if (value.optionColors && Object.keys(value.optionColors).length > 0 && editIndex != null) {
                        const color = value.optionColors[value.options[editIndex]];
                        const temp = value.optionColors;
                        delete temp[value.options[editIndex]];
                        if (prevEntityTemplate?.enumPropertiesColors?.[value.name]) {
                            prevEntityTemplate.enumPropertiesColors[value.name] = { ...temp, [localOption]: color };
                        }

                        setValues?.((prev) => ({
                            ...prev,
                            options: newOptions,
                            optionColors: { ...temp, [localOption]: color },
                        }));
                    } else {
                        setValues?.((prev) => ({
                            ...prev,
                            options: newOptions,
                        }));
                    }
                    prevEntityTemplate.properties.properties[value.name].enum = newOptions;
                    entityTemplateMap!.set(templateId, prevEntityTemplate);
                    return entityTemplateMap!;
                });
                setEditIndex(null);
            },
        },
    );

    const handleSaveEdit = async (tagIndex: number) => {
        if (value.options.includes(localOption)) {
            toast.error(<div>{i18next.t('errorPage.duplicateValue')}</div>);
            setLocalOption(value.options[tagIndex]);
        } else if (initialEnumOptions.length > tagIndex && isDisabled) {
            updateListField(tagIndex);
        } else {
            const oldColor = value.optionColors?.[value.options[tagIndex]];
            const newOptions = value.options.map((option, i) => {
                if (tagIndex === i) {
                    return localOption;
                }
                return option;
            });
            if (oldColor) {
                const temp = value.optionColors!;
                delete temp[value.options[tagIndex]];
                setValues?.((prev) => ({ ...prev, optionColors: { ...temp, [localOption]: oldColor }, options: newOptions }));
            } else {
                setValues?.((prev) => ({ ...prev, options: newOptions }));
            }
            setEditIndex(null);
        }
    };

    const theme = createTheme({
        components: {
            MuiBackdrop: {
                styleOverrides: {
                    root: {
                        backgroundColor: 'transparent',
                    },
                },
            },
            MuiDialog: {
                styleOverrides: {
                    paper: {
                        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.05)',
                        border: '1px solid #bdbdbd',
                    },
                },
            },
        },
    });

    const chipRefs = useRef<(HTMLDivElement | null)[]>([]);
    const [open, setOpen] = useState<boolean>(false);
    const MemoizedIconButton = React.memo(IconButton);

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
                                                    return true;
                                                })
                                                .map((validType) => (
                                                    <MenuItem key={validType} value={validType}>
                                                        {i18next.t(`propertyTypes.${validType}`)}
                                                    </MenuItem>
                                                ))}
                                        </TextField>
                                    </Grid>
                                    <Grid item container justifyContent="space-between" flexWrap="nowrap">
                                        {value.type === 'enum' && (
                                            <Autocomplete
                                                id={options}
                                                multiple
                                                options={value.options}
                                                freeSolo
                                                value={value.options}
                                                onChange={(_e, currValue) => {
                                                    if (isDisabled) {
                                                        const newValues = currValue.filter((_option, pos) => pos >= initialEnumOptions.length);
                                                        const newOptions = [
                                                            ...value.options.slice(0, initialEnumOptions.length),
                                                            ...newValues,
                                                        ]
                                                        const tempColors = {...value.optionColors};
                                                        for (const key in tempColors) {
                                                            if (!newOptions.includes(key)) {
                                                                delete tempColors[key];
                                                            }
                                                        }
                                                        setValues?.((prev) => ({
                                                            ...prev,
                                                            options: [
                                                                ...value.options.slice(0, initialEnumOptions.length),
                                                                ...newValues,],
                                                            optionColors: tempColors,
                                                            }));
                                                    } else {
                                                        setValues?.((prev) => ({
                                                            ...prev,
                                                            options: currValue,
                                                        }));
                                                    }
                                                }}
                                                renderTags={(tagValue, getTagProps) =>
                                                    tagValue.map((option, tagIndex) => {
                                                        const chipDisabled = isDisabled && initialEnumOptions.length > tagIndex;
                                                        return (
                                                            <Box position="relative" key={option}>
                                                                <>
                                                                    <Chip
                                                                        variant="outlined"
                                                                        label={option}
                                                                        {...getTagProps({ index: tagIndex })}
                                                                        disabled={chipDisabled}
                                                                        icon={value.optionColors && <Box width="1.3rem" />}
                                                                        sx={{ position: 'relative', pr: supportEditEnum ? '32px' : '3px' }}
                                                                        // eslint-disable-next-line no-return-assign
                                                                        ref={(ref) => (chipRefs.current[tagIndex] = ref)}
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
                                                                            style={{
                                                                                position: 'absolute',
                                                                                top: 4.5,
                                                                                left: 4.2,
                                                                                zIndex: 10000,
                                                                            }}
                                                                        />
                                                                    )}
                                                                    {supportEditEnum && (
                                                                        <MemoizedIconButton
                                                                            onClick={() => {
                                                                                setEditIndex(tagIndex);
                                                                                setLocalOption(value.options[tagIndex]);
                                                                            }}
                                                                            sx={{
                                                                                position: 'absolute',
                                                                                top: '50%',
                                                                                right: '8px',
                                                                                transform: 'translateY(-50%)',
                                                                                zIndex: 2000,
                                                                                backgroundColor: 'transparent',
                                                                                width: '1.6rem',
                                                                                height: '1.6rem',
                                                                                padding: 0,
                                                                            }}
                                                                        >
                                                                            <EditIcon />
                                                                        </MemoizedIconButton>
                                                                    )}
                                                                </>
                                                                <Popover
                                                                    open={editIndex === tagIndex}
                                                                    anchorEl={chipRefs.current[tagIndex]}
                                                                    onClose={() => {
                                                                        setEditIndex(null);
                                                                    }}
                                                                    anchorOrigin={{
                                                                        vertical: 'bottom',
                                                                        horizontal: 'center',
                                                                    }}
                                                                    transformOrigin={{
                                                                        vertical: 'top',
                                                                        horizontal: 'center',
                                                                    }}
                                                                    PaperProps={{
                                                                        style: {
                                                                            zIndex: 10000,
                                                                        },
                                                                    }}
                                                                >
                                                                    <Box p={2}>
                                                                        <TextField
                                                                            key={editIndex}
                                                                            fullWidth
                                                                            value={localOption} // changed from local
                                                                            onChange={(e) => handleEditChange(e, tagIndex)}
                                                                            onKeyDown={(e) => {
                                                                                e.stopPropagation();
                                                                                if (e.key === 'Enter') {
                                                                                    e.preventDefault();
                                                                                    if (tagIndex > initialEnumOptions.length - 1) {
                                                                                        setOpen(false);
                                                                                        handleSaveEdit(editIndex!);
                                                                                    } else setOpen(true);
                                                                                }
                                                                            }}
                                                                        />
                                                                    </Box>
                                                                </Popover>
                                                                <ThemeProvider theme={theme}>
                                                                    <AreYouSureDialog
                                                                        open={open}
                                                                        handleClose={() => {
                                                                            setOpen(false);
                                                                        }}
                                                                        onYes={() => {
                                                                            handleSaveEdit(editIndex!);
                                                                            setOpen(!open);
                                                                        }}
                                                                        isLoading={isLoading}
                                                                    />
                                                                </ThemeProvider>
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
                                                <Tooltip title={UniqueCheckboxTooltipTitle}>
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
                                                </Tooltip>
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

export const MemoFieldEditCard = memo(
    FieldEditCard,
    (prev, next) =>
        prev.index === next.index &&
        prev.areThereAnyInstances === next.areThereAnyInstances &&
        isEqual(prev.value, next.value) &&
        isEqual(prev.touched, next.touched) &&
        isEqual(prev.errors, next.errors),
);
