import React, { memo, SetStateAction, useEffect, useRef, useState } from 'react';
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
    Popover,
    Backdrop,
    CircularProgress,
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
import { ThemeProvider } from '@mui/material/styles';
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { dateNotificationTypes, validPropertyTypes } from './AddFields';

import { CommonFormInputProperties } from './commonInterfaces';
import { MinimizedColorPicker } from '../../inputs/MinimizedColorPicker';
import { deleteEnumFieldRequest, updateEnumFieldRequest } from '../../../services/templates/enitityTemplatesService';
import { AreYouSureDialog } from '../../dialogs/AreYouSureDialog';
import { IEntityTemplateMap } from '../../../interfaces/entityTemplates';
import { MeltaTooltip } from '../../MeltaTooltip';
import { areYouSureTheme } from '../../../theme';

const UniqueCheckboxTooltipTitle = (
    <Box sx={{ whiteSpace: 'pre-wrap' }}>
        <Typography>{i18next.t('validation.uniqueTooltipTitle')}</Typography>
    </Box>
);

export interface FieldEditCardProps {
    entity: string;
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
    templateId: string;
    supportArrayFields: boolean;
    supportEditEnum?: boolean;
}

export const FieldEditCard: React.FC<FieldEditCardProps> = ({
    entity,
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
    templateId,
    supportArrayFields,
    supportEditEnum,
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
    const [duplicate, setDuplicate] = useState<boolean>(false);

    const chipRefs = useRef<(HTMLDivElement | null)[]>([]);
    const [open, setOpen] = useState<boolean>(false);
    const MemoizedIconButton = React.memo(IconButton);

    const handleEditChange = (e, _tagIndex) => {
        e.preventDefault();
        setLocalOption(e.target.value);
        setDuplicate(false);
    };
    const { mutate: updateEnumField, isLoading } = useMutation(
        (mutationArgs: { id: string; tagIndex: number; option: string; fieldValue: any }) => {
            const { id, tagIndex, option, fieldValue } = mutationArgs;
            return updateEnumFieldRequest(id, fieldValue.options[tagIndex], fieldValue, option);
        },
        {
            onError: () => {
                if (editIndex !== null) {
                    setLocalOption('');
                    setEditIndex(null);
                }
                toast.error(<div>{i18next.t('errorPage.updateEnumField')}</div>);
                setOpen(!open);
            },
            onSuccess: (resultOfMutation, { id, option, fieldValue }) => {
                const fieldProps = resultOfMutation.properties.properties[fieldValue.name];
                const newOptions = fieldProps.type === 'array' ? fieldProps.items!.enum! : fieldProps.enum!;
                queryClient.setQueryData<IEntityTemplateMap>('getEntityTemplates', (entityTemplateMap) => {
                    const newOptionColors = { ...fieldValue.optionColors };
                    if (fieldValue.optionColors && Object.keys(fieldValue.optionColors).length > 0 && editIndex != null) {
                        const color = fieldValue.optionColors[fieldValue.options[editIndex]];
                        delete newOptionColors[fieldValue.options[editIndex]];
                        newOptionColors[option] = color;
                    }
                    setValues?.((prev) => ({
                        ...prev,
                        options: newOptions,
                        optionColors: newOptionColors,
                    }));

                    entityTemplateMap!.set(id, resultOfMutation);
                    return entityTemplateMap!;
                });
                setEditIndex(null);
                toast.success(<div>{i18next.t('entityPage.updatedEnumFieldSuccessfully')}</div>);
                setOpen(!open);
            },
        },
    );

    const { mutate: deleteEnumField, isLoading: isDeleteLoading } = useMutation(
        (mutationArgs: { id: string; tagIndex: number; fieldValue: any }) => {
            const { id, tagIndex, fieldValue } = mutationArgs;
            return deleteEnumFieldRequest(id, fieldValue.options[tagIndex], fieldValue);
        },
        {
            onError: () => {
                if (editIndex !== null) {
                    setLocalOption('');
                    setEditIndex(null);
                }
                toast.error(<div>{i18next.t('errorPage.deleteFieldValue')}</div>);
            },
            onSuccess: (resultOfMutation, { id, fieldValue }) => {
                queryClient.setQueryData<IEntityTemplateMap>('getEntityTemplates', (entityTemplateMap) => {
                    const fieldProps = resultOfMutation.properties.properties[fieldValue.name];
                    const newOptions = fieldProps.type === 'array' ? fieldProps.items!.enum! : fieldProps.enum!;
                    const newOptionColors = { ...fieldValue.optionColors };
                    if (fieldValue.optionColors && Object.keys(fieldValue.optionColors).length > 0 && editIndex != null) {
                        delete newOptionColors[fieldValue.options[editIndex]];
                    }
                    setValues?.((prev) => ({
                        ...prev,
                        options: newOptions,
                        optionColors: newOptionColors,
                    }));
                    entityTemplateMap!.set(id, resultOfMutation);
                    return entityTemplateMap!;
                });
                setEditIndex(null);
                toast.success(<div>{i18next.t('entityPage.deleteEnumFieldSuccessfully')}</div>);
            },
        },
    );
    const handleUpdateEnumField = (id: string, tagIndex: number, option: string, fieldValue: any) => {
        updateEnumField({ id, tagIndex, option, fieldValue });
    };
    const handleDeleteEnumField = (id: string, tagIndex: number, fieldValue: any) => {
        deleteEnumField({ id, tagIndex, fieldValue });
    };

    useEffect(() => {
        if (!editIndex) setDuplicate(false);
    }, [editIndex]);

    const handleSaveEdit = (tagIndex: number) => {
        const checkIfOldEnumValue = initialEnumOptions.length > tagIndex && isDisabled;
        setDuplicate(false);
        if (value.options[tagIndex] === localOption) setEditIndex(null);
        else if (value.options.includes(localOption)) {
            setDuplicate(true);
        } else if (checkIfOldEnumValue) {
            handleUpdateEnumField(templateId, tagIndex, localOption, value);
            return;
        } else {
            const oldColor = value.optionColors?.[value.options[tagIndex]];
            const newOptions = value.options.map((option, valIndex) => (valIndex === tagIndex ? localOption : option));

            if (oldColor) {
                const newOptionColors = { ...value.optionColors! };
                delete newOptionColors[value.options[tagIndex]];
                setValues?.((prev) => ({ ...prev, optionColors: { ...newOptionColors, [localOption]: oldColor }, options: newOptions }));
            } else {
                setValues?.((prev) => ({ ...prev, options: newOptions }));
            }
            setEditIndex(null);
        }
        setOpen(false);
    };

    const handleDelete = (tagIndex: number) => {
        handleDeleteEnumField(templateId, tagIndex, value);
    };

    const updateOldDisabledEnumVals = (currValue: string[]) => {
        const newValues = currValue.filter((_option, pos) => pos >= initialEnumOptions.length);
        const initialOptions = value.options.slice(0, initialEnumOptions.length);

        const newOptions = [...initialOptions, ...newValues];

        const tempColors = Object.keys({ ...value.optionColors }).reduce((acc, key) => {
            if (newOptions.includes(key) && value.optionColors) {
                // eslint-disable-next-line no-param-reassign
                acc[key] = value.optionColors[key];
            }
            return acc;
        }, {});
        setValues?.((prev) => ({
            ...prev,
            options: [...value.options.slice(0, initialEnumOptions.length), ...newValues],
            optionColors: tempColors,
        }));
    };

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
                                                    if (validPropertyType === 'fileId' || validPropertyType === 'fileIdArray') return false; // TODO: support file inputs
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
                                        {(value.type === 'enum' || value.type === 'enumArray') && (
                                            <Autocomplete
                                                id={options}
                                                multiple
                                                options={value.options}
                                                freeSolo
                                                value={value.options}
                                                onChange={(_e, currValue) => {
                                                    if (isDisabled) {
                                                        updateOldDisabledEnumVals(currValue);
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
                                                                    {chipDisabled ? (
                                                                        <Chip
                                                                            variant="outlined"
                                                                            label={option}
                                                                            {...getTagProps({ index: tagIndex })}
                                                                            onDelete={undefined}
                                                                            icon={value.optionColors && <Box width="1.3rem" />}
                                                                            sx={{ position: 'relative', pr: supportEditEnum ? '22px' : '3px' }}
                                                                            ref={(ref) => {
                                                                                chipRefs.current[tagIndex] = ref;
                                                                            }}
                                                                        />
                                                                    ) : (
                                                                        <Chip
                                                                            variant="outlined"
                                                                            label={option}
                                                                            {...getTagProps({ index: tagIndex })}
                                                                            icon={value.optionColors && <Box width="1.3rem" />}
                                                                            sx={{ position: 'relative', pr: supportEditEnum ? '32px' : '3px' }}
                                                                            ref={(ref) => {
                                                                                chipRefs.current[tagIndex] = ref;
                                                                            }}
                                                                        />
                                                                    )}
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
                                                                    <Box
                                                                        p={2}
                                                                        style={{
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            borderColor: duplicate ? 'red' : 'inherit',
                                                                            borderStyle: duplicate ? 'solid' : 'inherit',
                                                                        }}
                                                                    >
                                                                        <Backdrop
                                                                            open={isDeleteLoading}
                                                                            style={{ zIndex: 999, backgroundColor: 'transparent' }}
                                                                        />
                                                                        <TextField
                                                                            key={editIndex}
                                                                            fullWidth
                                                                            value={localOption} // changed from local
                                                                            onChange={(e) => handleEditChange(e, tagIndex)}
                                                                            onKeyDown={(e) => {
                                                                                e.stopPropagation();
                                                                                if (e.key === 'Enter') {
                                                                                    e.preventDefault();
                                                                                    if (
                                                                                        tagIndex > initialEnumOptions.length - 1 ||
                                                                                        value.options[tagIndex] === localOption ||
                                                                                        value.options.includes(localOption)
                                                                                    ) {
                                                                                        setOpen(false);
                                                                                        handleSaveEdit(editIndex!);
                                                                                    } else setOpen(true);
                                                                                }
                                                                            }}
                                                                        />
                                                                        <IconButton
                                                                            size="small"
                                                                            onClick={() => {
                                                                                if (!isDeleteLoading) {
                                                                                    handleDelete(tagIndex);
                                                                                }
                                                                            }}
                                                                            disabled={isDeleteLoading}
                                                                        >
                                                                            {isDeleteLoading ? <CircularProgress size={20} /> : <DeleteIcon />}
                                                                        </IconButton>
                                                                        {duplicate && (
                                                                            <Typography variant="body2" color="error">
                                                                                {i18next.t('errorPage.duplicateValue')}
                                                                            </Typography>
                                                                        )}
                                                                    </Box>
                                                                </Popover>
                                                                <ThemeProvider theme={areYouSureTheme}>
                                                                    <AreYouSureDialog
                                                                        open={open}
                                                                        handleClose={() => {
                                                                            setOpen(false);
                                                                        }}
                                                                        onYes={() => {
                                                                            handleSaveEdit(editIndex!);
                                                                        }}
                                                                        isLoading={isLoading}
                                                                        message={`${i18next.t('areYouSureDialog.enumChangeDisclaimer')} ${entity}`}
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
                                                <MeltaTooltip title={UniqueCheckboxTooltipTitle}>
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
                                                </MeltaTooltip>
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
