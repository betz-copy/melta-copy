import { Autocomplete, TextField } from '@mui/material';
import { formatDate, isValid as isValidDate, parse } from 'date-fns';
import { FormikErrors } from 'formik';
import i18next from 'i18next';
import { isEqual } from 'lodash';
import React from 'react';
import { useQueryClient } from 'react-query';
import { environment } from '../globals';
import { ByCurrentDefaultValue } from '../interfaces/childTemplates';
import { ViewMode } from '../interfaces/dashboard';
import { IEntitySingleProperty } from '../interfaces/entityTemplates';
import { IGetUnits } from '../interfaces/units';
import { IUser } from '../interfaces/users';
import { IAGGridDateFilter, IAGGridNumberFilter, IAGGridSetFilter, IAGGridTextFilter } from '../utils/agGrid/interfaces';
import { DateFilterInput } from './inputs/FilterInputs/DateFilterInput';
import { MultipleSelectFilterInput } from './inputs/FilterInputs/MultipleSelectFilterInput';
import { MultipleUserFilterInput } from './inputs/FilterInputs/MultipleUserFilterInput';
import { ReadOnlyFilterInput } from './inputs/FilterInputs/ReadonlyFilterInput';
import { SelectFilterInput } from './inputs/FilterInputs/SelectFilterInput';
import { TextFilterInput } from './inputs/FilterInputs/TextFilterInput';
import { FilterType, IAGGridFilter, IFilterTemplate } from './wizards/entityTemplate/commonInterfaces';
import { FieldOption } from './wizards/entityTemplate/RelationshipReference/filterEntitiesByCriteria';

const {
    relativeDateFilters,
    formats: { loggingDate, loggingDateTime },
} = environment;

export const initializedFilterField: Record<string, IAGGridFilter> = {
    'date-time': { filterType: 'date', type: 'equals', dateFrom: null, dateTo: null },
    date: { filterType: 'date', type: 'equals', dateFrom: null, dateTo: null },
    number: { filterType: 'number', type: 'equals' },
    string: { filterType: 'text', type: 'contains' },
    boolean: { filterType: 'text', type: 'equals' },
    array: { filterType: 'set', values: [] },
};

export const isValidAGGridFilter = (filter: IAGGridFilter | undefined): boolean => {
    if (!filter) return false;

    switch (filter.filterType) {
        case 'text':
            return filter.filter !== undefined && filter.filter !== '';
        case 'number':
            return filter.filter !== undefined || (filter.type === 'inRange' && filter.filterTo !== undefined);
        case 'date': {
            if (!filter.dateFrom) return false;
            if (relativeDateFilters.includes(filter.type) || filter.dateFrom === ByCurrentDefaultValue.byCurrentDate) return true;

            const isDateFromValid = isValidDate(parse(filter.dateFrom, loggingDate, new Date()));

            return filter.type === 'inRange' ? isDateFromValid && filter.dateTo !== null : isDateFromValid;
        }
        case 'set':
            return Array.isArray(filter.values) && !!filter.values.length;
        default:
            return false;
    }
};

export const handleRemoveFilter = (filters: IFilterTemplate[], index: number, onChange: (newFiltersArray: IFilterTemplate[]) => void) => {
    const updatedFilters = filters.filter((_, i) => i !== index);
    onChange(updatedFilters);
};

const handleFilterFieldChange = (
    filters: IFilterTemplate[],
    index: number,
    updatedFields: Partial<IAGGridFilter>,
    onChange: (newFiltersArray: IFilterTemplate[]) => void,
    _condition: boolean = true,
) => {
    const current = filters[index]?.filterField;
    const filterType = current?.filterType || updatedFields.filterType || 'text';

    let newFilterField: IAGGridFilter;

    switch (filterType) {
        case 'text':
            newFilterField = {
                ...(current as IAGGridTextFilter),
                ...(updatedFields as Partial<IAGGridTextFilter>),
                filterType: 'text',
            };
            break;

        case 'number':
            newFilterField = {
                ...(current as IAGGridNumberFilter),
                ...(updatedFields as Partial<IAGGridNumberFilter>),
                filterType: 'number',
            };
            break;

        case 'date':
            newFilterField = {
                ...(current as IAGGridDateFilter),
                ...(updatedFields as Partial<IAGGridDateFilter>),
                filterType: 'date',
            };
            break;

        case 'set':
            newFilterField = {
                ...(current as IAGGridSetFilter),
                ...(updatedFields as Partial<IAGGridSetFilter>),
                filterType: 'set',
            };
            break;

        default:
            throw new Error(`Unsupported filterType: ${filterType}`);
    }

    const updatedFilter: IFilterTemplate = {
        ...filters[index],
        filterField: newFilterField,
    };

    const newFiltersArray = [...filters];
    newFiltersArray[index] = updatedFilter;

    onChange(newFiltersArray);
};

const handleTypedFilterTypeChange = (
    filters: IFilterTemplate[],
    filterType: IAGGridFilter['filterType'],
    index: number,
    newType: string,
    field: IAGGridFilter,
    onChange: (newFiltersArray: IFilterTemplate[]) => void,
) => {
    handleFilterFieldChange(
        filters,
        index,
        {
            ...field,
            type: newType,
            ...(filterType === 'date' ? { dateTo: newType === 'inRange' ? (field as IAGGridDateFilter).dateTo : null } : {}),
        } as Partial<IAGGridTextFilter | IAGGridNumberFilter | IAGGridDateFilter>,
        onChange,
    );
};

const handleCheckboxChange = (
    filters: IFilterTemplate[],
    options: (string | null | IUser)[],
    checked: boolean,
    filterField: IAGGridSetFilter,
    index: number,
    onChange: (newFiltersArray: IFilterTemplate[]) => void,
) => {
    const currentValues = filterField.values || [];

    let updatedValues: (string | null | IUser)[];

    if (checked) updatedValues = Array.from(new Set([...currentValues, ...options]));
    else updatedValues = currentValues.filter((value) => !options.some((option) => isEqual(option, value)));

    handleFilterFieldChange(filters, index, { values: updatedValues }, onChange);
};

export const renderFilterInput = (
    filters: IFilterTemplate[],
    filter: IFilterTemplate,
    index: number,
    property: IEntitySingleProperty,
    onChange: (newFiltersArray: IFilterTemplate[]) => void,
    touched?: boolean,
    filterErrors?: string | FormikErrors<IAGGridFilter>,
    readonly?: boolean,
    viewMode?: ViewMode,
    userInput?: { value: string; set: React.Dispatch<React.SetStateAction<string>> },
    fieldFilter?: { propType: IAGGridFilter['filterType']; fieldProperties: FieldOption[] },
) => {
    const field = filter.filterField;

    const queryClient = useQueryClient();
    const units = queryClient.getQueryData<IGetUnits>('getUnits')!;
    const isFieldFilter = filter.filterType === FilterType.field;

    if (isFieldFilter && fieldFilter && field?.filterType !== 'set') {
        return (
            <SelectFilterInput
                enumOptions={fieldFilter.fieldProperties}
                filterField={field}
                handleFilterFieldChange={(updatedField, condition) => {
                    if (updatedField && ['text', 'number', 'date'].includes(updatedField.filterType))
                        handleFilterFieldChange(filters, index, updatedField, onChange, condition);
                }}
                error={Boolean(touched && (filterErrors as IAGGridTextFilter)?.filter)}
                helperText={(filterErrors as IAGGridTextFilter)?.filter}
                readOnly={Boolean(readonly)}
                filterType={{
                    type: fieldFilter.propType,
                    handleFilterTypeChange: (newType) => handleTypedFilterTypeChange(filters, fieldFilter.propType, index, newType, field!, onChange),
                }}
                entityFilter
            />
        );
    }

    if (!field?.filterType) return null;

    const { format, enum: propEnum, type, items, title } = property;

    let readonlyField = field;

    if (format === 'unitField') {
        const unit = units.find(({ _id }) => _id === (field as IAGGridTextFilter).filter);
        if (unit) readonlyField = { ...field, filter: unit.name } as IAGGridTextFilter;
    }

    if (viewMode === ViewMode.ReadOnly) return <ReadOnlyFilterInput filterField={readonlyField} selectedProperty={{ title, type }} />;

    const notIncludedFormats = ['fileId', 'signature', 'comment', ...(!userInput ? ['user'] : [])];
    if (items?.format === 'fileId' || (!userInput && items?.format === 'user') || notIncludedFormats.includes(format ?? '')) return null;

    const enumOptions = propEnum ?? items?.enum;

    if (enumOptions || fieldFilter?.propType === 'set')
        return (
            <MultipleSelectFilterInput
                filterField={field.filterType === 'set' ? field : undefined}
                handleCheckboxChange={(options: (string | null)[], checked: boolean) =>
                    handleCheckboxChange(filters, options, checked, filter.filterField as IAGGridSetFilter, index, onChange)
                }
                enumOptions={
                    isFieldFilter && fieldFilter
                        ? fieldFilter.fieldProperties.map(({ option, label }) => ({ option, label }))
                        : enumOptions!.map((option) => ({ option, label: option }))
                }
                readOnly={Boolean(readonly)}
                isError={Boolean(touched && (filterErrors as IAGGridSetFilter)?.values)}
                helperText={
                    touched
                        ? typeof filterErrors === 'string'
                            ? filterErrors
                            : Array.isArray((filterErrors as IAGGridSetFilter)?.values)
                              ? (filterErrors as IAGGridSetFilter).values.filter(Boolean).join(', ')
                              : ''
                        : ''
                }
            />
        );

    if (format === 'date-time' || format === 'date')
        return (
            <DateFilterInput
                filterField={field?.filterType === 'date' ? (field as IAGGridDateFilter) : undefined}
                handleFilterTypeChange={(newType) => handleTypedFilterTypeChange(filters, 'date', index, newType, field, onChange)}
                handleDateChange={(newValue, isStartDate) => {
                    const dateFormat = format === 'date-time' ? loggingDateTime : loggingDate;
                    const dateString = newValue ? (typeof newValue === 'string' ? newValue : formatDate(newValue, dateFormat)) : null;

                    handleFilterFieldChange(
                        filters,
                        index,
                        {
                            ...field,
                            ...(isStartDate ? { dateFrom: dateString } : { dateTo: dateString }),
                        } as IAGGridDateFilter,
                        onChange,
                    );
                }}
                entityFilter
                readOnly={Boolean(readonly)}
            />
        );

    if (type === 'boolean')
        return (
            <SelectFilterInput
                filterField={field?.filterType === 'text' ? (field as IAGGridTextFilter) : undefined}
                isBooleanSelect
                handleFilterFieldChange={(updatedField, condition) => {
                    if (updatedField && (updatedField.filterType === 'text' || updatedField.filterType === 'number')) {
                        handleFilterFieldChange(filters, index, updatedField, onChange, condition);
                    }
                }}
                error={Boolean(touched && (filterErrors as IAGGridTextFilter)?.filter)}
                helperText={(filterErrors as IAGGridTextFilter)?.filter}
                readOnly={Boolean(readonly)}
            />
        );

    if (items?.format === 'user' && type === 'array' && userInput)
        return (
            <MultipleUserFilterInput
                filterField={field?.filterType === 'set' ? field : undefined}
                inputValue={userInput.value}
                setInputValue={userInput.set}
                handleCheckboxChange={(option: (string | IUser)[], checked: boolean) =>
                    handleCheckboxChange(filters, option, checked, filter.filterField as IAGGridSetFilter, index, onChange)
                }
                readOnly={Boolean(readonly)}
                isError={Boolean(touched && (filterErrors as IAGGridSetFilter)?.values)}
                helperText={
                    touched
                        ? typeof filterErrors === 'string'
                            ? filterErrors
                            : Array.isArray((filterErrors as IAGGridSetFilter)?.values)
                              ? (filterErrors as IAGGridSetFilter).values.filter(Boolean).join(', ')
                              : ''
                        : ''
                }
            />
        );

    if (format === 'unitField') {
        const { filter } = (field ?? {}) as IAGGridTextFilter;

        return (
            <Autocomplete
                options={units.filter((unit) => unit._id !== filter)}
                onChange={(_e, value) => handleFilterFieldChange(filters, index, { ...field, filter: value?._id } as IAGGridTextFilter, onChange)}
                value={units.find((unit) => unit._id === filter)}
                getOptionLabel={(option) => option.name}
                renderInput={(params) => <TextField {...params} variant="outlined" label={i18next.t('childTemplate.selectUnitDialog.label')} />}
                disabled={readonly}
            />
        );
    }

    return (
        <TextFilterInput
            filterField={field as IAGGridNumberFilter | IAGGridTextFilter}
            handleFilterFieldChange={(updatedField, condition) => {
                if (updatedField && (updatedField.filterType === 'text' || updatedField.filterType === 'number')) {
                    handleFilterFieldChange(filters, index, updatedField, onChange, condition);
                }
            }}
            handleFilterTypeChange={(newType) => handleTypedFilterTypeChange(filters, field.filterType, index, newType, field, onChange)}
            readOnly={Boolean(readonly)}
            entityFilter
            type={field.filterType}
            error={Boolean(touched && (filterErrors as IAGGridNumberFilter | IAGGridTextFilter)?.filter)}
            helperText={touched ? (filterErrors as IAGGridTextFilter)?.filter : ''}
        />
    );
};
