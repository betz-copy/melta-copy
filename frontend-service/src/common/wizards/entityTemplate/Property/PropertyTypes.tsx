import {
    Alarm as CustomAlertIcon,
    Update as DailyAlertIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
    NotificationsActive as NotificationsActiveIcon,
    NotificationsOff as NotificationsOffIcon,
} from '@mui/icons-material';
import {
    Autocomplete,
    Backdrop,
    Box,
    Chip,
    CircularProgress,
    FormControlLabel,
    FormHelperText,
    Grid,
    IconButton,
    MenuItem,
    Popover,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Typography,
} from '@mui/material';
import { FormikErrors, FormikTouched } from 'formik';
import i18next from 'i18next';
import React, { SetStateAction, useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { IEntityTemplateMap } from '../../../../interfaces/entityTemplates';
import { deleteEnumFieldRequest, updateEnumFieldRequest } from '../../../../services/templates/entityTemplatesService';
import { AreYouSureDialog } from '../../../dialogs/AreYouSureDialog';
import { MinimizedColorPicker } from '../../../inputs/MinimizedColorPicker';
import TextArea from '../../../inputs/TextArea';
import MeltaCheckbox from '../../../MeltaDesigns/MeltaCheckbox';
import MeltaTooltip from '../../../MeltaDesigns/MeltaTooltip';
import { dateNotificationTypes } from '.././AddFields';
import KartoffelUserField from '.././KartoffelUserField';
import { CommonFormInputProperties } from '../commonInterfaces';
import RelationshipReferenceField from '../RelationshipReference/RelationshipReferenceField';

enum dateNotificationOptions {
    day = 1,
    week = 7,
    twoWeeks = 14,
    month = 30,
    threeMonths = 90,
    halfYear = 180,
}

const TooltipTitleWithLinesSpace = (title: string) => {
    return (
        <Box sx={{ whiteSpace: 'pre-wrap' }}>
            <Typography>{i18next.t(title)}</Typography>
        </Box>
    );
};

export interface PropertiesTypesProps {
    entity: string;
    value: CommonFormInputProperties;
    initialValue: CommonFormInputProperties | undefined;
    setValues?: (value: SetStateAction<CommonFormInputProperties>) => void;
    index: number;
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    templateId: string;
    setFieldValue: (field: keyof CommonFormInputProperties, value: any) => void;
    touched?: FormikTouched<CommonFormInputProperties>;
    errors?: FormikErrors<CommonFormInputProperties>;
    isDisabled: boolean;
    userPropertiesInTemplate?: string[];
    supportRelationshipReference: boolean;
    supportEditEnum?: boolean;
}

export const PropertiesTypes: React.FC<PropertiesTypesProps> = ({
    entity,
    value,
    initialValue,
    setValues,
    index,
    onChange,
    templateId,
    setFieldValue,
    touched,
    errors,
    isDisabled,
    userPropertiesInTemplate,
    supportRelationshipReference,
    supportEditEnum,
}) => {
    const walletInfo = i18next.t('wizard.entityTemplate.wallet.walletInfo', { returnObjects: true }) as string[];
    const queryClient = useQueryClient();

    const isComment = value.type === 'comment';

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
    const isDailyAlert = `properties[${index}].isDailyAlert`;
    const touchedDateNotification = touched?.dateNotification;
    const errorDateNotification = errors?.dateNotification;

    const [open, setOpen] = useState<boolean>(false);
    const [openDelete, setOpenDelete] = useState<boolean>(false);

    const [errorComment, setErrorComment] = useState(
        (typeof errors === 'string' && (errors as string)?.includes('comment')) || Boolean(errors?.comment),
    );

    const [localOption, setLocalOption] = useState<string>('');
    const [initialOptionArray, setInitialOptionArray] = useState<string[]>(initialValue?.options || []);
    const [editError, setEditError] = useState<string>('');
    const [editIndex, setEditIndex] = useState<number | null>(null);
    const [atLeastOneItem, setAtLeastOneItem] = useState<string | null>(null);

    const chipRefs = useRef<(HTMLDivElement | null)[]>([]);
    const MemoizedIconButton = React.memo(IconButton);

    useEffect(() => {
        setErrorComment((typeof errors === 'string' && (errors as string)?.includes('comment')) || Boolean(errors?.comment));
    }, [errors]);

    useEffect(() => {
        if (!editIndex) setEditError('');
    }, [editIndex]);

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
                if (editIndex !== null) {
                    const indexValue = initialOptionArray.indexOf(fieldValue.options[editIndex]);
                    if (indexValue !== -1) {
                        const tempInitialOptionArray = [...initialOptionArray];
                        tempInitialOptionArray[indexValue] = option;
                        setInitialOptionArray(tempInitialOptionArray);
                    }
                }
                const frontEndEnumValues = value.options.slice(initialOptionArray.length);
                const fieldProps = resultOfMutation.properties.properties[fieldValue.name];
                const newOptions = fieldProps.type === 'array' ? fieldProps.items!.enum! : fieldProps.enum!;
                queryClient.setQueryData<IEntityTemplateMap>('getEntityTemplates', (entityTemplateMap) => {
                    const newOptionColors = { ...fieldValue.optionColors };
                    if (fieldValue.optionColors && Object.keys(fieldValue.optionColors).length > 0 && editIndex != null) {
                        const newColor = fieldValue.optionColors[fieldValue.options[editIndex]];
                        delete newOptionColors[fieldValue.options[editIndex]];
                        newOptionColors[option] = newColor;
                    }
                    setValues?.((prev) => ({
                        ...prev,
                        options: newOptions.concat(frontEndEnumValues),
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
                if (editIndex !== null) {
                    const indexValue = initialOptionArray.indexOf(fieldValue.options[editIndex]);
                    if (indexValue !== -1) {
                        const tempInitialOptionArray = [...initialOptionArray];
                        tempInitialOptionArray.splice(indexValue, 1);
                        setInitialOptionArray(tempInitialOptionArray);
                    }
                }
                queryClient.setQueryData<IEntityTemplateMap>('getEntityTemplates', (entityTemplateMap) => {
                    const fieldProps = resultOfMutation.properties.properties[fieldValue.name];
                    const newOptions = fieldProps.type === 'array' ? fieldProps.items!.enum! : fieldProps.enum!;
                    const frontEndEnumValues = value.options.slice(newOptions.length + 1);
                    const newOptionColors = { ...fieldValue.optionColors };
                    if (fieldValue.optionColors && Object.keys(fieldValue.optionColors).length > 0 && editIndex != null) {
                        delete newOptionColors[fieldValue.options[editIndex]];
                    }
                    setValues?.((prev) => ({
                        ...prev,
                        options: newOptions.concat(frontEndEnumValues),
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

    const handleEditChange = (e, _tagIndex) => {
        e.preventDefault();
        setLocalOption(e.target.value);
        setEditError('');
    };

    const handleSaveEdit = (tagIndex: number) => {
        const checkIfOldEnumValue = initialOptionArray.length > tagIndex && isDisabled;
        const trimValue = localOption.trim();
        setEditError('');
        if (value.options[tagIndex] === trimValue) setEditIndex(null);
        else if (trimValue.length === 0) {
            setEditError('errorPage.emptyInputError');
        } else if (value.options.includes(trimValue)) {
            setEditError('errorPage.duplicateValue');
        } else if (checkIfOldEnumValue) {
            handleUpdateEnumField(templateId, tagIndex, trimValue, value);
            return;
        } else {
            const oldColor = value.optionColors?.[value.options[tagIndex]];
            const newOptions = value.options.map((option, valIndex) => (valIndex === tagIndex ? trimValue : option));

            if (oldColor) {
                const newOptionColors = { ...value.optionColors! };
                delete newOptionColors[value.options[tagIndex]];
                setValues?.((prev) => ({
                    ...prev,
                    optionColors: { ...newOptionColors, [trimValue]: oldColor },
                    options: newOptions,
                }));
            } else {
                setValues?.((prev) => ({
                    ...prev,
                    options: newOptions,
                }));
            }
            setEditIndex(null);
        }
        setOpen(false);
    };

    const handleDelete = (tagIndex: number) => {
        handleDeleteEnumField(templateId, tagIndex, value);
        setOpenDelete(false);
        setOpen(false);
    };

    const updateOldDisabledEnumVals = (currValue: string[]) => {
        const newValues = currValue.filter((_option, pos) => pos >= initialOptionArray.length);
        const initialOptions = value.options.slice(0, initialOptionArray.length);

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
            options: [...value.options.slice(0, initialOptionArray.length), ...newValues],
            optionColors: tempColors,
        }));
    };

    const handleUpdateEnumField = (id: string, tagIndex: number, option: string, fieldValue: any) => {
        updateEnumField({ id, tagIndex, option, fieldValue });
    };

    const handleDeleteEnumField = (id: string, tagIndex: number, fieldValue: any) => {
        if (fieldValue.options.length <= 1 || initialOptionArray.length <= 1) {
            setAtLeastOneItem(i18next.t('entityPage.atLeastOneItem'));
            setEditIndex(null);
            setTimeout(() => {
                setAtLeastOneItem(null);
            }, 2000);
            return;
        }
        deleteEnumField({ id, tagIndex, fieldValue });
    };

    return (
        <>
            {(value.type === 'enum' || value.type === 'enumArray') && (
                <Autocomplete
                    id={options}
                    multiple
                    options={value.options}
                    freeSolo
                    value={value.options}
                    onChange={(_e, currValue) => {
                        const lastValue = currValue.pop();
                        const trimmedValue = lastValue ? [...currValue, lastValue.trim()] : [];

                        if (isDisabled) {
                            updateOldDisabledEnumVals(trimmedValue);
                        } else {
                            setValues?.((prev) => ({
                                ...prev,
                                options: trimmedValue,
                            }));
                        }
                    }}
                    isOptionEqualToValue={(option, inputValue) => option.trim() === inputValue.trim() || option.trim().length === 0}
                    renderValue={(tagValue, getTagProps) =>
                        tagValue.map((option, tagIndex) => {
                            const chipDisabled = isDisabled && initialOptionArray.length > tagIndex;
                            return (
                                <Box position="relative" key={option}>
                                    <>
                                        <Chip
                                            variant="outlined"
                                            label={option}
                                            {...getTagProps({ index: tagIndex })}
                                            onDelete={chipDisabled ? undefined : getTagProps({ index: tagIndex }).onDelete}
                                            icon={value.optionColors && <Box width="1.3rem" />}
                                            sx={{
                                                position: 'relative',
                                                pr: supportEditEnum ? (chipDisabled ? '22px' : '32px') : '3px',
                                            }}
                                            ref={(ref) => {
                                                chipRefs.current[tagIndex] = ref;
                                            }}
                                        />
                                        {value.optionColors && (
                                            <MinimizedColorPicker
                                                color={value.optionColors[option]}
                                                onColorChange={(newColor) => {
                                                    setFieldValue('optionColors', {
                                                        ...value.optionColors,
                                                        [option]: newColor,
                                                    });
                                                }}
                                                circleSize="1.6rem"
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
                                                    setEditError('');
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
                                        slotProps={{
                                            paper: {
                                                style: {
                                                    zIndex: 10000,
                                                    borderRadius: '10px',
                                                },
                                            },
                                        }}
                                    >
                                        <Box
                                            p={2}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                borderColor: editError !== '' ? 'red' : 'inherit',
                                                borderStyle: editError !== '' ? 'solid' : 'inherit',
                                                borderWidth: '1px',
                                                borderRadius: '10px',
                                            }}
                                        >
                                            <Backdrop open={isDeleteLoading} style={{ zIndex: 999, backgroundColor: 'transparent' }} />
                                            <TextField
                                                key={editIndex}
                                                fullWidth
                                                value={localOption} // changed from local
                                                onChange={(e) => handleEditChange(e, tagIndex)}
                                                onKeyDown={(e) => {
                                                    e.stopPropagation();
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        const localOptionTrimmed = localOption.trim();

                                                        if (
                                                            tagIndex > initialOptionArray.length - 1 ||
                                                            value.options[tagIndex] === localOptionTrimmed ||
                                                            value.options.includes(localOptionTrimmed) ||
                                                            localOptionTrimmed.length === 0
                                                        ) {
                                                            setOpen(false);
                                                            handleSaveEdit(editIndex!);
                                                        } else setOpen(true);
                                                    }
                                                }}
                                            />
                                            {chipDisabled && (
                                                <IconButton
                                                    size="small"
                                                    onClick={() => {
                                                        if (!isDeleteLoading) {
                                                            setOpenDelete(true);
                                                        }
                                                    }}
                                                    disabled={isDeleteLoading}
                                                >
                                                    {isDeleteLoading ? <CircularProgress size={20} /> : <DeleteIcon />}
                                                </IconButton>
                                            )}
                                            {!!editError && (
                                                <Typography variant="body2" color="error">
                                                    {i18next.t(editError)}
                                                </Typography>
                                            )}
                                        </Box>
                                    </Popover>
                                </Box>
                            );
                        })
                    }
                    filterSelectedOptions
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label={i18next.t('propertyTypes.enum')}
                            error={(touchedOptions && Boolean(errorOptions)) || Boolean(atLeastOneItem)}
                            helperText={(touchedOptions && errorOptions) || atLeastOneItem}
                        />
                    )}
                    sx={{ marginRight: '5px' }}
                    fullWidth
                    disabled={value.deleted}
                />
            )}
            {value.type === 'pattern' && (
                <Grid container justifyContent="space-between" flexWrap="nowrap">
                    <TextField
                        label={i18next.t('propertyTypes.pattern')}
                        id={pattern}
                        name={pattern}
                        value={value.pattern}
                        onChange={onChange}
                        error={touchedPattern && Boolean(errorPattern)}
                        helperText={touchedPattern && errorPattern}
                        disabled={isDisabled || value.deleted}
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
                        disabled={value.deleted}
                    />
                </Grid>
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
                    disabled={isDisabled || value.deleted}
                    dir="ltr"
                    sx={{ marginRight: '5px' }}
                    fullWidth
                />
            )}
            {isComment && (
                <Grid position="relative" width="99.5%">
                    <TextArea
                        id={value.id}
                        value={value.comment}
                        label={i18next.t('propertyTypes.comment')}
                        onChange={(editorContentAsHtml: string) =>
                            setFieldValue('comment', editorContentAsHtml === '<p><br></p>' ? '' : editorContentAsHtml)
                        }
                        placeholder={i18next.t('propertyTypes.comment')}
                    />
                    {errorComment && <FormHelperText error>{i18next.t('validation.required')}</FormHelperText>}
                </Grid>
            )}
            {value.type === 'relationshipReference' && supportRelationshipReference && (
                <RelationshipReferenceField
                    value={value}
                    index={index}
                    touched={touched}
                    errors={errors}
                    setFieldValue={setFieldValue}
                    isDisabled={isDisabled}
                />
            )}
            {value.type === 'kartoffelUserField' && (
                <KartoffelUserField
                    value={value}
                    index={index}
                    touched={touched}
                    errors={errors}
                    setFieldValue={setFieldValue}
                    isDisabled={isDisabled}
                    userPropertiesInTemplate={userPropertiesInTemplate}
                />
            )}
            {(value.type === 'date' || value.type === 'date-time') &&
                'dateNotification' in value &&
                (value.dateNotification !== undefined ? (
                    <Grid container direction="row">
                        <Grid container direction="row">
                            <IconButton
                                onClick={() => setFieldValue('dateNotification', undefined)}
                                sx={{ borderRadius: 10 }}
                                disabled={value.deleted}
                            >
                                <NotificationsActiveIcon />
                            </IconButton>
                            <ToggleButtonGroup
                                exclusive
                                id={isDailyAlert}
                                color="primary"
                                size="small"
                                sx={{ height: '35px', marginLeft: '10px' }}
                                value={value.isDailyAlert ?? true}
                                onChange={(_event: React.MouseEvent<HTMLElement>, newIsDailyAlert: boolean) => {
                                    setFieldValue('isDailyAlert', newIsDailyAlert);
                                }}
                            >
                                <ToggleButton value>
                                    <MeltaTooltip title={i18next.t('wizard.entityTemplate.dailyAlert')}>
                                        <DailyAlertIcon />
                                    </MeltaTooltip>
                                </ToggleButton>
                                <ToggleButton value={false}>
                                    <MeltaTooltip
                                        title={
                                            <>
                                                <div>{i18next.t('wizard.entityTemplate.wallet.walletInfo')}</div>
                                                <ul>
                                                    {walletInfo.map((item, index) => (
                                                        <li key={index}>{item}</li>
                                                    ))}
                                                </ul>
                                            </>
                                        }
                                    >
                                        <CustomAlertIcon />
                                    </MeltaTooltip>
                                </ToggleButton>
                            </ToggleButtonGroup>
                            <FormControlLabel
                                control={
                                    <MeltaCheckbox
                                        checked={value.isDatePastAlert ?? true}
                                        onChange={(_e, checked) => {
                                            setValues?.((prev) => ({
                                                ...prev,
                                                isDatePastAlert: checked,
                                            }));
                                        }}
                                    />
                                }
                                style={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    marginRight: 'auto',
                                    marginLeft: 10,
                                }}
                                label={i18next.t('wizard.entityTemplate.datePastNotification')}
                            />
                        </Grid>
                        <TextField
                            select
                            label={i18next.t('wizard.entityTemplate.dateNotification')}
                            id={dateNotification}
                            name={dateNotification}
                            value={value.dateNotification ?? ''}
                            onChange={onChange}
                            error={touchedDateNotification && Boolean(errorDateNotification)}
                            helperText={touchedDateNotification && errorDateNotification}
                            sx={{ marginRight: '5px', marginTop: '5px' }}
                            fullWidth
                            disabled={value.deleted}
                        >
                            {dateNotificationTypes.map((notificationType) => (
                                <MenuItem key={notificationType} value={dateNotificationOptions[notificationType]}>
                                    {i18next.t(`wizard.entityTemplate.dateNotificationTypes.${notificationType}`)}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>
                ) : (
                    <IconButton onClick={() => setFieldValue('dateNotification', null)} sx={{ borderRadius: 10 }} disabled={value.deleted}>
                        <NotificationsOffIcon />
                    </IconButton>
                ))}
            <AreYouSureDialog
                open={open || openDelete}
                handleClose={() => {
                    setOpenDelete(false);
                    setOpen(false);
                }}
                onYes={() => {
                    if (openDelete) handleDelete(editIndex!);
                    else {
                        handleSaveEdit(editIndex!);
                    }
                }}
                isLoading={isLoading}
                body={`${i18next.t('areYouSureDialog.enumChangeDisclaimer')} ${entity}`}
            />
        </>
    );
};
