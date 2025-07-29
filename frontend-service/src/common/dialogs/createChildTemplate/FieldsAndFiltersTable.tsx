import { AddRounded } from '@mui/icons-material';
import { Button, Divider, FormControlLabel, Grid, Typography } from '@mui/material';
import i18next from 'i18next';
import React, { useState } from 'react';
import { IEntitySingleProperty, IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { IUser } from '../../../interfaces/users';
import { ColoredEnumChip } from '../../ColoredEnumChip';
import { initializedFilterField } from '../../FilterComponent';
import { getFilterFieldReadonly } from '../../inputs/FilterInputs/ReadonlyFilterInput';
import { MeltaCheckbox } from '../../MeltaCheckbox';
import AddFieldFilterDialog, { checkMatchValidation } from './AddFieldFilterDialog';
import { ByCurrentDefaultValue, ChipType, IFieldChip, IFieldFilter, ITemplateFieldsFilters } from '../../../interfaces/childTemplates';
import { cloneDeep } from 'lodash';

const getFormattedDefaultValue = (value: string | number | boolean | Date | string[] | undefined, fieldSchema: IEntitySingleProperty): string => {
    if (value === null || value === undefined) return '';

    if (Array.isArray(value)) {
        return value
            .map((item) => {
                if (typeof item === 'string') return item;
                if (typeof item === 'object' && item !== null && 'fullName' in item) {
                    return (item as IUser).fullName;
                }
                return String(item);
            })
            .join(', ');
    }

    if (typeof value === 'boolean') return i18next.t(`booleanOptions.${value ? 'yes' : 'no'}`);

    if (typeof value === 'string') {
        switch (fieldSchema.format) {
            case 'date-time':
            case 'date':
                return value === ByCurrentDefaultValue.byCurrentDate
                    ? i18next.t('createChildTemplateDialog.currentDate')
                    : new Date(value).toLocaleDateString('he-IL');

            case 'user':
                if (value === ByCurrentDefaultValue.byCurrentUser) return i18next.t('createChildTemplateDialog.byUser');

                const userObj = JSON.parse(value);
                if (userObj.fullName && userObj.hierarchy) {
                    return `${userObj.fullName} - ${userObj.hierarchy}`;
                }

                return value;
            default:
                return value;
        }
    }

    return String(value);
};

const renderChips = (
    chips: IFieldChip[],
    fieldSchema: IEntitySingleProperty,
    onDelete: (chip: IFieldChip) => void,
    matchErrorMap?: Map<string, string>,
): React.ReactNode[] => {
    return chips.map((chip, index) => {
        const label =
            chip.chipType === ChipType.Filter
                ? getFilterFieldReadonly(chip.filterField!, fieldSchema.type)
                : getFormattedDefaultValue(chip.defaultValue, fieldSchema);

        const matchError = matchErrorMap?.get(chip.fieldName);

        return (
            <Grid item key={`${chip.fieldName}-${chip.chipType}-${index}`} justifyItems="center">
                <ColoredEnumChip label={label} onDelete={() => onDelete(chip)} color="default" />
                {matchError && (
                    <Typography variant="body2" color="error" align="left" style={{ marginTop: '8px' }}>
                        {matchError}
                    </Typography>
                )}
            </Grid>
        );
    });
};

interface IFieldsAndFiltersTableProps {
    entityTemplate: IMongoEntityTemplatePopulated;
    templateFieldsFilters: ITemplateFieldsFilters;
    setTemplateFieldsFilters: React.Dispatch<React.SetStateAction<ITemplateFieldsFilters>>;
    viewType: 'categoryPage' | 'userPage';
    fieldChips: IFieldChip[];
    setFieldChips: React.Dispatch<React.SetStateAction<IFieldChip[]>>;
    onCheckboxChange: (fieldName: string, checked: boolean) => void;
    matchValidationError: Map<string, string>;
    setMatchValidationError: React.Dispatch<React.SetStateAction<Map<string, string>>>;
    selectedUserField?: string;
}

const FieldsAndFiltersTable: React.FC<IFieldsAndFiltersTableProps> = ({
    entityTemplate,
    templateFieldsFilters,
    setTemplateFieldsFilters,
    viewType,
    fieldChips,
    setFieldChips,
    onCheckboxChange,
    matchValidationError,
    setMatchValidationError,
    selectedUserField,
}) => {
    const [addFilterToField, setAddFilterToField] = useState<string | null>(null);
    const [dialogType, setDialogType] = useState<ChipType | null>(null);

    const isDisallowedFormat = (fieldName: string) => {
        const prop = entityTemplate.properties.properties[fieldName];
        const disabledFormats = ['fileId', 'signature', 'location', 'comment', 'kartoffelUserField'];
        const disabledArrayFormats = ['fileId', 'user'];
        return disabledFormats.includes(prop.format ?? '') || !!(prop.items && disabledArrayFormats.includes(prop.items.format ?? ''));
    };

    const handleSelectProperty = (fieldName: string, type: ChipType) => {
        setAddFilterToField(fieldName);
        setDialogType(type);

        const { format, type: fieldType } = entityTemplate.properties.properties[fieldName];
        const selectedFilter = (format && initializedFilterField[format]) || (fieldType && initializedFilterField[fieldType]);

        if (selectedFilter) {
            setTemplateFieldsFilters((prev) => ({
                ...prev,
                [fieldName]: {
                    ...prev[fieldName],
                    filterField: selectedFilter,
                },
            }));
        }
    };

    const handleFilterSubmit = (fieldName: string, fieldValue: any) => {
        const newChip: IFieldChip = {
            fieldName,
            chipType: ChipType.Filter,
            filterField: cloneDeep(fieldValue),
        };
        setFieldChips((prev) => [...prev, newChip]);
    };

    const handleDefaultSubmit = (fieldName: string, fieldValue: string | number | boolean | Date | string[] | undefined) => {
        setTemplateFieldsFilters((prev) => ({
            ...prev,
            [fieldName]: {
                ...prev[fieldName],
                defaultValue: fieldValue,
            },
        }));

        setFieldChips((prev) => [
            ...prev.filter((chip) => !(chip.fieldName === fieldName && chip.chipType === ChipType.Default)),
            { fieldName, chipType: ChipType.Default, defaultValue: fieldValue },
        ]);
        setAddFilterToField(null);
    };

    const onSubmit = (fieldName: string, fieldValue: any) => {
        switch (dialogType) {
            case ChipType.Filter:
                handleFilterSubmit(fieldName, fieldValue);
                break;
            case ChipType.Default:
                handleDefaultSubmit(fieldName, fieldValue);
                break;
            default:
                console.error('Unknown dialog type:', dialogType);
                return;
        }
        setAddFilterToField(null);
    };

    const isSubmitDisabled = (fieldFilter: IFieldFilter, isRequired: boolean, fieldName: string, fieldSchema: IEntitySingleProperty) => {
        const defaultChip = fieldChips.find((c) => c.chipType === ChipType.Default && c.fieldName === fieldName);
        const byCurrentUserDefaultValue = fieldSchema.format === 'user' && defaultChip?.defaultValue === ByCurrentDefaultValue.byCurrentUser;
        const byCurrentDateDefaultValue =
            (fieldSchema.format === 'date' || fieldSchema.format === 'date-time') &&
            defaultChip?.defaultValue === ByCurrentDefaultValue.byCurrentDate;

        return (!fieldFilter.selected && !isRequired) || isDisallowedFormat(fieldName) || byCurrentUserDefaultValue || byCurrentDateDefaultValue;
    };

    const onDeleteFilterChip = (chip: IFieldChip) => {
        const newFilters = fieldChips.filter(
            (c) => c.chipType === 'filter' && !(c.fieldName === chip.fieldName && c.filterField === chip.filterField),
        );
        const defaultChip = fieldChips.find((c) => c.chipType === ChipType.Default && c.fieldName === chip.fieldName);

        if (defaultChip) {
            const anyValid =
                newFilters.length > 0
                    ? newFilters.some(({ filterField }) => checkMatchValidation(filterField, chip.fieldName, defaultChip.defaultValue))
                    : true;

            setMatchValidationError((prev) => {
                const newMap = new Map(prev);
                if (!anyValid)
                    newMap.set(
                        chip.fieldName,
                        i18next.t('validation.matchFilter', {
                            dialogType: i18next.t(
                                `createChildTemplateDialog.dialogType.${dialogType === ChipType.Filter ? ChipType.Default : ChipType.Filter}`,
                            ),
                        }),
                    );
                else newMap.delete(chip.fieldName);
                return newMap;
            });
        }

        setFieldChips((prev) =>
            prev.filter((c) => !(c.fieldName === chip.fieldName && c.chipType === 'filter' && c.filterField === chip.filterField)),
        );
    };

    return (
        <>
            <Grid container>
                <Grid item xs={12}>
                    <Divider />
                </Grid>
            </Grid>
            <Grid container>
                {Object.entries(templateFieldsFilters).map(([fieldName, fieldFilter]) => {
                    const isRequired = entityTemplate.properties.required.includes(fieldName);
                    const property = entityTemplate.properties.properties[fieldName];

                    const isKartoffelUserField = property?.format === 'kartoffelUserField';
                    const isSerialNumberField = !!property?.serialCurrent;
                    const isRelationshipRefField = property?.format === 'relationshipReference';

                    const filterChips = fieldChips.filter((c) => c.fieldName === fieldName && c.chipType === ChipType.Filter);
                    const defaultChips = fieldChips.filter((c) => c.fieldName === fieldName && c.chipType === ChipType.Default);

                    return (
                        <React.Fragment key={fieldName}>
                            <Grid container alignItems="center" justifyContent="space-between" sx={{ py: 1.5, ml: 1 }}>
                                <Grid item xs={3}>
                                    <FormControlLabel
                                        control={
                                            <MeltaCheckbox
                                                checked={isRequired ? true : fieldFilter.selected}
                                                disabled={isRequired}
                                                onChange={(e) => onCheckboxChange(fieldName, e.target.checked)}
                                            />
                                        }
                                        label={
                                            <>
                                                {fieldFilter.fieldValue.title || fieldName}
                                                {isRequired && <span>*</span>}
                                            </>
                                        }
                                        componentsProps={{ typography: { sx: { fontWeight: 400, fontSize: '14px' } } }}
                                    />
                                </Grid>

                                <Grid item xs={3}>
                                    <Grid container spacing={0.5} alignItems="center" justifyContent="center">
                                        {renderChips(filterChips, property, onDeleteFilterChip)}

                                        <Grid item>
                                            {property?.format === 'user' && selectedUserField === fieldName ? (
                                                <Typography sx={{ fontSize: '14px', fontWeight: 400, color: '#BBBED8' }}>
                                                    {i18next.t('createChildTemplateDialog.byUser')}
                                                </Typography>
                                            ) : (
                                                <Button
                                                    color="primary"
                                                    onClick={() =>
                                                        !isSubmitDisabled(fieldFilter, isRequired, fieldName, property) &&
                                                        handleSelectProperty(fieldName, ChipType.Filter)
                                                    }
                                                    size="small"
                                                    sx={{ minWidth: '32px', p: '4px' }}
                                                    disabled={isSubmitDisabled(fieldFilter, isRequired, fieldName, property)}
                                                >
                                                    <AddRounded />
                                                </Button>
                                            )}
                                        </Grid>
                                    </Grid>
                                </Grid>

                                <Grid item xs={3}>
                                    <Grid container spacing={0.5} alignItems="center" justifyContent="center">
                                        {renderChips(
                                            defaultChips,
                                            entityTemplate.properties.properties[fieldName],
                                            (chip) => {
                                                setFieldChips((prev) =>
                                                    prev.filter((c) => !(c.fieldName === chip.fieldName && c.chipType === chip.chipType)),
                                                );
                                                setTemplateFieldsFilters((prev) => ({
                                                    ...prev,
                                                    [chip.fieldName]: {
                                                        ...prev[chip.fieldName],
                                                        defaultValue: undefined,
                                                    },
                                                }));
                                            },
                                            matchValidationError,
                                        )}
                                        {!defaultChips.length && (
                                            <Grid item>
                                                {property?.format === 'user' && selectedUserField === fieldName ? (
                                                    <Typography sx={{ fontSize: '14px', fontWeight: 400, color: '#BBBED8' }}>
                                                        {i18next.t('createChildTemplateDialog.byUser')}
                                                    </Typography>
                                                ) : (
                                                    <Button
                                                        color="primary"
                                                        onClick={() => handleSelectProperty(fieldName, ChipType.Default)}
                                                        size="small"
                                                        sx={{ minWidth: '32px', p: '4px' }}
                                                        disabled={
                                                            isSerialNumberField ||
                                                            (!fieldFilter.selected && !isRequired) ||
                                                            isDisallowedFormat(fieldName) ||
                                                            isKartoffelUserField ||
                                                            isRelationshipRefField
                                                        }
                                                    >
                                                        <AddRounded />
                                                    </Button>
                                                )}
                                            </Grid>
                                        )}
                                    </Grid>
                                </Grid>

                                {viewType === 'userPage' && (
                                    <Grid item xs={3} sx={{ textAlign: 'center' }}>
                                        <MeltaCheckbox
                                            checked={templateFieldsFilters[fieldName]?.isEditableByUser || false}
                                            disabled={!fieldFilter.selected}
                                            onChange={(e) => {
                                                const newFieldFilters = { ...templateFieldsFilters };
                                                newFieldFilters[fieldName] = {
                                                    ...newFieldFilters[fieldName],
                                                    isEditableByUser: e.target.checked,
                                                };
                                                setTemplateFieldsFilters(newFieldFilters);
                                            }}
                                        />
                                    </Grid>
                                )}
                            </Grid>
                            <Grid item xs={12}>
                                <Divider />
                            </Grid>
                        </React.Fragment>
                    );
                })}
            </Grid>

            {addFilterToField && dialogType && (
                <AddFieldFilterDialog
                    open={!!addFilterToField}
                    onClose={() => setAddFilterToField(null)}
                    onSubmit={onSubmit}
                    updateFieldFilter={(filterField, currentFieldName) => {
                        setTemplateFieldsFilters((prev) => ({
                            ...prev,
                            [currentFieldName]: { ...prev[currentFieldName], filterField },
                        }));
                    }}
                    entityTemplate={entityTemplate}
                    currentFieldName={addFilterToField}
                    fieldFilter={templateFieldsFilters[addFilterToField]}
                    dialogType={dialogType}
                    fieldChips={fieldChips}
                    setMatchValidationErrorMap={setMatchValidationError}
                />
            )}
        </>
    );
};

export default FieldsAndFiltersTable;
