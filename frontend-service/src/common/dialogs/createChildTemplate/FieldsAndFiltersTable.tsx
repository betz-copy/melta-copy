import { Button, Divider, FormControlLabel, Grid, Typography } from '@mui/material';
import React, { useState } from 'react';
import { AddRounded } from '@mui/icons-material';
import i18next from 'i18next';
import AddFieldFilterDialog from './AddFieldFilterDialog';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { IAGGridTextFilter, IAGGidNumberFilter, IAGGridDateFilter, IAGGridSetFilter } from '../../../utils/agGrid/interfaces';
import { MeltaCheckbox } from '../../MeltaCheckbox';
import { ColoredEnumChip } from '../../ColoredEnumChip';
import { IFieldChip, IFieldFilter, ITemplateFieldsFilters } from '../../../interfaces/entityChildTemplates';
import { IUser } from '../../../interfaces/users';
import { ajvValidate } from '../../inputs/JSONSchemaFormik';

interface IFieldsAndFiltersTableProps {
    entityTemplate: IMongoEntityTemplatePopulated;
    templateFieldsFilters: ITemplateFieldsFilters;
    setTemplateFieldsFilters: React.Dispatch<React.SetStateAction<ITemplateFieldsFilters>>;
    viewType: 'categoryPage' | 'userPage';
    fieldChips: IFieldChip[];
    setFieldChips: React.Dispatch<React.SetStateAction<IFieldChip[]>>;
    onCheckboxChange: (fieldName: string, checked: boolean) => void;
}

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
    const [dialogType, setDialogType] = useState<'filter' | 'default' | 'editByUser' | null>(null);

    const addFilterToFieldHandler = (
        filterField: IAGGridTextFilter | IAGGidNumberFilter | IAGGridDateFilter | IAGGridSetFilter,
        currentFieldName: string,
    ) => {
        const newFieldFilter = {
            ...templateFieldsFilters[currentFieldName],
        };
        newFieldFilter.filterField = filterField;
        setTemplateFieldsFilters((prev) => ({
            ...prev,
            [currentFieldName]: newFieldFilter,
        }));
    };

    const handleSelectProperty = (newProperty: string | null, type: 'filter' | 'default' | 'editByUser') => {
        setAddFilterToField(newProperty);
        setDialogType(type);

        if (!newProperty) return;
        if (!entityTemplate) return;

        const { format, type: fieldType } = entityTemplate.properties.properties[newProperty];

        const initializedFilterField: Record<string, IFieldFilter['filterField']> = {
            'date-time': { filterType: 'date', type: 'equals', dateFrom: null, dateTo: null },
            date: { filterType: 'date', type: 'equals', dateFrom: null, dateTo: null },
            number: { filterType: 'number', type: 'equals' },
            string: { filterType: 'text', type: 'contains' },
            boolean: { filterType: 'text', type: 'equals' },
            array: { filterType: 'set', values: [] },
        };

        const selectedFilter = (format && initializedFilterField[format]) || (fieldType && initializedFilterField[fieldType]);

        if (selectedFilter) {
            setTemplateFieldsFilters((prev) => ({
                ...prev,
                [newProperty]: {
                    ...prev[newProperty],
                    filterField: selectedFilter,
                },
            }));
        }
    };

    const isDisallowedFormat = (fieldName: string): boolean => {
        const prop = entityTemplate.properties.properties[fieldName];
        const disabledFormats = ['fileId', 'signature', 'location', 'comment', 'user', 'kartoffelUserField'];
        const disabledArrayFormats = ['fileId', 'user'];

        return disabledFormats.includes(prop.format ?? '') || !!(prop.items && disabledArrayFormats.includes(prop.items.format ?? ''));
    };

    return (
        <>
            <Grid container>
                <Grid item xs={12}>
                    <Divider />
                </Grid>
                <Grid container>
                    {Object.entries(templateFieldsFilters).map(([fieldName, fieldFilter]) => {
                        const isRequired: boolean = entityTemplate.properties.required.includes(fieldName);
                        const isKartoffelUserField: boolean = entityTemplate.properties.properties[fieldName]?.format === 'kartoffelUserField';
                        const isSerialNumberField: boolean = !!entityTemplate.properties.properties[fieldName]?.serialCurrent;
                        const isRelationshipRefField: boolean = entityTemplate.properties.properties[fieldName]?.format === 'relationshipReference';

                        return (
                            <React.Fragment key={fieldName}>
                                <Grid container alignItems="center" justifyContent="space-between" sx={{ py: 1.5, ml: 1 }}>
                                    <Grid item xs={3}>
                                        <FormControlLabel
                                            control={
                                                <MeltaCheckbox
                                                    checked={isRequired ? true : fieldFilter.selected}
                                                    disabled={isRequired}
                                                    onChange={(e) => {
                                                        if (isRequired) return;
                                                        onCheckboxChange(fieldName, e.target.checked);
                                                    }}
                                                />
                                            }
                                            label={
                                                <>
                                                    {fieldFilter.fieldValue.title || fieldName}
                                                    {isRequired && <span style={{ marginRight: '3px' }}>*</span>}
                                                </>
                                            }
                                            componentsProps={{
                                                typography: { sx: { fontWeight: 400, fontSize: '14px' } },
                                            }}
                                        />
                                    </Grid>

                                    <Grid item xs={3}>
                                        <Grid container spacing={0.5} alignItems="center" justifyContent="center">
                                            {fieldChips
                                                .filter((chip) => chip.fieldName === fieldName && chip.chipType === 'filter')
                                                .map((chip, index) => {
                                                    const isArrayType = entityTemplate.properties.properties[fieldName]?.type === 'array';
                                                    const filterTypeLabel =
                                                        'type' in chip.filterType! ? chip.filterType.type : isArrayType ? 'contains' : '';

                                                    let filterValue = '';

                                                    if ('filter' in chip.filterType! && chip.filterType.filter !== undefined) {
                                                        filterValue = String(chip.filterType.filter);
                                                    } else if ('values' in chip.filterType! && Array.isArray(chip.filterType.values)) {
                                                        filterValue = chip.filterType.values
                                                            .map((item) => {
                                                                if (typeof item === 'string') return item;
                                                                if (typeof item === 'object') {
                                                                    return (item as IUser).fullName;
                                                                }
                                                                return String(item);
                                                            })
                                                            .join(', ');
                                                    } else if ('dateFrom' in chip.filterType!) {
                                                        if (chip.filterType.dateFrom) {
                                                            filterValue = new Date(chip.filterType.dateFrom).toLocaleDateString();
                                                        }
                                                        if (chip.filterType.dateTo) {
                                                            filterValue += ` - ${new Date(chip.filterType.dateTo).toLocaleDateString()}`;
                                                        }
                                                    }

                                                    return (
                                                        <Grid item key={`${fieldName}-filter-${index}`}>
                                                            <ColoredEnumChip
                                                                label={
                                                                    filterValue
                                                                        ? `${i18next.t(`filters.${filterTypeLabel}`)}: ${filterValue}`
                                                                        : i18next.t(`filters.${filterTypeLabel}`)
                                                                }
                                                                onDelete={() => {
                                                                    setFieldChips((prev) =>
                                                                        prev.filter(
                                                                            (c) =>
                                                                                !(
                                                                                    c.fieldName === chip.fieldName &&
                                                                                    c.chipType === 'filter' &&
                                                                                    c.value === chip.value
                                                                                ),
                                                                        ),
                                                                    );
                                                                }}
                                                                color="default"
                                                            />
                                                        </Grid>
                                                    );
                                                })}

                                            <Grid item>
                                                {entityTemplate.properties.properties[fieldName]?.format === 'user' ? (
                                                    <Typography sx={{ fontSize: '14px', fontWeight: 400, color: '#BBBED8' }}>
                                                        {i18next.t('createChildTemplateDialog.byUser')}
                                                    </Typography>
                                                ) : (
                                                    <Button
                                                        color="primary"
                                                        onClick={() => {
                                                            if ((!fieldFilter.selected && !isRequired) || isDisallowedFormat(fieldName)) return;
                                                            handleSelectProperty(fieldName, 'filter');
                                                        }}
                                                        size="small"
                                                        sx={{ minWidth: '32px', p: '4px' }}
                                                        disabled={(!fieldFilter.selected && !isRequired) || isDisallowedFormat(fieldName)}
                                                    >
                                                        <AddRounded />
                                                    </Button>
                                                )}
                                            </Grid>
                                        </Grid>
                                    </Grid>

                                    <Grid item xs={3}>
                                        <Grid container spacing={0.5} alignItems="center" justifyContent="center">
                                            {fieldChips
                                                .filter((chip) => chip.fieldName === fieldName && chip.chipType === 'default')
                                                .map((chip) => {
                                                    const filterValue =
                                                        chip.value === null || chip.value === undefined
                                                            ? ''
                                                            : Array.isArray(chip.value)
                                                            ? chip.value
                                                                  .map((item) => {
                                                                      if (typeof item === 'string') return item;
                                                                      if (typeof item === 'object') {
                                                                          return (item as IUser).fullName;
                                                                      }
                                                                      return String(item);
                                                                  })
                                                                  .join(', ')
                                                            : String(chip.value);

                                                    return (
                                                        <Grid item key={`${fieldName}-default`}>
                                                            <ColoredEnumChip
                                                                label={`${filterValue}`}
                                                                onDelete={() => {
                                                                    setFieldChips((prev) =>
                                                                        prev.filter(
                                                                            (c) => !(c.fieldName === chip.fieldName && c.chipType === 'default'),
                                                                        ),
                                                                    );
                                                                    setTemplateFieldsFilters((prev) => ({
                                                                        ...prev,
                                                                        [chip.fieldName]: {
                                                                            ...prev[chip.fieldName],
                                                                            defaultValue: undefined,
                                                                        },
                                                                    }));
                                                                }}
                                                                color="default"
                                                            />
                                                        </Grid>
                                                    );
                                                })}

                                            {!fieldChips.some((chip) => chip.fieldName === fieldName && chip.chipType === 'default') && (
                                                <Grid item>
                                                    {entityTemplate.properties.properties[fieldName]?.format === 'user' ? (
                                                        <Typography sx={{ fontSize: '14px', fontWeight: 400, color: '#BBBED8' }}>
                                                            {i18next.t('createChildTemplateDialog.byUser')}
                                                        </Typography>
                                                    ) : (
                                                        <Button
                                                            color="primary"
                                                            onClick={() => {
                                                                if ((!fieldFilter.selected && !isRequired) || isDisallowedFormat(fieldName)) return;
                                                                handleSelectProperty(fieldName, 'default');
                                                            }}
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
            </Grid>

            {addFilterToField && (
                <AddFieldFilterDialog
                    open={!!addFilterToField}
                    onClose={() => {
                        setAddFilterToField(null);
                    }}
                    onSubmit={(fieldName, fieldValue) => {
                        if (dialogType === 'filter') {
                            if (!fieldValue || typeof fieldValue !== 'object') return;

                            setFieldChips((prev) => {
                                const newChip = {
                                    fieldName,
                                    chipType: 'filter' as const,
                                    filterType: structuredClone(fieldValue),
                                    value:
                                        'filter' in fieldValue
                                            ? fieldValue.filter
                                            : 'values' in fieldValue
                                            ? fieldValue.values
                                            : 'dateFrom' in fieldValue
                                            ? fieldValue.dateFrom
                                            : '',
                                };

                                return [...prev, newChip];
                            });
                        } else if (dialogType === 'default') {
                            if (fieldValue === undefined || fieldValue === null || fieldValue === '') return;

                            const fieldSchema = entityTemplate.properties.properties[fieldName];
                            const fakeTemplateSchema = {
                                ...entityTemplate.properties,
                                required: [],
                                properties: {
                                    [fieldName]: fieldSchema,
                                },
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

                            const propertySchema = entityTemplate.properties.properties[fieldName];
                            const isDateField = propertySchema.format === 'date' || propertySchema.format === 'date-time';
                            const isUsersArray = propertySchema.type === 'array' && propertySchema.items?.format === 'user';

                            let displayValue = fieldValue;
                            if (isDateField && fieldValue) {
                                try {
                                    displayValue = new Date(fieldValue).toLocaleDateString('en-uk');
                                } catch (e) {
                                    console.error('Error formatting date:', e);
                                    displayValue = fieldValue;
                                }
                            } else if (Array.isArray(fieldValue)) {
                                if (isUsersArray) displayValue = fieldValue.map(({ fullName }) => fullName).join(', ');
                                else displayValue = fieldValue.join(', ');
                            } else if (typeof fieldValue === 'boolean') {
                                displayValue = fieldValue ? 'true' : 'false';
                            }

                            setFieldChips((prev) => [
                                ...prev.filter((chip) => !(chip.fieldName === fieldName && chip.chipType === 'default')),
                                {
                                    fieldName,
                                    chipType: 'default' as const,
                                    value: displayValue,
                                },
                            ]);
                        }

                        setAddFilterToField(null);
                    }}
                    updateFieldFilter={addFilterToFieldHandler}
                    entityTemplate={entityTemplate}
                    currentFieldName={addFilterToField}
                    fieldFilter={templateFieldsFilters[addFilterToField]}
                    dialogType={dialogType!}
                />
            )}
        </>
    );
};
export default FieldsAndFiltersTable;
