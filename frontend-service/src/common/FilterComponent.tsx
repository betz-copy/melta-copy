import { Autocomplete, TextField } from '@mui/material';
import { ByCurrentDefaultValue } from '@packages/child-template';
import { IEntitySingleProperty } from '@packages/entity-template';
import {
    BasicFilterOperationTypes,
    FilterTypes,
    IAgGridDateFilter,
    IAgGridNumberFilter,
    IAgGridSetFilter,
    IAgGridTextFilter,
    isBlankOrNotBlankFilter,
    isRelativeDateFilter,
    NumberFilterOperationTypes,
    TextFilterOperationTypes,
} from '@packages/rule-breach';
import { IGetUnits } from '@packages/unit';
import { IUser } from '@packages/user';
import { formatDate, isValid as isValidDate, parse } from 'date-fns';
import { FormikErrors } from 'formik';
import i18next from 'i18next';
import { isEqual } from 'lodash';
import React from 'react';
import { useQueryClient } from 'react-query';
import { environment } from '../globals';
import { ViewMode } from '../interfaces/dashboard';
import { DateFilterInput } from './inputs/FilterInputs/DateFilterInput';
import { MultipleSelectFilterInput } from './inputs/FilterInputs/MultipleSelectFilterInput';
import { MultipleUserFilterInput } from './inputs/FilterInputs/MultipleUserFilterInput';
import { ReadOnlyFilterInput } from './inputs/FilterInputs/ReadonlyFilterInput';
import { SelectFilterInput } from './inputs/FilterInputs/SelectFilterInput';
import { TextFilterInput } from './inputs/FilterInputs/TextFilterInput';
import { FilterType, IAgGridFilter, IFilterTemplate } from './wizards/entityTemplate/commonInterfaces';
import { FieldOption } from './wizards/entityTemplate/RelationshipReference/filterEntitiesByCriteria';

const { loggingDate, loggingDateTime } = environment.formats;

export const initializedFilterField: Record<string, IAgGridFilter> = {
    'date-time': { filterType: FilterTypes.date, type: BasicFilterOperationTypes.equals, dateFrom: null, dateTo: null },
    date: { filterType: FilterTypes.date, type: BasicFilterOperationTypes.equals, dateFrom: null, dateTo: null },
    number: { filterType: FilterTypes.number, type: BasicFilterOperationTypes.equals },
    string: { filterType: FilterTypes.text, type: TextFilterOperationTypes.contains },
    boolean: { filterType: FilterTypes.text, type: BasicFilterOperationTypes.equals },
    array: { filterType: FilterTypes.set, values: [] },
};

export const isValidAGGridFilter = (filter: IAgGridFilter | undefined): boolean => {
    if (!filter) return false;

    if (filter.filterType !== FilterTypes.set && isBlankOrNotBlankFilter(filter.type)) return true;

    switch (filter.filterType) {
        case FilterTypes.text:
            return filter.filter !== undefined && filter.filter !== '';
        case FilterTypes.number:
            return filter.filter !== undefined || (filter.type === NumberFilterOperationTypes.inRange && filter.filterTo !== undefined);
        case FilterTypes.date: {
            if (!filter.dateFrom) return false;
            if (isRelativeDateFilter(filter.type) || filter.dateFrom === ByCurrentDefaultValue.byCurrentDate) return true;

            const isDateFromValid = isValidDate(parse(filter.dateFrom, loggingDate, new Date()));

            return filter.type === NumberFilterOperationTypes.inRange ? isDateFromValid && filter.dateTo !== null : isDateFromValid;
        }
        case FilterTypes.set:
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
    updatedFields: Partial<IAgGridFilter>,
    onChange: (newFiltersArray: IFilterTemplate[]) => void,
    _condition: boolean = true,
) => {
    const current = filters[index]?.filterField;
    const filterType = current?.filterType || updatedFields.filterType || FilterTypes.text;

    let newFilterField: IAgGridFilter;

    switch (filterType) {
        case FilterTypes.text:
            newFilterField = {
                ...(current as IAgGridTextFilter),
                ...(updatedFields as Partial<IAgGridTextFilter>),
                filterType: FilterTypes.text,
            };
            break;

        case FilterTypes.number:
            newFilterField = {
                ...(current as IAgGridNumberFilter),
                ...(updatedFields as Partial<IAgGridNumberFilter>),
                filterType: FilterTypes.number,
            };
            break;

        case FilterTypes.date:
            newFilterField = {
                ...(current as IAgGridDateFilter),
                ...(updatedFields as Partial<IAgGridDateFilter>),
                filterType: FilterTypes.date,
            };
            break;

        case FilterTypes.set:
            newFilterField = {
                ...(current as IAgGridSetFilter),
                ...(updatedFields as Partial<IAgGridSetFilter>),
                filterType: FilterTypes.set,
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
    filterType: IAgGridFilter['filterType'],
    index: number,
    newType: string,
    field: IAgGridFilter,
    onChange: (newFiltersArray: IFilterTemplate[]) => void,
) => {
    handleFilterFieldChange(
        filters,
        index,
        {
            ...field,
            type: newType,
            ...(filterType === FilterTypes.date
                ? { dateTo: newType === NumberFilterOperationTypes.inRange ? (field as IAgGridDateFilter).dateTo : null }
                : {}),
        } as Partial<IAgGridTextFilter | IAgGridNumberFilter | IAgGridDateFilter>,
        onChange,
    );
};

const handleCheckboxChange = (
    filters: IFilterTemplate[],
    options: (string | null | IUser)[],
    checked: boolean,
    filterField: IAgGridSetFilter,
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
    filterErrors?: string | FormikErrors<IAgGridFilter>,
    readonly?: boolean,
    viewMode?: ViewMode,
    userInput?: { value: string; set: React.Dispatch<React.SetStateAction<string>> },
    fieldFilter?: { propType: IAgGridFilter['filterType']; fieldProperties: FieldOption[] },
) => {
    const field = filter.filterField;

    const queryClient = useQueryClient();
    const units = queryClient.getQueryData<IGetUnits>('getUnits')!;
    const isFieldFilter = filter.filterType === FilterType.field;

    if (isFieldFilter && fieldFilter && field?.filterType !== FilterTypes.set) {
        return (
            <SelectFilterInput
                enumOptions={fieldFilter.fieldProperties}
                filterField={field}
                handleFilterFieldChange={(updatedField, condition) => {
                    if (updatedField && [FilterTypes.text, FilterTypes.number, FilterTypes.date].includes(updatedField.filterType))
                        handleFilterFieldChange(filters, index, updatedField, onChange, condition);
                }}
                error={Boolean(touched && (filterErrors as IAgGridTextFilter)?.filter)}
                helperText={(filterErrors as IAgGridTextFilter)?.filter}
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
        const unit = units.find(({ _id }) => _id === (field as IAgGridTextFilter).filter);
        if (unit) readonlyField = { ...field, filter: unit.name } as IAgGridTextFilter;
    }

    if (viewMode === ViewMode.ReadOnly) return <ReadOnlyFilterInput filterField={readonlyField} selectedProperty={{ title, type }} />;

    const notIncludedFormats = ['fileId', 'signature', 'comment', ...(!userInput ? ['user'] : [])];
    if (items?.format === 'fileId' || (!userInput && items?.format === 'user') || notIncludedFormats.includes(format ?? '')) return null;

    const enumOptions = propEnum ?? items?.enum;

    if (enumOptions || fieldFilter?.propType === 'set')
        return (
            <MultipleSelectFilterInput
                filterField={field.filterType === FilterTypes.set ? field : undefined}
                handleCheckboxChange={(options: (string | null)[], checked: boolean) =>
                    handleCheckboxChange(filters, options, checked, filter.filterField as IAgGridSetFilter, index, onChange)
                }
                enumOptions={
                    isFieldFilter && fieldFilter
                        ? fieldFilter.fieldProperties.map(({ option, label }) => ({ option, label }))
                        : enumOptions!.map((option) => ({ option, label: option }))
                }
                readOnly={Boolean(readonly)}
                isError={Boolean(touched && (filterErrors as IAgGridSetFilter)?.values)}
                helperText={
                    touched
                        ? typeof filterErrors === 'string'
                            ? filterErrors
                            : Array.isArray((filterErrors as IAgGridSetFilter)?.values)
                              ? (filterErrors as IAgGridSetFilter).values.filter(Boolean).join(', ')
                              : ''
                        : ''
                }
            />
        );

    if (format === 'date-time' || format === 'date')
        return (
            <DateFilterInput
                filterField={field?.filterType === FilterTypes.date ? (field as IAgGridDateFilter) : undefined}
                handleFilterTypeChange={(newType) => handleTypedFilterTypeChange(filters, FilterTypes.date, index, newType, field, onChange)}
                handleDateChange={(newValue, isStartDate) => {
                    const dateFormat = format === 'date-time' ? loggingDateTime : loggingDate;
                    const dateString = newValue ? (typeof newValue === 'string' ? newValue : formatDate(newValue, dateFormat)) : null;

                    handleFilterFieldChange(
                        filters,
                        index,
                        {
                            ...field,
                            ...(isStartDate ? { dateFrom: dateString } : { dateTo: dateString }),
                        } as IAgGridDateFilter,
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
                filterField={field?.filterType === FilterTypes.text ? (field as IAgGridTextFilter) : undefined}
                isBooleanSelect
                handleFilterFieldChange={(updatedField, condition) => {
                    if (updatedField && (updatedField.filterType === FilterTypes.text || updatedField.filterType === FilterTypes.number)) {
                        handleFilterFieldChange(filters, index, updatedField, onChange, condition);
                    }
                }}
                error={Boolean(touched && (filterErrors as IAgGridTextFilter)?.filter)}
                helperText={(filterErrors as IAgGridTextFilter)?.filter}
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
                    handleCheckboxChange(filters, option, checked, filter.filterField as IAgGridSetFilter, index, onChange)
                }
                readOnly={Boolean(readonly)}
                isError={Boolean(touched && (filterErrors as IAgGridSetFilter)?.values)}
                helperText={
                    touched
                        ? typeof filterErrors === 'string'
                            ? filterErrors
                            : Array.isArray((filterErrors as IAgGridSetFilter)?.values)
                              ? (filterErrors as IAgGridSetFilter).values.filter(Boolean).join(', ')
                              : ''
                        : ''
                }
            />
        );

    if (format === 'unitField') {
        const { filter } = (field ?? {}) as IAgGridTextFilter;

        return (
            <Autocomplete
                options={units.filter((unit) => unit._id !== filter)}
                onChange={(_e, value) => handleFilterFieldChange(filters, index, { ...field, filter: value?._id } as IAgGridTextFilter, onChange)}
                value={units.find((unit) => unit._id === filter)}
                getOptionLabel={(option) => option.name}
                renderInput={(params) => <TextField {...params} variant="outlined" label={i18next.t('childTemplate.selectUnitDialog.label')} />}
                disabled={readonly}
            />
        );
    }

    return (
        <TextFilterInput
            filterField={field as IAgGridNumberFilter | IAgGridTextFilter}
            handleFilterFieldChange={(updatedField, condition) => {
                if (updatedField && (updatedField.filterType === FilterTypes.text || updatedField.filterType === FilterTypes.number)) {
                    handleFilterFieldChange(filters, index, updatedField, onChange, condition);
                }
            }}
            handleFilterTypeChange={(newType) => handleTypedFilterTypeChange(filters, field.filterType, index, newType, field, onChange)}
            readOnly={Boolean(readonly)}
            entityFilter
            type={field.filterType}
            error={Boolean(touched && (filterErrors as IAgGridNumberFilter | IAgGridTextFilter)?.filter)}
            helperText={touched ? (filterErrors as IAgGridTextFilter)?.filter : ''}
        />
    );
};
