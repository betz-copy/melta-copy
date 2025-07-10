import { AddRounded } from '@mui/icons-material';
import { Button, Divider, FormControlLabel, Grid, Typography } from '@mui/material';
import i18next from 'i18next';
import React, { useState } from 'react';
import { ChipType, IFieldChip, IFieldFilter, ITemplateFieldsFilters } from '../../../interfaces/childTemplates';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { IUser } from '../../../interfaces/users';
import { ColoredEnumChip } from '../../ColoredEnumChip';
import { initializedFilterField } from '../../FilterComponent';
import { ajvValidate } from '../../inputs/JSONSchemaFormik';
import { MeltaCheckbox } from '../../MeltaCheckbox';
import AddFieldFilterDialog from './AddFieldFilterDialog';

interface IFieldsAndFiltersTableProps {
    entityTemplate: IMongoEntityTemplatePopulated;
    templateFieldsFilters: ITemplateFieldsFilters;
    setTemplateFieldsFilters: React.Dispatch<React.SetStateAction<ITemplateFieldsFilters>>;
    viewType: 'categoryPage' | 'userPage';
    fieldChips: IFieldChip[];
    setFieldChips: React.Dispatch<React.SetStateAction<IFieldChip[]>>;
    onCheckboxChange: (fieldName: string, checked: boolean) => void;
}

const getDisplayValue = (schema: any, fieldValue: any): string => {
    const dateFormats = ['date', 'date-time'];
    const isDateField = dateFormats.includes(schema.format || '');
    const isUsersArray = schema.items?.format === 'user';

    if (isDateField && fieldValue) {
        try {
            return new Date(fieldValue).toLocaleDateString('en-uk');
        } catch (e) {
            return String(fieldValue);
        }
    }
    if (Array.isArray(fieldValue)) return isUsersArray ? fieldValue.map(({ fullName }) => fullName).join(', ') : fieldValue.join(', ');
    if (typeof fieldValue === 'boolean') return fieldValue ? 'true' : 'false';
    return String(fieldValue);
};

const renderChips = (chips: IFieldChip[], onDelete: (chip: IFieldChip) => void): React.ReactNode[] => {
    return chips.map((chip, index) => {
        let label = '';
        const type = chip.chipType;

        if (type === ChipType.Filter) {
            const ft = chip.filterField!;
            if ('filter' in ft) label = String(ft.filter);
            else if ('values' in ft && Array.isArray(ft.values)) {
                label = ft.values.map((item) => (typeof item === 'object' ? (item as IUser).fullName : String(item))).join(', ');
            } else if ('dateFrom' in ft) {
                const from = ft.dateFrom ? new Date(ft.dateFrom).toLocaleDateString() : '';
                const to = ft.dateTo ? ` - ${new Date(ft.dateTo).toLocaleDateString()}` : '';
                label = from + to;
            }
            const filterTypeLabel = 'type' in ft ? ft.type : '';
            label = `${i18next.t(`filters.${filterTypeLabel}`)}: ${label}`;
        } else {
            label = String(chip.defaultValue);
        }

        return (
            <Grid item key={`${chip.fieldName}-${type}-${index}`}>
                <ColoredEnumChip label={label} onDelete={() => onDelete(chip)} color="default" />
            </Grid>
        );
    });
};

const FieldsAndFiltersTable: React.FC<IFieldsAndFiltersTableProps> = ({
    entityTemplate,
    templateFieldsFilters,
    setTemplateFieldsFilters,
    viewType,
    fieldChips,
    setFieldChips,
    onCheckboxChange,
}) => {
    const [addFilterToField, setAddFilterToField] = useState<string | null>(null);
    const [dialogType, setDialogType] = useState<ChipType | null>(null);

    const isDisallowedFormat = (fieldName: string) => {
        const prop = entityTemplate.properties.properties[fieldName];
        const disabledFormats = ['fileId', 'signature', 'location', 'comment', 'user', 'kartoffelUserField'];
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
        const value = 'filter' in fieldValue ? fieldValue.filter : 'values' in fieldValue ? fieldValue.values : fieldValue.dateFrom;
        const newChip: IFieldChip = {
            fieldName,
            chipType: ChipType.Filter,
            filterField: structuredClone(fieldValue),
            defaultValue: value,
        };
        setFieldChips((prev) => [...prev, newChip]);
    };

    const handleDefaultSubmit = (fieldName: string, fieldValue: any) => {
        const fieldSchema = entityTemplate.properties.properties[fieldName];
        const fakeTemplateSchema = {
            ...entityTemplate.properties,
            required: [],
            properties: { [fieldName]: fieldSchema },
        };
        const formData = { [fieldName]: fieldValue };
        const ajvErrors = ajvValidate(fakeTemplateSchema, formData);

        if (ajvErrors && ajvErrors[fieldName]) {
            setTemplateFieldsFilters((prev) => ({
                ...prev,
                [fieldName]: {
                    ...prev[fieldName],
                    error: ajvErrors[fieldName],
                },
            }));
            return;
        }

        setTemplateFieldsFilters((prev) => ({
            ...prev,
            [fieldName]: {
                ...prev[fieldName],
                defaultValue: fieldValue,
            },
        }));

        const displayValue = getDisplayValue(fieldSchema, fieldValue);
        setFieldChips((prev) => [
            ...prev.filter((chip) => !(chip.fieldName === fieldName && chip.chipType === ChipType.Default)),
            { fieldName, chipType: ChipType.Default, defaultValue: displayValue },
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

    const isSubmitDisabled = (fieldFilter: IFieldFilter, isRequired: boolean, fieldName: string) =>
        (!fieldFilter.selected && !isRequired) || isDisallowedFormat(fieldName);

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
                                        {renderChips(filterChips, (chip) =>
                                            setFieldChips((prev) =>
                                                prev.filter(
                                                    (c) =>
                                                        !(
                                                            c.fieldName === chip.fieldName &&
                                                            c.chipType === chip.chipType &&
                                                            c.defaultValue === chip.defaultValue
                                                        ),
                                                ),
                                            ),
                                        )}
                                        <Grid item>
                                            {property?.format === 'user' ? (
                                                <Typography sx={{ fontSize: '14px', fontWeight: 400, color: '#BBBED8' }}>
                                                    {i18next.t('createChildTemplateDialog.byUser')}
                                                </Typography>
                                            ) : (
                                                <Button
                                                    color="primary"
                                                    onClick={() =>
                                                        !isSubmitDisabled(fieldFilter, isRequired, fieldName) &&
                                                        handleSelectProperty(fieldName, ChipType.Filter)
                                                    }
                                                    size="small"
                                                    sx={{ minWidth: '32px', p: '4px' }}
                                                    disabled={isSubmitDisabled(fieldFilter, isRequired, fieldName)}
                                                >
                                                    <AddRounded />
                                                </Button>
                                            )}
                                        </Grid>
                                    </Grid>
                                </Grid>

                                <Grid item xs={3}>
                                    <Grid container spacing={0.5} alignItems="center" justifyContent="center">
                                        {renderChips(defaultChips, (chip) => {
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
                                        })}
                                        {!defaultChips.length && (
                                            <Grid item>
                                                {property?.format === 'user' ? (
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
                />
            )}
        </>
    );
};

export default FieldsAndFiltersTable;
