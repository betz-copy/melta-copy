import { AddRounded } from '@mui/icons-material';
import { Button, Divider, FormControlLabel, Grid, Typography } from '@mui/material';
import i18next from 'i18next';
import React, { useState } from 'react';
import { IFieldChip, ITemplateFieldsFilters } from '../../../interfaces/entityChildTemplates';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { IUser } from '../../../interfaces/users';
import { IAGGidNumberFilter, IAGGridDateFilter, IAGGridSetFilter, IAGGridTextFilter } from '../../../utils/agGrid/interfaces';
import { ColoredEnumChip } from '../../ColoredEnumChip';
import { initializedFilterField } from '../../FilterComponent';
import { getFilterFieldReadonly } from '../../inputs/FilterInputs/ReadonlyFilterInput';
import { MeltaCheckbox } from '../../MeltaCheckbox';
import AddFieldFilterDialog from './AddFieldFilterDialog';
import { environment } from '../../../globals';

const { dateOrDateTimeRegex } = environment;

const getFormattedDefaultValue = (value: string | number | boolean | Date | string[] | undefined): string => {
    if (value === null || value === undefined) return '';
    if (Array.isArray(value))
        return value
            .map((item) => {
                if (typeof item === 'string') return item;
                if (typeof item === 'object') {
                    return (item as IUser).fullName;
                }
                return String(item);
            })
            .join(', ');
    if (typeof value === 'boolean') return i18next.t(`booleanOptions.${value ? 'yes' : 'no'}`);
    if (typeof value === 'string') {
        const isDateTime = dateOrDateTimeRegex.test(value);
        return isDateTime ? new Date(value).toLocaleString('he-IL') : value;
    }
    return String(value);
};

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
                                                    const readonlyField = getFilterFieldReadonly(
                                                        chip.filterType,
                                                        entityTemplate.properties.properties[fieldName].type,
                                                    );

                                                    return (
                                                        <Grid item key={`${fieldName}-filter-${index}`}>
                                                            <ColoredEnumChip
                                                                label={readonlyField}
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
                                                    const defaultValue = getFormattedDefaultValue(chip.value);

                                                    return (
                                                        <Grid item key={`${fieldName}-default`}>
                                                            <ColoredEnumChip
                                                                label={`${defaultValue}`}
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
                                };

                                return [...prev, newChip];
                            });
                        } else if (dialogType === 'default') {
                            if (fieldValue === undefined || fieldValue === null || fieldValue === '') return;

                            setTemplateFieldsFilters((prev) => ({
                                ...prev,
                                [fieldName]: {
                                    ...prev[fieldName],
                                    defaultValue: fieldValue,
                                },
                            }));

                            const displayValue = getFormattedDefaultValue(fieldValue);

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
