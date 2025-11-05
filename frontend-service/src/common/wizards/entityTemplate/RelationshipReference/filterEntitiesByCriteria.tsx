import { Add, Clear } from '@mui/icons-material';
import { Autocomplete, Button, Grid, IconButton, TextField, Typography } from '@mui/material';
import { FormikErrors, FormikTouched, getIn } from 'formik';
import i18next from 'i18next';
import { isEqual } from 'lodash';
import React, { useMemo } from 'react';
import { IEntitySingleProperty, IMongoEntityTemplatePopulated } from '../../../../interfaces/entityTemplates';
import { getPropertyType } from '../../../../services/templates/entityTemplatesService';
import { handleRemoveFilter, initializedFilterField, renderFilterInput } from '../../../FilterComponent';
import { CommonFormInputProperties, FilterType, IAGGridFilter, IFilterTemplate } from '../commonInterfaces';

interface FilterEntitiesByCriteriaProps {
    name: string; // e.g. "properties[0].relationshipReference.filters"
    value: CommonFormInputProperties;
    values;
    setFieldValue: (field: keyof CommonFormInputProperties, value: any) => void;
    selectedEntityTemplate: IMongoEntityTemplatePopulated | undefined;
    initialValue: CommonFormInputProperties | undefined;
    touched?: FormikTouched<CommonFormInputProperties>;
    errors?: FormikErrors<CommonFormInputProperties>;
}

export const FilterEntitiesByCriteria: React.FC<FilterEntitiesByCriteriaProps> = ({
    name,
    value,
    values,
    setFieldValue,
    selectedEntityTemplate,
    initialValue,
    touched,
    errors,
}) => {
    const filters: IFilterTemplate[] = useMemo(() => getIn(value, name) || [], [value, name]);
    const initialFilters = initialValue?.relationshipReference?.filters;

    const notIncludedFormats = ['signature', 'comment'];

    const selectedEntityTemplatePropOptions = useMemo(() => {
        if (!selectedEntityTemplate?.properties) return [];
        const { required, properties } = selectedEntityTemplate.properties;

        return Object.entries(properties)
            .filter(([key, prop]) => required.includes(key) && !notIncludedFormats.includes(prop.format ?? ''))
            .map(([key, prop]) => ({
                key,
                title: prop.title,
            }));
    }, [selectedEntityTemplate]);

    const filterInitialValues: IFilterTemplate = {
        filterProperty: '',
        filterField: {} as IAGGridFilter,
    };

    const handleAddFilter = () => {
        const updatedFilters = [...filters, filterInitialValues];
        const newValues = {
            ...value.relationshipReference,
            filters: updatedFilters,
        };

        setFieldValue('relationshipReference', newValues);
    };

    const isNewFilter = (filter: IFilterTemplate): boolean => !initialFilters?.some((currFilter) => isEqual(currFilter, filter));

    const handleFilterChange = (newFiltersArray: IFilterTemplate[]) => {
        const newValues = {
            ...value.relationshipReference,
            filters: newFiltersArray,
        };

        setFieldValue('relationshipReference', newValues);
    };

    const filterTypes = [
        { value: FilterType.value, label: i18next.t('wizard.entityTemplate.relationshipRef.filterTypes.value') },
        { value: FilterType.field, label: i18next.t('wizard.entityTemplate.relationshipRef.filterTypes.field') },
    ];

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

                        const selectedProperty =
                            selectedEntityTemplate?.properties.properties[filter.filterProperty] ?? ({} as IEntitySingleProperty);

                        const fieldBase = `relationshipReference.filters[${index}]`; // e.g., 'relationshipReference.filters[2]'
                        const filterError: FormikErrors<IFilterTemplate> = getIn(errors, `${fieldBase}`);
                        const filterTouched: FormikTouched<IFilterTemplate> = getIn(touched, `${fieldBase}`);

                        const fieldProperties = values.properties
                            .filter(({ data: { type } }) => getPropertyType(type) === selectedProperty.type && !notIncludedFormats.includes(type))
                            .map(({ data: { title, name } }) => ({ option: name, label: title }));

                        const getFilterType = (): IAGGridFilter['filterType'] => {
                            switch (selectedProperty.type) {
                                case 'string':
                                case 'boolean':
                                    if (selectedProperty.format === 'date-time' || selectedProperty.format === 'date') return 'date';
                                    return 'text';
                                case 'array':
                                    return 'set';
                                default:
                                    return selectedProperty.type;
                            }
                        };

                        return (
                            <Grid container wrap="nowrap" direction="row" width="98%" gap="0.4rem" key={filter.filterProperty || index}>
                                <Autocomplete
                                    id={`autocomplete-${index}`}
                                    options={selectedEntityTemplatePropOptions}
                                    onChange={(_e, selectedField) => {
                                        const selectedKey = selectedField?.key || '';
                                        const selectedProp = selectedEntityTemplate?.properties.properties[selectedKey];
                                        const { format, type, enum: enumValues } = selectedProp;

                                        const newFilterField =
                                            (enumValues && initializedFilterField['array']) ||
                                            (format && initializedFilterField[format]) ||
                                            (type && initializedFilterField[type]);

                                        const newFiltersArray = [...filters];

                                        newFiltersArray[index] = {
                                            filterProperty: selectedKey,
                                            filterField: newFilterField,
                                            filterType: FilterType.value,
                                        };

                                        const newValues = {
                                            ...value.relationshipReference,
                                            filters: newFiltersArray,
                                        };

                                        setFieldValue('relationshipReference', newValues);
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
                                            error={Boolean(filterTouched?.filterProperty && filterError?.filterProperty)}
                                            helperText={filterTouched?.filterProperty ? filterError?.filterProperty : ''}
                                            sx={{ '& .MuiInputBase-root': { borderRadius: '10px' } }}
                                            variant="outlined"
                                            label={i18next.t('wizard.entityTemplate.filterField')}
                                        />
                                    )}
                                    sx={{ width: '250px' }}
                                />

                                <Autocomplete
                                    value={
                                        !filters[index].filterType
                                            ? filterTypes[0]
                                            : filterTypes.find(({ value }) => value === filters[index].filterType)!
                                    }
                                    onChange={(_, { value: newValue }) => {
                                        const newFiltersArray = [...filters];

                                        const selectedKey = newFiltersArray[index]?.filterProperty || '';
                                        const selectedProp = selectedEntityTemplate?.properties.properties[selectedKey];
                                        const { format, type, enum: enumValues } = selectedProp;

                                        const emptyFilterField =
                                            (enumValues && initializedFilterField['array']) ||
                                            (format && initializedFilterField[format]) ||
                                            (type && initializedFilterField[type]);

                                        const newFilterField =
                                            newValue === newFiltersArray[index].filterType ? newFiltersArray[index].filterField : emptyFilterField;

                                        newFiltersArray[index] = {
                                            ...newFiltersArray[index],
                                            filterType: newValue,
                                            filterField: newFilterField,
                                        };

                                        const newValues = {
                                            ...value.relationshipReference,
                                            filters: newFiltersArray,
                                        };

                                        setFieldValue('relationshipReference', newValues);
                                    }}
                                    disabled={!isNewProperty || filter.filterProperty === ''}
                                    options={filterTypes}
                                    renderInput={(params) => (
                                        <TextField {...params} label={i18next.t('wizard.entityTemplate.relationshipRef.filterType')} />
                                    )}
                                    getOptionLabel={(option) => option.label}
                                    disableClearable
                                    sx={{ borderRadius: '10px', borderColor: '#787C9E', height: '40px', width: '150px' }}
                                />

                                <Grid minWidth="50%">
                                    {renderFilterInput(
                                        filters,
                                        filter,
                                        index,
                                        selectedProperty,
                                        handleFilterChange,
                                        filterTouched?.filterField,
                                        filterError?.filterField,
                                        !isNewProperty,
                                        undefined,
                                        undefined,
                                        { propType: getFilterType(), fieldProperties },
                                    )}
                                </Grid>

                                <Grid>
                                    <IconButton onClick={() => handleRemoveFilter(filters, index, handleFilterChange)}>
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
