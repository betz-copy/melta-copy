import React, { useState } from 'react';
import { useFormikContext, getIn } from 'formik';
import { Grid, TextField, Button, Typography, IconButton, Autocomplete } from '@mui/material';
import { Add, Clear } from '@mui/icons-material';
import i18next from 'i18next';
import { IAGGridFilter, IFilterRelationReference } from '../commonInterfaces';
import { IEntitySingleProperty, IMongoEntityTemplatePopulated } from '../../../../interfaces/entityTemplates';
import { IAGGidNumberFilter, IAGGridDateFilter, IAGGridSetFilter, IAGGridTextFilter } from '../../../../utils/agGrid/interfaces';
import { SelectFilterInput } from '../../../inputs/FilterInputs/SelectFilterInput';
import { DateFilterInput } from '../../../inputs/FilterInputs/DateFilterInput';
import { MultipleSelectFilterInput } from '../../../inputs/FilterInputs/MultipleSelectFilterInput';
import { MultipleUserFilterInput } from '../../../inputs/FilterInputs/MultipleUserFilterInput';
import { TextFilterInput } from '../../../inputs/FilterInputs/TextFilterInput';

interface FilterEntitiesByCriteriaProps {
    name: string; // e.g. "properties[0].relationshipReference.filters"
    selectedEntityTemplate: IMongoEntityTemplatePopulated | null;
}

export const FilterEntitiesByCriteria: React.FC<FilterEntitiesByCriteriaProps> = ({ name, selectedEntityTemplate }) => {
    const { values, setFieldValue } = useFormikContext<any>();
    const filters: IFilterRelationReference[] = getIn(values, name) || [];
    const selectedEntityTemplatePropOptions = Object.entries(selectedEntityTemplate?.properties?.properties || {})
        .filter(
            ([key, _prop]) =>
                selectedEntityTemplate?.properties.required.includes(key) &&
                selectedEntityTemplate?.properties?.properties[key].format !== 'signature',
        )
        .map(([key, prop]) => ({ key, title: prop.title }));

    const filterInitialValues: IFilterRelationReference = {
        filterProperty: '',
        filterField: {} as IAGGridFilter,
    };

    // const handleChange = (index: number, field: keyof IFilterRelationReference, value: IAGGridFilter) => {
    //     const updatedFilter = { ...filters[index], [field]: value };
    //     const newFiltersArray = [...filters];
    //     newFiltersArray[index] = updatedFilter;

    //     setFieldValue(name, newFiltersArray);
    // };

    const handleFilterFieldChange = (index: number, field: keyof IFilterRelationReference, value: IAGGridFilter) => {
        const updatedFilter = { ...filters[index], [field]: value };
        const newFiltersArray = [...filters];
        newFiltersArray[index] = updatedFilter;

        setFieldValue(name, newFiltersArray);
    };

    // const handleFilterTypeChange = (
    //     index: number,
    //     field: keyof IFilterRelationReference,
    //     filterField: IAGGridFilter,
    //     newTypeFilter: IAGGridDateFilter['type'] | IAGGridTextFilter['type'] | IAGGidNumberFilter['type'],
    // ) => handleFilterFieldChange(index, field, { ...filterField, type: newTypeFilter } as IAGGridDateFilter | IAGGridTextFilter | IAGGidNumberFilter);

    const handleAddFilter = () => {
        const updatedFilters = [...filters, filterInitialValues];
        setFieldValue(name, updatedFilters);
    };

    const handleRemoveFilter = (index: number) => {
        const updatedFilters = filters.filter((_, i) => i !== index);
        setFieldValue(name, updatedFilters);
    };

    const initializedFilterField: Record<string, IAGGridFilter> = {
        'date-time': { filterType: 'date', type: 'equals', dateFrom: null, dateTo: null },
        date: { filterType: 'date', type: 'equals', dateFrom: null, dateTo: null },
        number: { filterType: 'number', type: 'equals' },
        string: { filterType: 'text', type: 'contains' },
        boolean: { filterType: 'text', type: 'equals' },
        array: { filterType: 'set', values: [] },
    };

    // const [inputValue, setInputValue] = useState<string>('');

    // const renderFilterInput = (
    //     selectedProperty: string,
    //     filterField: IAGGridFilter,
    //     index: number,
    //     field: keyof IFilterRelationReference,
    //     readOnly: boolean = false,
    //     entityFilter: boolean = false,
    // ) => {
    //     if (!(selectedProperty && selectedEntityTemplate)) return null;
    //     const { format, enum: propEnum, type, items } = selectedEntityTemplate.properties.properties[selectedProperty];
    //     // no files in graph filter
    //     if (items?.format === 'fileId' || format === 'fileId' || format === 'signature') return null;

    //     if (propEnum)
    //         return (
    //             <SelectFilterInput
    //                 filterField={filterField?.filterType === 'text' ? (filterField as IAGGridTextFilter) : undefined}
    //                 enumOptions={propEnum}
    //                 readOnly={readOnly}
    //                 index={index}
    //                 field={field}
    //                 handleFilterFieldChangeByIndex={handleFilterFieldChange}
    //             />
    //         );

    //     if (format === 'date-time' || format === 'date')
    //         return (
    //             <DateFilterInput
    //                 filterField={filterField?.filterType === 'date' ? (filterField as IAGGridDateFilter) : undefined}
    //                 handleFilterTypeChange={handleFilterTypeChange}
    //                 handleDateChange={handleDateChange}
    //                 readOnly={readOnly}
    //                 entityFilter={entityFilter}
    //             />
    //         );

    //     if (type === 'boolean')
    //         return (
    //             <SelectFilterInput
    //                 filterField={filterField?.filterType === 'text' ? (filterField as IAGGridTextFilter) : undefined}
    //                 isBooleanSelect
    //                 handleFilterFieldChange={handleFilterFieldChange}
    //                 readOnly={readOnly}
    //             />
    //         );

    //     if (items && selectedEntityTemplate.properties.properties[selectedProperty].items?.enum)
    //         return (
    //             <MultipleSelectFilterInput
    //                 filterField={filterField?.filterType === 'set' ? (filterField as IAGGridSetFilter) : undefined}
    //                 handleCheckboxChange={handleCheckboxChange}
    //                 enumOptions={items?.enum}
    //                 readOnly={readOnly}
    //             />
    //         );

    //     if (items?.format === 'user' && type === 'array')
    //         return (
    //             <MultipleUserFilterInput
    //                 filterField={filterField?.filterType === 'set' ? (filterField as IAGGridSetFilter) : undefined}
    //                 inputValue={inputValue}
    //                 setInputValue={setInputValue}
    //                 handleCheckboxChange={handleCheckboxChange}
    //                 readOnly={readOnly}
    //             />
    //         );

    //     return (
    //         <TextFilterInput
    //             entityFilter={entityFilter}
    //             filterField={
    //                 filterField?.filterType === 'number' || filterField?.filterType === 'text'
    //                     ? (filterField as IAGGidNumberFilter | IAGGridTextFilter)
    //                     : undefined
    //             }
    //             handleFilterFieldChange={handleFilterFieldChange}
    //             handleFilterTypeChange={handleFilterTypeChange}
    //             type={type}
    //             readOnly={readOnly}
    //         />
    //     );
    // };

    return (
        <Grid container direction="column" gap="0.8rem">
            {selectedEntityTemplate && (
                <Grid container>
                    {filters.map((filter, index) => {
                        const isNewProperty = filterInitialValues !== filter;
                        const isDisabled = !isNewProperty;

                        const getSelectedFilterPropTitle =
                            selectedEntityTemplate &&
                            filter.filterProperty !== '' &&
                            selectedEntityTemplate.properties?.properties?.[filter.filterProperty]
                                ? {
                                      key: filter.filterProperty,
                                      title: selectedEntityTemplate.properties.properties[filter.filterProperty].title,
                                  }
                                : null;

                        return (
                            <Grid container wrap="nowrap" direction="row" sx={{ margin: '0.3rem 0' }} key={filter.filterProperty}>
                                <Autocomplete
                                    id={index.toString()}
                                    options={selectedEntityTemplatePropOptions}
                                    onChange={(_e, selectedField) => {
                                        const newProperty = selectedField?.key || '';
                                        const prop = selectedEntityTemplate?.properties.properties[newProperty];
                                        const { format, type } = prop;
                                        const newFilterField = (format && initializedFilterField[format]) || (type && initializedFilterField[type]);

                                        const newFiltersArray = [...filters];
                                        newFiltersArray[index] = {
                                            filterProperty: newProperty,
                                            filterField: newFilterField,
                                        };

                                        setFieldValue(name, newFiltersArray);
                                    }}
                                    isOptionEqualToValue={(option, val) => option.key === val.key}
                                    sx={{ marginRight: '5px' }}
                                    value={getSelectedFilterPropTitle}
                                    disabled={isDisabled}
                                    getOptionLabel={(option) => option.title || ''}
                                    fullWidth
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            size="small"
                                            fullWidth
                                            sx={{
                                                '& .MuiInputBase-root': {
                                                    borderRadius: '10px',
                                                },
                                            }}
                                            name="template"
                                            variant="outlined"
                                            label={i18next.t('wizard.entityTemplate.filterField')}
                                        />
                                    )}
                                />

                                {/* {filter.filterProperty !== '' && filter.filterField && (
                                    <Grid container>{renderFilterInput(filter.filterProperty, filter.filterField, index, 'filterField')}</Grid>
                                )} */}

                                {/* {filter.filterField?.filterType === 'text' && (
                                    <TextField
                                        label={i18next.t('wizard.entityTemplate.filterValue')}
                                        value={(filter.filterField as IAGGridTextFilter).filter ?? ''}
                                        onChange={(e) => {
                                            const updatedField = { ...filter.filterField, filter: e.target.value } as IAGGridTextFilter;
                                            handleChange(index, 'filterField', updatedField);
                                        }}
                                        sx={{ marginRight: '5px' }}
                                        fullWidth
                                    />
                                )}
                                {filter.filterField?.filterType === 'number' && (
                                    <TextField
                                        type="number"
                                        label={i18next.t('wizard.entityTemplate.filterValue')}
                                        value={(filter.filterField as IAGGidNumberFilter).filter ?? ''}
                                        onChange={(e) => {
                                            const updatedField = {
                                                ...filter.filterField,
                                                filter: parseFloat(e.target.value) || 0,
                                            } as IAGGidNumberFilter;
                                            handleChange(index, 'filterField', updatedField);
                                        }}
                                        sx={{ marginRight: '5px' }}
                                        fullWidth
                                    />
                                )} */}
                                <IconButton onClick={() => handleRemoveFilter(index)}>
                                    <Clear />
                                </IconButton>
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
