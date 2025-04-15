import React, { useMemo } from 'react';
import { useFormikContext, getIn } from 'formik';
import { Grid, TextField, Button, Typography, IconButton, Autocomplete, MenuItem } from '@mui/material';
import { Add, Clear } from '@mui/icons-material';
import i18next from 'i18next';
import { IAGGridFilter, IFilterRelationReference } from '../commonInterfaces';
import { IEntitySingleProperty, IMongoEntityTemplatePopulated } from '../../../../interfaces/entityTemplates';
import { IAGGidNumberFilter, IAGGridDateFilter, IAGGridTextFilter } from '../../../../utils/agGrid/interfaces';
import { DateFilterInput } from '../../../inputs/FilterInputs/DateFilterInput';
import { TextFilterInput } from '../../../inputs/FilterInputs/TextFilterInput';

interface FilterEntitiesByCriteriaProps {
    name: string; // e.g. "properties[0].relationshipReference.filters"
    selectedEntityTemplate: IMongoEntityTemplatePopulated | null;
}

export const FilterEntitiesByCriteria: React.FC<FilterEntitiesByCriteriaProps> = ({ name, selectedEntityTemplate }) => {
    const { values, setFieldValue } = useFormikContext<any>();
    const filters: IFilterRelationReference[] = useMemo(() => getIn(values, name) || [], [values, name]);

    const selectedEntityTemplatePropOptions = useMemo(
        () =>
            Object.entries(selectedEntityTemplate?.properties?.properties || {})
                .filter(
                    ([key, _prop]) =>
                        selectedEntityTemplate?.properties.required.includes(key) &&
                        selectedEntityTemplate?.properties?.properties[key].format !== 'signature',
                )
                .map(([key, prop]) => ({ key, title: prop.title })),
        [selectedEntityTemplate],
    );

    const filterInitialValues: IFilterRelationReference = {
        filterProperty: '',
        filterField: {} as IAGGridFilter,
    };

    const filterTypeOptions = {
        text: ['contains', 'notContains', 'equals', 'notEqual', 'startsWith', 'endsWith'],
        number: ['equals', 'notEqual', 'lessThan', 'lessThanOrEqual', 'greaterThan', 'greaterThanOrEqual', 'inRange'],
        date: ['equals', 'notEqual', 'lessThan', 'greaterThan', 'inRange'],
    };

    const handleFilterFieldChange = (index: number, updatedFields: Partial<IAGGridFilter>, _condition: boolean = true) => {
        const current = filters[index]?.filterField;
        const filterType = current?.filterType || updatedFields.filterType || 'text';

        let newFilterField: IAGGridFilter;

        if (filterType === 'text') {
            newFilterField = {
                ...(current as IAGGridTextFilter),
                ...(updatedFields as Partial<IAGGridTextFilter>),
                filterType: 'text',
            };
        } else if (filterType === 'number') {
            newFilterField = {
                ...(current as IAGGidNumberFilter),
                ...(updatedFields as Partial<IAGGidNumberFilter>),
                filterType: 'number',
            };
        } else if (filterType === 'date') {
            newFilterField = {
                ...(current as IAGGridDateFilter),
                ...(updatedFields as Partial<IAGGridDateFilter>),
                filterType: 'date',
            };
        } else {
            throw new Error(`Unsupported filterType: ${filterType}`);
        }

        const updatedFilter: IFilterRelationReference = {
            ...filters[index],
            filterField: newFilterField,
        };

        const newFiltersArray = [...filters];
        newFiltersArray[index] = updatedFilter;

        setFieldValue(name, newFiltersArray);
    };

    const handleAddFilter = () => {
        const updatedFilters = [...filters, filterInitialValues];
        setFieldValue(name, updatedFilters);
    };

    const handleRemoveFilter = (index: number) => {
        const updatedFilters = filters.filter((_, i) => i !== index);
        setFieldValue(name, updatedFilters);
    };

    const initializedFilterField: Record<string, IAGGridFilter> = {
        'date-time': { filterType: 'date', type: 'equals', dateFrom: '', dateTo: '' },
        date: { filterType: 'date', type: 'equals', dateFrom: '', dateTo: '' },
        number: { filterType: 'number', type: 'equals' },
        string: { filterType: 'text', type: 'contains' },
        boolean: { filterType: 'text', type: 'equals' },
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
            } as Partial<IAGGridDateFilter>);
        }
    };

    const renderFilterField = (filter: IFilterRelationReference, index: number, _property: IEntitySingleProperty, isNewProperty: boolean) => {
        const field = filter.filterField;
        if (!field?.filterType || !field.type) return null;

        switch (field.filterType) {
            case 'text':
            case 'number':
                return (
                    <TextFilterInput
                        filterField={field as IAGGidNumberFilter | IAGGridTextFilter}
                        handleFilterFieldChange={(updatedField, condition) => {
                            if (updatedField && (updatedField.filterType === 'text' || updatedField.filterType === 'number')) {
                                handleFilterFieldChange(index, updatedField, condition);
                            }
                        }}
                        handleFilterTypeChange={(newType) => handleTypedFilterTypeChange(field.filterType, index, newType, field)}
                        readOnly={isNewProperty}
                        entityFilter={false}
                        type={field.filterType}
                    />
                );

            case 'date':
                return (
                    <DateFilterInput
                        filterField={field}
                        handleFilterTypeChange={(newType) => handleTypedFilterTypeChange('date', index, newType, field)}
                        handleDateChange={(newValue, isStart) => {
                            setFieldValue(isStart ? `filters.${index}.dateFrom` : `filters.${index}.dateTo`, newValue);
                        }}
                        entityFilter={false}
                        readOnly={isNewProperty}
                    />
                );

            default:
                return null;
        }
    };

    return (
        <Grid container direction="column" marginTop="0.5rem">
            {selectedEntityTemplate && (
                <Grid container direction="column" gap="0.6rem">
                    {filters.map((filter, index) => {
                        const isNewProperty = JSON.stringify(filter) === JSON.stringify(filterInitialValues);
                        const getSelectedFilterPropTitle =
                            selectedEntityTemplate &&
                            filter.filterProperty !== '' &&
                            selectedEntityTemplate.properties?.properties?.[filter.filterProperty]
                                ? {
                                      key: filter.filterProperty,
                                      title: selectedEntityTemplate.properties.properties[filter.filterProperty].title,
                                  }
                                : null;

                        const filterType = filter.filterField?.filterType;
                        const selectedType = filter.filterField?.type;
                        const selectedProperty =
                            selectedEntityTemplate && filter.filterProperty !== ''
                                ? selectedEntityTemplate.properties.properties[filter.filterProperty]
                                : ({} as IEntitySingleProperty);

                        return (
                            <Grid container wrap="nowrap" direction="row" gap="0.4rem" key={filter.filterProperty || index}>
                                <Autocomplete
                                    id={`autocomplete-${index}`}
                                    options={selectedEntityTemplatePropOptions}
                                    onChange={(_e, selectedField) => {
                                        const selectedKey = selectedField?.key || '';
                                        const selectedProp = selectedEntityTemplate?.properties.properties[selectedKey];
                                        const { format, type } = selectedProp || {};
                                        const newFilterField = (format && initializedFilterField[format]) || (type && initializedFilterField[type]);

                                        const newFiltersArray = [...filters];
                                        newFiltersArray[index] = {
                                            filterProperty: selectedKey,
                                            filterField: newFilterField,
                                        };

                                        setFieldValue(name, newFiltersArray);
                                    }}
                                    isOptionEqualToValue={(option, val) => option.key === val.key}
                                    value={getSelectedFilterPropTitle}
                                    getOptionLabel={(option) => option.title || ''}
                                    fullWidth
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            fullWidth
                                            sx={{ '& .MuiInputBase-root': { borderRadius: '10px' } }}
                                            variant="outlined"
                                            label={i18next.t('wizard.entityTemplate.filterField')}
                                        />
                                    )}
                                />
                                {/* {filterType && (
                                    <TextField
                                        select
                                        fullWidth
                                        value={selectedType || ''}
                                        onChange={(e) =>
                                            handleFilterFieldChange(index, {
                                                type: e.target.value as IAGGridFilter['type'],
                                            })
                                        }
                                        label={i18next.t('wizard.entityTemplate.filterType')}
                                    >
                                        {filterTypeOptions[filterType].map((option) => (
                                            <MenuItem key={option} value={option}>
                                                {option}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                )} */}

                                {filterType && renderFilterField(filter, index, selectedProperty, isNewProperty)}

                                <Grid item>
                                    <IconButton onClick={() => handleRemoveFilter(index)}>
                                        <Clear />
                                    </IconButton>
                                </Grid>
                            </Grid>
                        );
                    })}

                    <Button type="button" variant="text" style={{ alignSelf: 'start' }} onClick={handleAddFilter}>
                        <Typography style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                            <Add />
                            {i18next.t('wizard.entityTemplate.addRelationFilter')}
                        </Typography>
                    </Button>
                </Grid>
            )}
        </Grid>
    );
};
