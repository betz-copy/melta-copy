import {
    Add as AddIcon,
    AddLocationAlt,
    Archive,
    Delete as DeleteIcon,
    DeleteForever as DeleteOff,
    DragHandle as DragHandleIcon,
    FileCopy,
    Unarchive,
    WrongLocation,
} from '@mui/icons-material';
import { Autocomplete, Box, Card, CardContent, FormControlLabel, Grid, IconButton, MenuItem, TextField } from '@mui/material';
import { IPropertyValue, IUniqueConstraintOfTemplate } from '@packages/entity';
import { IEntityTemplateMap, PropertyExternalWizardType } from '@packages/entity-template';
import { FormikErrors, FormikTouched } from 'formik';
import i18next from 'i18next';
import { isEqual } from 'lodash';
import React, { memo, SetStateAction } from 'react';
import { useQueryClient } from 'react-query';
import { environment } from '../../../globals';
import { arrayTypes } from '../../../services/templates/entityTemplatesService';
import MeltaCheckbox from '../../MeltaDesigns/MeltaCheckbox';
import MeltaTooltip from '../../MeltaDesigns/MeltaTooltip';
import { PropertyWizardType } from '.';
import { validPropertyTypes } from './AddFields';
import { CommonFormInputProperties, PropertyItem } from './commonInterfaces';
import { PropertiesTypes } from './Property/PropertyTypes';
import { Switches } from './Property/Switches';
import { FilterEntitiesByCriteria } from './RelationshipReference/filterEntitiesByCriteria';

const { mapSearchPropertiesLimit } = environment.map;

export interface FieldEditCardProps {
    entity: string;
    value: CommonFormInputProperties;
    values: Record<string, PropertyItem[]>;
    index: number;
    isEditMode?: boolean;
    initialValue: CommonFormInputProperties | undefined;
    areThereAnyInstances?: boolean;
    setValues?: (value: SetStateAction<CommonFormInputProperties>) => void;
    touched?: FormikTouched<CommonFormInputProperties>;
    errors?: FormikErrors<CommonFormInputProperties>;
    setFieldValue: (field: keyof CommonFormInputProperties, value: IPropertyValue) => void;
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    remove: (index: number, isNewProperty: boolean, groupIndex?: number) => void;
    archive?: (index: number, groupIndex?: number) => void;
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
    supportComment?: boolean;
    userPropertiesInTemplate?: string[];
    onDuplicateKartoffelField?: (fieldIndex: number, groupIndex?: number) => void;
    groupIndex?: number;
    propertiesType: string;
    isAccountTemplate?: boolean;
    hasAccountBalanceField?: boolean;
    isAlreadyWalletTemplate?: boolean;
}

export const FieldEditCard: React.FC<FieldEditCardProps> = ({
    entity,
    value,
    values,
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
    archive,
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
    supportComment,
    userPropertiesInTemplate = [],
    onDuplicateKartoffelField,
    groupIndex,
    propertiesType,
    isAccountTemplate,
    hasAccountBalanceField,
    isAlreadyWalletTemplate,
}) => {
    const queryClient = useQueryClient();
    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;

    const isComment = value.type === 'comment';

    const name = `properties[${index}].name`;
    const touchedName = touched?.name;
    const errorName = errors?.name;

    const title = `properties[${index}].title`;
    const touchedTitle = touched?.title;
    const errorTitle = errors?.title;

    const type = `properties[${index}].type`;
    const touchedType = touched?.type;
    const errorType = errors?.type;

    const unique =
        value.type === 'serialNumber' ||
        (uniqueConstraints && uniqueConstraints.filter((constraints) => constraints.properties.includes(value.name)).length > 0);
    const uniqueConstraintGroupName = uniqueConstraints
        ? uniqueConstraints.find((constraint) => constraint.properties.includes(value.name))?.groupName
        : '';

    const touchedUniqueGroupName = touched?.groupName;
    const errorUniqueGroupName = errors?.groupName;

    const mapSearchDisabled = !value.mapSearch && locationSearchFields?.disabled;

    const isNewProperty = !initialValue;
    const isDisabled = Boolean(isEditMode && !isNewProperty && areThereAnyInstances);

    const isRequiredWalletTransferField = React.useMemo(() => {
        if (!values?.walletTransfer) return false;

        const walletTransfer = (values as Record<string, IPropertyValue>).walletTransfer;
        const from = typeof walletTransfer.from === 'string' ? walletTransfer.from : walletTransfer.from.name;
        const to = typeof walletTransfer.to === 'string' ? walletTransfer.to : walletTransfer.to.name;
        return from === value.name || to === value.name || walletTransfer?.amount === value.name;
    }, [values, value.name]);

    const createNewUniqueGroup = (groupName) => {
        if (groupName) {
            setUniqueConstraints?.((prev) => {
                const existingGroup = prev?.find((group) => group.groupName === groupName);
                if (!existingGroup) {
                    const newGroup = { groupName, properties: [value.name] };
                    const updatedConstraints = (prev || []).map((group) => ({
                        ...group,
                        properties: group.properties.filter((prop) => prop !== value.name),
                    }));
                    updatedConstraints.push(newGroup);

                    const updatedConstraintsWithoutEmptyGroups = updatedConstraints.filter((group) => group.properties.length);
                    return updatedConstraintsWithoutEmptyGroups;
                }
                return prev;
            });
        }
    };

    const addToProperties = (selectedGroupName) => {
        setUniqueConstraints?.((prev) => {
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

                            if (!updatedGroup.properties.length) return null;

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

    const movePropAndCreateGroup = (fieldName) => {
        setUniqueConstraints?.((prev) => {
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
        setUniqueConstraints?.((prevConstraints) => {
            const groupToDelete = prevConstraints.find((group) => group.groupName === groupName);
            const updatedConstraints = prevConstraints.filter((group) => group.groupName !== groupName);
            groupToDelete?.properties.forEach((fieldName) => {
                const fieldInExistingGroup = updatedConstraints.some((group) => group.properties.includes(fieldName));
                if (!fieldInExistingGroup) {
                    updatedConstraints.push({ groupName: '', properties: [fieldName] });
                }
            });
            setValues?.((prev) => ({
                ...prev,
                groupName: undefined,
            }));

            return updatedConstraints;
        });
    };

    const archiveButtonTooltip = () => {
        if (value.required) return i18next.t('wizard.entityTemplate.cannotArchiveIfRequired');
        if (value.uniqueCheckbox) return i18next.t('wizard.entityTemplate.cannotArchiveIfUnique');
        if (value.preview) return i18next.t('wizard.entityTemplate.cannotArchiveIfPreview');
        if (value.archive) return i18next.t('wizard.entityTemplate.removeFromArchive');
        return i18next.t('wizard.entityTemplate.moveToArchive');
    };

    return (
        <Grid alignSelf="stretch" marginBottom="1rem">
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
                    <Grid container gap={2} wrap="nowrap" alignItems="center">
                        <Box>
                            <DragHandleIcon fontSize="large" />
                        </Box>

                        <Grid container direction="column" width="100%">
                            <Grid container direction="column" marginBottom="0.5rem">
                                <Grid
                                    container
                                    wrap="nowrap"
                                    marginBottom={value.type === 'relationshipReference' && supportRelationshipReference ? '0.5rem' : '0.4rem'}
                                >
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
                                        disabled={value.deleted || isComment}
                                    />
                                    <TextField
                                        select
                                        type="text"
                                        label={i18next.t('wizard.entityTemplate.propertyType')}
                                        id={type}
                                        name={type}
                                        value={value.type === 'text-area' ? 'string' : value.type}
                                        onChange={(e) => {
                                            const newType = e.target.value as PropertyWizardType;
                                            setValues?.((prevValue) => ({
                                                ...prevValue,
                                                type: newType,
                                                required: (newType === 'serialNumber' || prevValue.required) ?? false,
                                                title: newType === 'comment' ? value.name : value.title,
                                                readOnly: newType === 'kartoffelUserField' || prevValue.readOnly,
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
                                                if (validPropertyType === 'comment') return supportComment;
                                                if (validPropertyType === 'kartoffelUserField' && !userPropertiesInTemplate.length && !value.deleted)
                                                    return false;
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
                                <Grid justifyContent="space-between" flexWrap="nowrap">
                                    <PropertiesTypes
                                        entity={entity}
                                        value={value}
                                        initialValue={initialValue}
                                        setValues={setValues}
                                        index={index}
                                        onChange={onChange}
                                        templateId={templateId}
                                        setFieldValue={setFieldValue}
                                        touched={touched}
                                        errors={errors}
                                        isDisabled={isDisabled}
                                        userPropertiesInTemplate={userPropertiesInTemplate}
                                        supportRelationshipReference={supportRelationshipReference}
                                        supportEditEnum={supportEditEnum}
                                    />
                                </Grid>
                            </Grid>
                            <Grid container justifyContent="space-between" marginTop={value.type === 'comment' ? '5px' : ''}>
                                <Switches
                                    value={value}
                                    setValues={setValues}
                                    index={index}
                                    onChange={onChange}
                                    isEditMode={isEditMode}
                                    initialValue={initialValue}
                                    templateId={templateId}
                                    unique={unique}
                                    uniqueConstraintGroupName={uniqueConstraintGroupName}
                                    setUniqueConstraints={setUniqueConstraints}
                                    areThereAnyInstances={areThereAnyInstances}
                                    supportChangeToRequiredWithInstances={supportChangeToRequiredWithInstances}
                                    supportUnique={supportUnique}
                                    supportIdentifier={supportIdentifier}
                                    hasIdentifier={hasIdentifier}
                                    isAccountTemplate={isAccountTemplate}
                                    hasAccountBalanceField={hasAccountBalanceField}
                                    isAlreadyWalletTemplate={isAlreadyWalletTemplate}
                                    isRequiredWalletTransferField={isRequiredWalletTransferField}
                                />
                                <Grid display="flex">
                                    {locationSearchFields?.show &&
                                        value.type !== 'fileId' &&
                                        value.type !== 'relationshipReference' &&
                                        !isComment &&
                                        !arrayTypes.includes(value.type as PropertyExternalWizardType) && (
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
                                    {value.type === 'kartoffelUserField' &&
                                        !value.archive &&
                                        !value.deleted &&
                                        propertiesType !== 'archiveProperties' && (
                                            <MeltaTooltip title={i18next.t('wizard.entityTemplate.duplicateField')} placement="right">
                                                <Box>
                                                    <IconButton onClick={() => onDuplicateKartoffelField?.(index, groupIndex)}>
                                                        <FileCopy />
                                                    </IconButton>
                                                </Box>
                                            </MeltaTooltip>
                                        )}
                                    {supportArchive && isEditMode && (
                                        <MeltaTooltip title={archiveButtonTooltip()} placement="right">
                                            <Box>
                                                <IconButton
                                                    onClick={() => (archive ? archive(index, groupIndex) : {})}
                                                    disabled={value.required || value.uniqueCheckbox || value.preview || isComment}
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
                                                onClick={() => remove(index, isNewProperty, groupIndex)}
                                                disabled={
                                                    !supportDeleteForExistingInstances ||
                                                    initialValue?.required ||
                                                    hasActions ||
                                                    (value.accountBalance && areThereAnyInstances)
                                                }
                                            >
                                                {value.deleted ? <DeleteOff /> : <DeleteIcon />}
                                            </IconButton>
                                        </Box>
                                    </MeltaTooltip>
                                </Grid>
                            </Grid>
                            <Grid container justifyContent="space-between" alignItems="center" flexWrap="nowrap">
                                {unique && !value.identifier && value.type !== 'serialNumber' && (
                                    <Grid container direction="row">
                                        <Grid container alignItems="center" flexWrap="nowrap">
                                            <MeltaTooltip title={i18next.t('validation.uniqueTooltipTitle')}>
                                                <FormControlLabel
                                                    control={
                                                        <MeltaCheckbox
                                                            checked={value.uniqueCheckbox}
                                                            onChange={(_e, checked) => {
                                                                setValues?.((prev) => ({
                                                                    ...prev,
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
                                                        ? uniqueConstraints.filter((group) => group.groupName !== '')?.map((group) => group.groupName)
                                                        : []
                                                }
                                                onChange={(_event, newValue) => {
                                                    if (newValue !== null) {
                                                        addToProperties(newValue);
                                                        setValues?.((prev) => ({
                                                            ...prev,
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
                                                            slotProps={{
                                                                input: {
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
                                                                },
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
                                                                        setValues?.((prev) => ({
                                                                            ...prev,
                                                                            groupName: String(inputValue),
                                                                        }));
                                                                    }
                                                                }
                                                            }}
                                                        />

                                                        {params.inputProps.value &&
                                                            !uniqueConstraints?.some((group) => group.groupName === params.inputProps.value) && (
                                                                <IconButton
                                                                    aria-label="create"
                                                                    onClick={() => {
                                                                        setValues?.((prev) => ({
                                                                            ...prev,
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
                            {value.type === 'relationshipReference' && supportRelationshipReference && (
                                <FilterEntitiesByCriteria
                                    name={`relationshipReference.filters`}
                                    value={value}
                                    setFieldValue={setFieldValue}
                                    selectedEntityTemplate={entityTemplates.get(value.relationshipReference?.relatedTemplateId || '')}
                                    initialValue={initialValue}
                                    errors={errors}
                                    touched={touched}
                                    values={values}
                                />
                            )}
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>
        </Grid>
    );
};

export const MemoFieldEditCard = memo(
    FieldEditCard,
    (prev, next) =>
        prev.index === next.index &&
        prev.groupIndex === next.groupIndex &&
        prev.areThereAnyInstances === next.areThereAnyInstances &&
        isEqual(prev.value, next.value) &&
        isEqual(prev.values, next.values) &&
        isEqual(prev.touched, next.touched) &&
        isEqual(prev.errors, next.errors) &&
        isEqual(prev.uniqueConstraints, next.uniqueConstraints) &&
        isEqual(prev.locationSearchFields, next.locationSearchFields) &&
        isEqual(prev.hasAccountBalanceField, next.hasAccountBalanceField) &&
        isEqual(prev.hasIdentifier, next.hasIdentifier) &&
        isEqual(prev.userPropertiesInTemplate, next.userPropertiesInTemplate),
);
