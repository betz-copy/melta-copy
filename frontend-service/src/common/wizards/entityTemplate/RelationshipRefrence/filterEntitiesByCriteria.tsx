import React, { useMemo } from 'react';
import { useFormikContext, getIn } from 'formik';
import { Grid, TextField, Button, Typography, IconButton, Autocomplete } from '@mui/material';
import { Add, Clear } from '@mui/icons-material';
import i18next from 'i18next';
import { IAGGridFilter, IFilterRelationReference } from '../commonInterfaces';
import { IMongoEntityTemplatePopulated } from '../../../../interfaces/entityTemplates';

interface FilterEntitiesByCriteriaProps {
    name: string; // e.g. "properties[0].relationshipReference.filters"
    selectedEntityTemplate: IMongoEntityTemplatePopulated | null;
}

export const FilterEntitiesByCriteria: React.FC<FilterEntitiesByCriteriaProps> = ({ name, selectedEntityTemplate }) => {
    const { values, setFieldValue } = useFormikContext<any>();
    const filters: IFilterRelationReference[] = useMemo(() => getIn(values, name) || [], [values, name]);

    const templateProperties = selectedEntityTemplate?.properties?.properties || {};
    const requiredKeys = selectedEntityTemplate?.properties?.required || [];

    const selectedEntityTemplatePropOptions = useMemo(() => {
        return Object.entries(templateProperties)
            .filter(([key, _prop]) => requiredKeys.includes(key) && templateProperties[key].format !== 'signature')
            .map(([key, prop]) => ({ key, title: prop.title }));
    }, [templateProperties, requiredKeys]);

    const filterInitialValues: IFilterRelationReference = {
        filterProperty: '',
        filterField: {} as IAGGridFilter,
    };

    const handleFilterFieldChange = (index: number, field: keyof IFilterRelationReference, value: IAGGridFilter) => {
        const updatedFilter = { ...filters[index], [field]: value };
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
        'date-time': { filterType: 'date', type: 'equals', dateFrom: null, dateTo: null },
        date: { filterType: 'date', type: 'equals', dateFrom: null, dateTo: null },
        number: { filterType: 'number', type: 'equals' },
        string: { filterType: 'text', type: 'contains' },
        boolean: { filterType: 'text', type: 'equals' },
        array: { filterType: 'set', values: [] },
    };

    return (
        <Grid container direction="column" gap="0.8rem">
            {selectedEntityTemplate && (
                <Grid container>
                    {filters.map((filter, index) => {
                        const isNewProperty = filter !== filterInitialValues;
                        const isDisabled = !isNewProperty;

                        const getSelectedFilterPropTitle =
                            filter.filterProperty !== '' && templateProperties[filter.filterProperty]
                                ? {
                                      key: filter.filterProperty,
                                      title: templateProperties[filter.filterProperty].title,
                                  }
                                : null;

                        return (
                            <Grid container wrap="nowrap" direction="row" sx={{ margin: '0.3rem 0' }} key={filter.filterProperty || index}>
                                <Autocomplete
                                    id={index.toString()}
                                    options={selectedEntityTemplatePropOptions}
                                    onChange={(_e, selectedField) => {
                                        const selectedKey = selectedField?.key || '';
                                        const selectedProp = templateProperties[selectedKey];
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
                                    sx={{ marginRight: '5px' }}
                                    value={getSelectedFilterPropTitle || null}
                                    disabled={isDisabled}
                                    getOptionLabel={(option) => option.title || ''}
                                    fullWidth
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
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
