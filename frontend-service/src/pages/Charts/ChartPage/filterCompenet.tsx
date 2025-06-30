import { Close } from '@mui/icons-material';
import { Autocomplete, Divider, Grid, IconButton, useTheme } from '@mui/material';
import { Box } from '@mui/system';
import { FormikErrors, FormikProps, FormikTouched, getIn } from 'formik';
import i18next from 'i18next';
import React, { useMemo, useState } from 'react';
import { IoIosArrowDown } from 'react-icons/io';
import { useQueryClient } from 'react-query';
import { DateFilterInput } from '../../../common/inputs/FilterInputs/DateFilterInput';
import { MultipleSelectFilterInput } from '../../../common/inputs/FilterInputs/MultipleSelectFilterInput';
import { MultipleUserFilterInput } from '../../../common/inputs/FilterInputs/MultipleUserFilterInput';
import { ReadOnlyFilterInput } from '../../../common/inputs/FilterInputs/ReadonlyFilterInput';
import { SelectFilterInput } from '../../../common/inputs/FilterInputs/SelectFilterInput';
import { StyledFilterInput } from '../../../common/inputs/FilterInputs/StyledFilterInput';
import { TextFilterInput } from '../../../common/inputs/FilterInputs/TextFilterInput';
import { IAGGridFilter, IFilterRelationReference } from '../../../common/wizards/entityTemplate/commonInterfaces';
import { ChartForm, TableForm } from '../../../interfaces/dashboard';
import { IEntitySingleProperty, IEntityTemplateMap } from '../../../interfaces/entityTemplates';
import { useDarkModeStore } from '../../../stores/darkMode';
import { IAGGidNumberFilter, IAGGridDateFilter, IAGGridSetFilter, IAGGridTextFilter } from '../../../utils/agGrid/interfaces';

const FilterCompetent = <T extends TableForm | ChartForm>({
    formik: { values, errors, touched, setFieldValue, handleBlur },
    readonly,
}: {
    formik: FormikProps<T>;
    readonly: boolean;
}) => {
    const queryClient = useQueryClient();
    const theme = useTheme();

    const filters: IFilterRelationReference[] = useMemo(() => getIn(values, 'filter') || [], [values]);

    const darkMode = useDarkModeStore((state) => state.darkMode);

    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;
    const entityTemplate = entityTemplates.get(values.templateId!);
    const [inputValue, setInputValue] = useState<string>('');

    const properties = entityTemplate?.properties.properties;
    const notIncludedFormats = ['fileId', 'signature', 'location', 'comment'];
    const filterProperties = Object.entries(properties ?? {})
        .filter(([_, value]) => !notIncludedFormats.includes(value.format ?? '') && value.items?.format !== 'fileId')
        .map(([key]) => key);

    const initializedFilterField: Record<string, IAGGridFilter> = {
        'date-time': { filterType: 'date', type: 'equals', dateFrom: null, dateTo: null },
        date: { filterType: 'date', type: 'equals', dateFrom: null, dateTo: null },
        number: { filterType: 'number', type: 'equals' },
        string: { filterType: 'text', type: 'contains' },
        boolean: { filterType: 'text', type: 'equals' },
        array: { filterType: 'set', values: [] },
    };

    const handleRemoveFilter = (index: number) => {
        const updatedFilters = filters.filter((_, i) => i !== index);
        setFieldValue('filter', updatedFilters);
    };

    const handleFilterFieldChange = (index: number, updatedFields: Partial<IAGGridFilter>, _condition: boolean = true) => {
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
                    ...(current as IAGGidNumberFilter),
                    ...(updatedFields as Partial<IAGGidNumberFilter>),
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

        const updatedFilter: IFilterRelationReference = {
            ...filters[index],
            filterField: newFilterField,
        };

        const newFiltersArray = [...filters];
        newFiltersArray[index] = updatedFilter;

        setFieldValue('filter', newFiltersArray);
    };

    const handleTypedFilterTypeChange = (filterType: IAGGridFilter['filterType'], index: number, newType: string, field: IAGGridFilter) => {
        if (filterType === 'text') {
            handleFilterFieldChange(index, {
                ...(field as IAGGridTextFilter),
                type: newType as IAGGridTextFilter['type'],
            } as Partial<IAGGridTextFilter>);
        } else if (filterType === 'number') {
            handleFilterFieldChange(index, {
                ...(field as IAGGidNumberFilter),
                type: newType as IAGGidNumberFilter['type'],
            } as Partial<IAGGidNumberFilter>);
        } else if (filterType === 'date') {
            handleFilterFieldChange(index, {
                ...(field as IAGGridDateFilter),
                type: newType as IAGGridDateFilter['type'],
                dateTo: newType === 'inRange' ? (field as IAGGridDateFilter).dateTo : null,
            } as Partial<IAGGridDateFilter>);
        }
    };

    const handleCheckboxChange = (option: string, checked: boolean, filterField: IAGGridSetFilter, index: number) => {
        const currentValues = filterField.values || [];

        let updatedValues: (string | null)[];
        if (checked) updatedValues = currentValues.includes(option) ? currentValues : [...currentValues, option];
        else updatedValues = currentValues.filter((item) => item !== option);

        handleFilterFieldChange(index, { values: updatedValues });
    };

    const renderFilterInput = (
        filter: IFilterRelationReference,
        index: number,
        property: IEntitySingleProperty,
        filterTouched: FormikTouched<IFilterRelationReference>,
        filterErrors?: string | FormikErrors<IAGGridFilter>,
    ) => {
        const field = filter.filterField;
        if (!field?.filterType) return null;

        const { format, enum: propEnum, type, items, title } = property;

        if (readonly) return <ReadOnlyFilterInput filterField={field} selectedProperty={{ title, type }} />;

        if (items?.format === 'fileId' || format === 'fileId' || format === 'signature') return null;

        if (propEnum)
            return (
                <SelectFilterInput
                    filterField={field.filterType === 'text' ? (field as IAGGridTextFilter) : undefined}
                    enumOptions={propEnum}
                    handleFilterFieldChange={(updatedField, condition) => {
                        if (updatedField && (updatedField.filterType === 'text' || updatedField.filterType === 'number')) {
                            handleFilterFieldChange(index, updatedField, condition);
                        }
                    }}
                    error={Boolean(touched && (filterErrors as IAGGridTextFilter)?.filter)}
                    helperText={(filterErrors as IAGGridTextFilter)?.filter}
                />
            );

        if (format === 'date-time' || format === 'date')
            return (
                <DateFilterInput
                    filterField={field?.filterType === 'date' ? (field as IAGGridDateFilter) : undefined}
                    handleFilterTypeChange={(newType) => handleTypedFilterTypeChange('date', index, newType, field)}
                    handleDateChange={(newValue, isStartDate) => {
                        handleFilterFieldChange(index, {
                            ...field,
                            ...(isStartDate ? { dateFrom: newValue } : { dateTo: newValue }),
                        } as IAGGridDateFilter);
                    }}
                    entityFilter
                />
            );

        if (type === 'boolean')
            return (
                <SelectFilterInput
                    filterField={field?.filterType === 'text' ? (field as IAGGridTextFilter) : undefined}
                    isBooleanSelect
                    handleFilterFieldChange={(updatedField, condition) => {
                        if (updatedField && (updatedField.filterType === 'text' || updatedField.filterType === 'number')) {
                            handleFilterFieldChange(index, updatedField, condition);
                        }
                    }}
                    error={Boolean(touched && (filterErrors as IAGGridTextFilter)?.filter)}
                    helperText={(filterErrors as IAGGridTextFilter)?.filter}
                />
            );

        if (items && items?.enum)
            return (
                <MultipleSelectFilterInput
                    filterField={field.filterType === 'set' ? (field as IAGGridSetFilter) : undefined}
                    handleCheckboxChange={(option: string, checked: boolean) =>
                        handleCheckboxChange(option, checked, filter.filterField as IAGGridSetFilter, index)
                    }
                    enumOptions={items?.enum}
                    readOnly={readonly}
                    isError={Boolean(filterTouched && (filterErrors as IAGGridSetFilter)?.values)}
                    helperText={
                        filterTouched
                            ? typeof filterErrors === 'string'
                                ? filterErrors
                                : Array.isArray((filterErrors as IAGGridSetFilter)?.values)
                                ? (filterErrors as IAGGridSetFilter).values.filter(Boolean).join(', ')
                                : ''
                            : ''
                    }
                />
            );

        if (items?.format === 'user' && type === 'array')
            return (
                <MultipleUserFilterInput
                    filterField={field?.filterType === 'set' ? (field as IAGGridSetFilter) : undefined}
                    inputValue={inputValue}
                    setInputValue={setInputValue}
                    handleCheckboxChange={(option: string, checked: boolean) =>
                        handleCheckboxChange(option, checked, filter.filterField as IAGGridSetFilter, index)
                    }
                    readOnly={readonly}
                    isError={Boolean(filterTouched && (filterErrors as IAGGridSetFilter)?.values)}
                    helperText={
                        filterTouched
                            ? typeof filterErrors === 'string'
                                ? filterErrors
                                : Array.isArray((filterErrors as IAGGridSetFilter)?.values)
                                ? (filterErrors as IAGGridSetFilter).values.filter(Boolean).join(', ')
                                : ''
                            : ''
                    }
                />
            );

        return (
            <TextFilterInput
                filterField={field as IAGGidNumberFilter | IAGGridTextFilter}
                handleFilterFieldChange={(updatedField, condition) => {
                    if (updatedField && (updatedField.filterType === 'text' || updatedField.filterType === 'number')) {
                        handleFilterFieldChange(index, updatedField, condition);
                    }
                }}
                handleFilterTypeChange={(newType) => handleTypedFilterTypeChange(field.filterType, index, newType, field)}
                readOnly={false}
                entityFilter
                type={field.filterType}
                error={Boolean(filterTouched && (filterErrors as IAGGidNumberFilter | IAGGridTextFilter)?.filter)}
                helperText={filterTouched ? (filterErrors as IAGGridTextFilter)?.filter : ''}
            />
        );
    };

    let backgroundColor = '#EBEFFA33';
    if (readonly) backgroundColor = darkMode ? '#121212' : 'white';
    else backgroundColor = darkMode ? '#4a4a5033' : '#EBEFFA33';

    return (
        <Box display="flex" flexDirection="column" style={{ paddingLeft: '10px' }}>
            <Box zIndex="100">
                {filters?.map((filter, index) => {
                    const filterType = filter.filterField?.filterType;
                    const selectedProperty = entityTemplate?.properties.properties[filter.filterProperty] ?? ({} as IEntitySingleProperty);

                    const fieldBase = `filter[${index}]`; // e.g., 'relationshipReference.filters[2]'

                    const filterError: FormikErrors<IFilterRelationReference> = getIn(errors, `${fieldBase}`);
                    const filterTouched: FormikTouched<IFilterRelationReference> = getIn(touched, `${fieldBase}`);

                    return (
                        <Grid key={fieldBase}>
                            <Grid sx={{ borderRadius: '10px', backgroundColor }}>
                                <Grid
                                    item
                                    sx={{
                                        height: !readonly ? '90px' : undefined,
                                        display: 'flex',
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                    }}
                                >
                                    {!readonly && (
                                        <Autocomplete
                                            id={`autocomplete-${index}`}
                                            popupIcon={<IoIosArrowDown size="15px" />}
                                            onBlur={handleBlur}
                                            clearIcon={<Close sx={{ fontSize: '16px' }} />}
                                            size="small"
                                            options={filterProperties}
                                            onChange={(_e, selectedField) => {
                                                const selectedKey = selectedField || '';
                                                const selectedProp = entityTemplate?.properties.properties[selectedKey];
                                                const { format, type } = selectedProp || {};
                                                const newFilterField =
                                                    (format && initializedFilterField[format]) || (type && initializedFilterField[type]);

                                                const newFiltersArray = [...filters];
                                                newFiltersArray[index] = {
                                                    filterProperty: selectedKey,
                                                    filterField: newFilterField,
                                                };

                                                setFieldValue('filter', newFiltersArray);
                                            }}
                                            sx={{ width: '90%', marginLeft: '5%' }}
                                            value={filter.filterProperty}
                                            getOptionLabel={(option) =>
                                                entityTemplate?.properties.properties[option]
                                                    ? entityTemplate.properties.properties[option].title
                                                    : ''
                                            }
                                            isOptionEqualToValue={(option, value) => option === value}
                                            getOptionDisabled={(option) => {
                                                const propertyTemplate = entityTemplate?.properties.properties[option];
                                                if (propertyTemplate?.format === 'relationshipReference') {
                                                    const relatedTemplateId = propertyTemplate.relationshipReference?.relatedTemplateId!;
                                                    return !entityTemplates?.get(relatedTemplateId);
                                                }
                                                return false;
                                            }}
                                            renderInput={(params) => (
                                                <StyledFilterInput
                                                    {...params}
                                                    variant="outlined"
                                                    error={Boolean(filterTouched && filterError?.filterProperty)}
                                                    helperText={filterTouched ? filterError?.filterProperty : ''}
                                                    sx={{ borderRadius: '5px' }}
                                                    label={i18next.t('charts.field')}
                                                />
                                            )}
                                        />
                                    )}
                                    {!readonly && (
                                        <IconButton onClick={() => handleRemoveFilter(index)}>
                                            <Close fontSize="small" sx={{ color: theme.palette.primary.main }} />
                                        </IconButton>
                                    )}
                                </Grid>

                                {filterType && (
                                    <Grid item container justifyContent="center">
                                        <Grid item style={{ width: '90%', paddingBottom: '10px' }}>
                                            {renderFilterInput(filter, index, selectedProperty, filterTouched, filterError?.filterField)}
                                        </Grid>
                                    </Grid>
                                )}
                            </Grid>
                            {readonly ? (
                                <Box sx={{ height: '3px', width: '100%', my: 1 }} />
                            ) : (
                                <Divider sx={{ width: '100%', my: 1, borderColor: '#EBEFFA' }} />
                            )}
                        </Grid>
                    );
                })}
            </Box>
        </Box>
    );
};

export default FilterCompetent;
