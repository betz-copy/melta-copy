import React, { useMemo } from 'react';
import { useFormikContext, getIn, FormikTouched, FormikErrors } from 'formik';
import { Grid, TextField, Button, Typography, IconButton, Autocomplete } from '@mui/material';
import { Add, Clear } from '@mui/icons-material';
import i18next from 'i18next';
import { isEqual } from 'lodash';
import { CommonFormInputProperties, IAGGridFilter, IFilterRelationReference } from '../commonInterfaces';
import { IEntitySingleProperty, IMongoEntityTemplatePopulated } from '../../../../interfaces/entityTemplates';
import { IAGGidNumberFilter, IAGGridDateFilter, IAGGridTextFilter } from '../../../../utils/agGrid/interfaces';
import { DateFilterInput } from '../../../inputs/FilterInputs/DateFilterInput';
import { TextFilterInput } from '../../../inputs/FilterInputs/TextFilterInput';
import { SelectFilterInput } from '../../../inputs/FilterInputs/SelectFilterInput';

interface FilterEntitiesByCriteriaProps {
    name: string; // e.g. "properties[0].relationshipReference.filters"
    selectedEntityTemplate: IMongoEntityTemplatePopulated | undefined;
    initialValue: CommonFormInputProperties | undefined;
    touched?: FormikTouched<CommonFormInputProperties>;
    errors?: FormikErrors<CommonFormInputProperties>;
}

export const FilterEntitiesByCriteria: React.FC<FilterEntitiesByCriteriaProps> = ({
    name,
    selectedEntityTemplate,
    initialValue,
    touched,
    errors,
}) => {
    const { values, setFieldValue } = useFormikContext<any>();
    const filters: IFilterRelationReference[] = useMemo(() => getIn(values, name) || [], [values, name]);
    const initialFilters = initialValue?.relationshipReference?.filters;

    // const errorRelationshipReference = errors?.relationshipReference as FormikErrors<IRelationshipReference> | undefined;
    // const touchedRelationshipReference = touched?.relationshipReference as FormikTouched<IRelationshipReference> | undefined;

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

    const renderFilterField = (filter: IFilterRelationReference, index: number, property: IEntitySingleProperty, isNewProperty: boolean) => {
        const field = filter.filterField;
        if (!field?.filterType || !field.type) return null;

        const { format, enum: propEnum, type, items } = property;

        if (items?.format === 'fileId' || format === 'fileId' || format === 'signature' || format === 'user' || type === 'array') return null;

        // const fieldError = errorRelationshipReference?.filters?.[index];
        // const fieldTouched = touchedRelationshipReference?.filters?.[index];

        if (propEnum) {
            return (
                <SelectFilterInput
                    filterField={field?.filterType === 'text' ? (field as IAGGridTextFilter) : undefined}
                    enumOptions={propEnum}
                    handleFilterFieldChange={(updatedField, condition) => {
                        if (updatedField && (updatedField.filterType === 'text' || updatedField.filterType === 'number')) {
                            handleFilterFieldChange(index, updatedField, condition);
                        }
                    }}
                    readOnly={!isNewProperty}
                />
            );
        }

        if (format === 'date-time' || format === 'date') {
            return (
                <DateFilterInput
                    filterField={field?.filterType === 'date' ? (field as IAGGridDateFilter) : undefined}
                    handleFilterTypeChange={(newType) => handleTypedFilterTypeChange('date', index, newType, field)}
                    handleDateChange={(newValue, isStartDate) => {
                        if (!newValue && field?.filterType === 'date') {
                            const isRemovingStart = isStartDate && !field.dateTo;
                            const isRemovingEnd = !isStartDate && !field.dateFrom;
                            if (isRemovingStart || isRemovingEnd) {
                                // remove the whole filter if both dates are empty
                                handleRemoveFilter(index);
                                return;
                            }
                        }

                        handleFilterFieldChange(index, {
                            ...field,
                            ...(isStartDate ? { dateFrom: newValue } : { dateTo: newValue }),
                        } as IAGGridDateFilter);
                    }}
                    entityFilter
                    readOnly={!isNewProperty}
                />
            );
        }

        if (type === 'boolean') {
            return (
                <SelectFilterInput
                    filterField={field?.filterType === 'text' ? (field as IAGGridTextFilter) : undefined}
                    isBooleanSelect
                    handleFilterFieldChange={(updatedField, condition) => {
                        if (updatedField && (updatedField.filterType === 'text' || updatedField.filterType === 'number')) {
                            handleFilterFieldChange(index, updatedField, condition);
                        }
                    }}
                    readOnly={!isNewProperty}
                />
            );
        }

        return (
            <TextFilterInput
                filterField={field as IAGGidNumberFilter | IAGGridTextFilter}
                handleFilterFieldChange={(updatedField, condition) => {
                    if (updatedField && (updatedField.filterType === 'text' || updatedField.filterType === 'number')) {
                        handleFilterFieldChange(index, updatedField, condition);
                    }
                }}
                handleFilterTypeChange={(newType) => handleTypedFilterTypeChange(field.filterType, index, newType, field)}
                readOnly={!isNewProperty}
                entityFilter
                type={field.filterType}
            />
        );
    };

    const isNewFilter = (filter: IFilterRelationReference): boolean => {
        return !initialFilters?.some((currFilter) => isEqual(currFilter, filter));
    };

    return (
        <Grid container direction="column" marginTop="0.5rem">
            {selectedEntityTemplate && (
                <Grid container direction="column" gap="0.6rem">
                    {filters.map((filter, index) => {
                        const isNewProperty = isNewFilter(filter);
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
                        const selectedProperty =
                            selectedEntityTemplate?.properties.properties[filter.filterProperty] ?? ({} as IEntitySingleProperty);

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
                                    readOnly={!isNewProperty}
                                    disabled={!isNewProperty}
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
