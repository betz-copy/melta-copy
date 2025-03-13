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
    ToggleButtonGroup,
    ToggleButton,
    Popover,
    Backdrop,
    CircularProgress,
} from '@mui/material';
import {
    Delete as DeleteIcon,
    DeleteForever as DeleteOff,
    DragHandle as DragHandleIcon,
    NotificationsActive as NotificationsActiveIcon,
    NotificationsOff as NotificationsOffIcon,
    Alarm as CustomAlertIcon,
    Update as DailyAlertIcon,
    Archive,
    Unarchive,
    AddLocationAlt,
    WrongLocation,
} from '@mui/icons-material';
import AddIcon from '@mui/icons-material/Add';
import { Draggable } from 'react-beautiful-dnd';
import i18next from 'i18next';
import isEqual from 'lodash.isequal';
import EditIcon from '@mui/icons-material/Edit';
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { dateNotificationTypes, validPropertyTypes } from './AddFields';
import { CommonFormInputProperties, IRelationshipReference } from './commonInterfaces';
import { MinimizedColorPicker } from '../../inputs/MinimizedColorPicker';
import { MeltaCheckbox } from '../../MeltaCheckbox';
import { arrayTypes, deleteEnumFieldRequest, updateEnumFieldRequest } from '../../../services/templates/enitityTemplatesService';
import { AreYouSureDialog } from '../../dialogs/AreYouSureDialog';
import { IEntityTemplateMap } from '../../../interfaces/entityTemplates';
import { MeltaTooltip } from '../../MeltaTooltip';
import { IUniqueConstraintOfTemplate } from '../../../interfaces/entities';
import RelationshipReferenceField from './RelationshipReferenceField';
import { PermissionScope } from '../../../interfaces/permissions';
import { useUserStore } from '../../../stores/user';
import { SelectCheckbox } from '../../SelectCheckBox';
// import { IKartoffelUser } from '../../../interfaces/users';
import { environment } from '../../../globals';

const { mapSearchPropertiesLimit } = environment.map;

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
    remove: (index: number, isNewProperty: boolean) => any;
    supportSerialNumberType: boolean;
    supportEntityReferenceType: boolean;
    supportChangeToRequiredWithInstances: boolean;
    templateId: string;
    supportArrayFields: boolean;
    supportDeleteForExistingInstances: boolean;
    supportRelationshipReference: boolean;
    supportUserType: boolean;
    uniqueConstraints?: IUniqueConstraintOfTemplate[];
    setUniqueConstraints?: (uniqueConstraints: SetStateAction<IUniqueConstraintOfTemplate[]>) => void;
    supportEditEnum?: boolean;
    supportUnique?: boolean;
    supportLocation?: boolean;
    supportArchive?: boolean;
    supportIdentifier?: boolean;
    hasIdentifier?: boolean;
    locationSearchFields?: { show: boolean; disabled: boolean };
    hasActions?: boolean;
    supportConvertingToMultipleFields?: boolean;
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
    uniqueConstraints,
    setUniqueConstraints,
    setFieldValue,
    setValues,
    onChange,
    remove,
    supportSerialNumberType,
    supportUserType,
    supportEntityReferenceType,
    supportChangeToRequiredWithInstances,
    templateId,
    supportArrayFields,
    supportDeleteForExistingInstances,
    supportRelationshipReference,
    supportEditEnum,
    supportUnique,
    supportLocation,
    supportIdentifier,
    hasIdentifier,
    supportArchive,
    locationSearchFields,
    hasActions,
    supportConvertingToMultipleFields = true,
}) => {
    const currentUser = useUserStore((state) => state.user);

    const isText = value.type === 'string' || value.type === 'text-area';

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
    const isDailyAlert = `properties[${index}].isDailyAlert`;
    const calculateTime = `properties[${index}].calculateTime`;
    const touchedDateNotification = touched?.dateNotification;
    const errorDateNotification = errors?.dateNotification;

    const required = `properties[${index}].required`;
    const preview = `properties[${index}].preview`;
    const hide = `properties[${index}].hide`;
    const readOnly = `properties[${index}].readOnly`;
    const identifier = `properties[${index}].identifier`;

    const unique =
        value.type === 'serialNumber' ||
        (uniqueConstraints && uniqueConstraints.filter((constraints) => constraints.properties.includes(value.name)).length > 0);
    const uniqueConstraintGroupName = uniqueConstraints
        ? uniqueConstraints.find((constraint) => constraint.properties.includes(value.name))?.groupName
        : '';

    const touchedUniqueGroupName = touched?.groupName;
    const errorUniqueGroupName = errors?.groupName;

    const isIdentifierAble = isText || value.type === 'number' || value.type === 'pattern' || value.type === 'serialNumber';

    const mapSearchDisabled = !value.mapSearch && locationSearchFields?.disabled;

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

    const [editIndex, setEditIndex] = useState<number | null>(null);

    const queryClient = useQueryClient();
    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;

    const relationshipRefs = Array.from(entityTemplates.values()).reduce((acc: IRelationshipReference[], template) => {
        const properties = template.properties?.properties || {};

        const references = Object.values(properties).reduce((refAcc: IRelationshipReference[], property) => {
            if (property.format === 'relationshipReference' && property.relationshipReference) refAcc.push(property.relationshipReference);

            return refAcc;
        }, []);

        return acc.concat(references);
    }, []);

    const disableRemoveRequire = Boolean(
        relationshipRefs.find((ref) => ref.relatedTemplateField === value.name && ref.relatedTemplateId === templateId) !== undefined,
    );

    const [localOption, setLocalOption] = useState<string>('');
    const [editError, setEditError] = useState<string>('');

    const chipRefs = useRef<(HTMLDivElement | null)[]>([]);
    const [open, setOpen] = useState<boolean>(false);
    const [openDelete, setOpenDelete] = useState<boolean>(false);
    const MemoizedIconButton = React.memo(IconButton);

    const [initialOptionArray, setInitialOptionArray] = useState<string[]>(initialValue?.options || []);

    // const userFields = [{ displayName: 'fullName' }, { displayName: 'jobTitle' }, { displayName: 'hierarchy' }, { displayName: 'mail' }]; // TODO: get relevant fields

    // const keys = Object.keys({} as IKartoffelUser) as (keyof IKartoffelUser)[];

    const userFields: string[] = [
        'displayName',
        'identityCard',
        'personalNumber',
        'goalUserId',
        'employeeNumber',
        'employeeId',
        'organization',
        'serviceType',
        'firstName',
        'lastName',
        'akaUnit',
        'rank',
        'mail',
        'jobTitle',
        'phone',
        'mobilePhone',
        'address',
        'fullClearance',
        'sex',
        'birthDate',
        'directGroup',
        'hierarchy',
    ];

    // const [userFieldsToShowCheckbox, setUserFieldsToShowCheckbox] = useState<string[]>([]);
    // TODO: lir
    const [expandUserFields, setExpandUserFields] = useState<boolean>(!!value.expandedUserFields?.length);

    const handleEditChange = (e, _tagIndex) => {
        e.preventDefault();
        setLocalOption(e.target.value);
        setEditError('');
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
                        const color = fieldValue.optionColors[fieldValue.options[editIndex]];
                        delete newOptionColors[fieldValue.options[editIndex]];
                        newOptionColors[option] = color;
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

    const [atLeastOneItem, setAtLeastOneItem] = useState<string | null>(null);

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

    useEffect(() => {
        if (!editIndex) setEditError('');
    }, [editIndex]);

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
                setValues?.((prev) => ({ ...prev, optionColors: { ...newOptionColors, [trimValue]: oldColor }, options: newOptions }));
            } else {
                setValues?.((prev) => ({ ...prev, options: newOptions }));
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

    const archiveButtonTooltip = () => {
        if (value.required) return i18next.t('wizard.entityTemplate.cannotArchiveIfRequired');
        if (value.uniqueCheckbox) return i18next.t('wizard.entityTemplate.cannotArchiveIfUnique');
        if (value.preview) return i18next.t('wizard.entityTemplate.cannotArchiveIfPreview');
        if (value.archive) return i18next.t('wizard.entityTemplate.removeFromArchive');
        return i18next.t('wizard.entityTemplate.moveToArchive');
    };

    return (
        <Draggable draggableId={value.id} index={index}>
            {(draggableProvided) => (
                <Grid item ref={draggableProvided.innerRef} {...draggableProvided.draggableProps} alignSelf="stretch" marginBottom="1rem">
                    <Card
                        elevation={3}
                        sx={{
                            padding: '0.5rem',
                            ...(value.deleted && {
                                backgroundColor: 'rgb(224, 225, 237,0.4)',
                            }),
                        }}
                    >
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
                                            disabled={isDisabled || value.deleted}
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
                                            disabled={value.deleted}
                                        />
                                        <TextField
                                            select
                                            type="text"
                                            label={i18next.t('wizard.entityTemplate.propertyType')}
                                            id={type}
                                            name={type}
                                            value={value.type === 'text-area' ? 'string' : value.type}
                                            onChange={(e) => {
                                                console.log('change typpeee');
                                                setValues?.((prevValue) => ({
                                                    ...prevValue,
                                                    type: e.target.value,
                                                    required: e.target.value === 'serialNumber' || prevValue.required,
                                                    expandedUserFields: undefined,
                                                }));
                                            }}
                                            error={touchedType && Boolean(errorType)}
                                            helperText={touchedType && errorType}
                                            disabled={
                                                (isDisabled && (initialValue?.type !== 'enum' || !supportConvertingToMultipleFields)) || value.deleted
                                            }
                                            sx={{ marginRight: '5px' }}
                                            fullWidth
                                        >
                                            {validPropertyTypes
                                                .filter((validPropertyType) => {
                                                    if (initialValue?.type === 'enum' && areThereAnyInstances && supportConvertingToMultipleFields)
                                                        return validPropertyType === 'enumArray' || validPropertyType === 'enum';
                                                    if (validPropertyType === 'entityReference') return supportEntityReferenceType;
                                                    if (validPropertyType === 'serialNumber') {
                                                        if (!supportSerialNumberType) return false;
                                                    }
                                                    if (validPropertyType === 'location') return supportLocation;
                                                    if (validPropertyType === 'text-area') return false;
                                                    if (validPropertyType === 'enumArray') return supportArrayFields;
                                                    if (validPropertyType === 'relationshipReference') return supportRelationshipReference;
                                                    if (validPropertyType === 'fileId' || validPropertyType === 'multipleFiles') return false; // TODO: support file inputs
                                                    if (validPropertyType === 'user' || validPropertyType === 'users') return supportUserType;
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
                                                isOptionEqualToValue={(option, inputValue) => {
                                                    return option.trim() === inputValue.trim() || option.trim().length === 0;
                                                }}
                                                renderTags={(tagValue, getTagProps) =>
                                                    tagValue.map((option, tagIndex) => {
                                                        const chipDisabled = isDisabled && initialOptionArray.length > tagIndex;
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
                                                                    PaperProps={{
                                                                        style: {
                                                                            zIndex: 10000,
                                                                            borderRadius: '10px',
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
                                            <>
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
                                                disabled={isDisabled || value.deleted}
                                                dir="ltr"
                                                sx={{ marginRight: '5px' }}
                                                fullWidth
                                            />
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
                                        {(value.type === 'date' || value.type === 'date-time') &&
                                            'dateNotification' in value &&
                                            (value.dateNotification !== undefined ? (
                                                <Grid container direction="row">
                                                    <Grid container item direction="row">
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
                                                                <MeltaTooltip title={TooltipTitleWithLinesSpace('wizard.entityTemplate.customAlert')}>
                                                                    <CustomAlertIcon />
                                                                </MeltaTooltip>
                                                            </ToggleButton>
                                                        </ToggleButtonGroup>
                                                        <FormControlLabel
                                                            control={
                                                                <MeltaCheckbox
                                                                    checked={value.isDatePastAlert ?? true}
                                                                    onChange={(_e, checked) => {
                                                                        setValues?.((prevValue) => ({
                                                                            ...prevValue,
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
                                                <IconButton
                                                    onClick={() => setFieldValue('dateNotification', null)}
                                                    sx={{ borderRadius: 10 }}
                                                    disabled={value.deleted}
                                                >
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
                                                                    identifier: !checked ? undefined : prevValue.identifier,
                                                                }));
                                                                // unique is allowed only if required=true, automatic uncheck 'unique' too
                                                                if (!checked && unique) {
                                                                    deletePropFromUniqueConstraints(uniqueConstraintGroupName, value.name);
                                                                }
                                                            }}
                                                            disabled={
                                                                value.type === 'serialNumber' ||
                                                                value.type === 'boolean' ||
                                                                value.readOnly ||
                                                                (supportChangeToRequiredWithInstances
                                                                    ? false
                                                                    : isEditMode &&
                                                                      areThereAnyInstances &&
                                                                      (isNewProperty || (!isNewProperty && !initialValue?.required))) ||
                                                                value.deleted ||
                                                                value.archive ||
                                                                disableRemoveRequire
                                                            }
                                                            checked={value.required}
                                                        />
                                                    }
                                                    label={i18next.t('validation.required')}
                                                />
                                            )}
                                            <FormControlLabel
                                                control={
                                                    <Switch
                                                        id={readOnly}
                                                        name={readOnly}
                                                        onChange={(_e, checked) => {
                                                            setValues?.((prevValue) => ({
                                                                ...prevValue,
                                                                readOnly: checked || undefined,
                                                            }));
                                                        }}
                                                        disabled={value.required || value.archive}
                                                        checked={value.readOnly}
                                                    />
                                                }
                                                label={i18next.t('validation.readOnly')}
                                            />
                                            {value.preview !== undefined && (
                                                <FormControlLabel
                                                    control={
                                                        <Switch
                                                            id={preview}
                                                            name={preview}
                                                            onChange={onChange}
                                                            disabled={value.hide || value.deleted || value.archive}
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
                                                            disabled={value.preview || value.deleted || value.archive}
                                                            checked={value.hide}
                                                        />
                                                    }
                                                    label={i18next.t('validation.hide')}
                                                />
                                            )}
                                            {supportUnique && unique !== undefined && setValues && (
                                                <FormControlLabel
                                                    control={
                                                        <Switch
                                                            id={String(unique)}
                                                            name={String(unique)}
                                                            checked={unique}
                                                            disabled={value.archive || value.type === 'serialNumber'}
                                                            onChange={(_e, checked) => {
                                                                setValues((prevValue) => ({
                                                                    ...prevValue,
                                                                    required: checked ? true : prevValue.required,
                                                                    identifier: !checked ? undefined : prevValue.identifier,
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
                                            {isText && (
                                                <FormControlLabel
                                                    control={
                                                        <Switch
                                                            id={type}
                                                            name={type}
                                                            onChange={(e) => {
                                                                const newFormatToText = e.target.checked ? 'text-area' : 'string';
                                                                setValues?.((prevValue) => ({
                                                                    ...prevValue,
                                                                    type: newFormatToText,
                                                                }));
                                                            }}
                                                            checked={value.type === 'text-area'}
                                                            disabled={value.archive}
                                                        />
                                                    }
                                                    label={i18next.t('propertyTypes.text-area')}
                                                />
                                            )}
                                            {isIdentifierAble && supportIdentifier && (
                                                <FormControlLabel
                                                    control={
                                                        <Switch
                                                            id={identifier}
                                                            name={identifier}
                                                            onChange={(_e, checked) => {
                                                                setValues?.((prevValue) => ({
                                                                    ...prevValue,
                                                                    required: checked ? true : prevValue.required,
                                                                    identifier: checked || undefined,
                                                                    groupName: undefined,
                                                                    uniqueCheckbox: false,
                                                                }));
                                                                if (checked) createEmptyGroup(value.name);
                                                            }}
                                                            disabled={hasIdentifier && !value.identifier}
                                                            checked={value.identifier ?? false}
                                                        />
                                                    }
                                                    label={i18next.t('validation.identifier')}
                                                />
                                            )}
                                        </Box>
                                        <Grid display="flex">
                                            {locationSearchFields?.show &&
                                                value.type !== 'fileId' &&
                                                value.type !== 'relationshipReference' &&
                                                !arrayTypes.includes(value.type) && (
                                                    <MeltaTooltip
                                                        title={i18next.t(
                                                            mapSearchDisabled
                                                                ? 'validation.mapSearchPropertiesLimit'
                                                                : 'wizard.entityTemplate.searchLocation',
                                                            { limit: mapSearchPropertiesLimit },
                                                        )}
                                                        placement="right"
                                                    >
                                                        <Box>
                                                            <IconButton
                                                                onClick={() => setFieldValue('mapSearch', !value.mapSearch)}
                                                                disabled={mapSearchDisabled}
                                                            >
                                                                {value.mapSearch ? <WrongLocation color="primary" /> : <AddLocationAlt />}
                                                            </IconButton>
                                                        </Box>
                                                    </MeltaTooltip>
                                                )}
                                            {supportArchive && isEditMode && (
                                                <MeltaTooltip title={archiveButtonTooltip()} placement="right">
                                                    <Box>
                                                        <IconButton
                                                            onClick={() => setFieldValue('archive', !value.archive)}
                                                            disabled={value.required || value.uniqueCheckbox || value.preview}
                                                        >
                                                            {value.archive ? <Unarchive color="primary" /> : <Archive />}
                                                        </IconButton>
                                                    </Box>
                                                </MeltaTooltip>
                                            )}
                                            <MeltaTooltip
                                                disableHoverListener={!initialValue?.required}
                                                title={i18next.t('wizard.entityTemplate.cantDeleteUniqueOrRequiredFields')}
                                            >
                                                <Box>
                                                    <IconButton
                                                        onClick={() => remove(index, isNewProperty)}
                                                        disabled={!supportDeleteForExistingInstances || initialValue?.required || hasActions}
                                                    >
                                                        {value.deleted ? <DeleteOff /> : <DeleteIcon />}
                                                    </IconButton>
                                                </Box>
                                            </MeltaTooltip>
                                        </Grid>
                                    </Grid>
                                    <Grid item container justifyContent="space-between" alignItems="center" flexWrap="nowrap">
                                        {unique && !value.identifier && value.type !== 'serialNumber' && (
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
                                                                    onKeyDown={(e) => {
                                                                        e.stopPropagation();
                                                                        if (e.key === 'Enter') {
                                                                            e.preventDefault();
                                                                            const inputValue = params.inputProps.value;
                                                                            if (
                                                                                inputValue &&
                                                                                !uniqueConstraints?.some((group) => group.groupName === inputValue)
                                                                            ) {
                                                                                createNewUniqueGroup(inputValue);
                                                                                setValues!((prevValue) => ({
                                                                                    ...prevValue,
                                                                                    groupName: String(inputValue),
                                                                                }));
                                                                            }
                                                                        }
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
                                    <Grid item>
                                        {value.type === 'user' && (
                                            <Grid container direction="row">
                                                <Grid item container alignItems="center" flexWrap="nowrap">
                                                    <MeltaTooltip title={i18next.t('validation.expendUserFieldsTitle')}>
                                                        <FormControlLabel
                                                            control={
                                                                <MeltaCheckbox
                                                                    checked={expandUserFields}
                                                                    onChange={(_e, checked) => {
                                                                        // TODO: lir
                                                                        console.log({ value });
                                                                        // setValues!((prevValue) => ({
                                                                        //     ...prevValue,
                                                                        //     expendUserFields: checked,
                                                                        // }));
                                                                        setExpandUserFields(checked);
                                                                    }}
                                                                />
                                                            }
                                                            label={i18next.t('wizard.entityTemplate.expendUserFields')}
                                                        />
                                                    </MeltaTooltip>
                                                </Grid>
                                                {expandUserFields && ( ///
                                                    <SelectCheckbox
                                                        title={i18next.t('user.expendUserFields')}
                                                        options={userFields}
                                                        selectedOptions={value.expandedUserFields || []}
                                                        setSelectedOptions={(val) => {
                                                            // TODO: lir
                                                            setValues!((prevValue) => ({
                                                                ...prevValue,
                                                                expandedUserFields: val as unknown as string[],
                                                            }));
                                                            console.log({ value });
                                                            // setUserFieldsToShowCheckbox(val);
                                                        }}
                                                        getOptionId={(op) => op}
                                                        getOptionLabel={(option) => option}
                                                        size="small"
                                                        horizontalOrigin={128}
                                                        isDraggableDisabled
                                                        hideSearchBar
                                                        hideChooseAll
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
        isEqual(prev.uniqueConstraints, next.uniqueConstraints) &&
        isEqual(prev.locationSearchFields, next.locationSearchFields) &&
        isEqual(prev.hasIdentifier, next.hasIdentifier),
);
